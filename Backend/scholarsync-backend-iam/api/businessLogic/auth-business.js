import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validatePassword, checkDuplicateFields, Lecture, STATUS_CODE, ERRORS, sendResponse, ACTIVITY_TYPE, USER_STATUS, USER_ROLE } from 'scholarsync-backend-common';
import { loginSchema, updatePasswordSchema, registerSchema, bulkRegisterSchema } from '../../model-validators/auth-validator.js';
import { BULK_REGISTER_LIMIT } from '../../constants/application-constants.js';
import authService from '../service/auth-service.js';
import studentService from '../service/student-service.js';
import teacherService from '../service/teacher-service.js';
import axios from 'axios';

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;
};

const formatLockoutTime = (totalSec) => {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour(s)`);
  if (minutes > 0) parts.push(`${minutes} minute(s)`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second(s)`);
  return parts.join(' ');
};

const login = async (email, password, req) => {
  const { error } = loginSchema.validate({ email, password });
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'login');

  const { user, role } = await authService.findUserByEmail(email);
  if (!user) {
    return sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1002' }, 'login');
  }

  // Check if user account is active
  if (user.status === USER_STATUS.DISABLED) {
    return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1027' }, 'login');
  }

  // Brute force lockout — only for students and teachers, never admins or superadmins
  if (role !== USER_ROLE.ADMIN && role !== USER_ROLE.SUPERADMIN) {
    const lockoutStatus = await authService.checkLoginAttempts(email);
    if (lockoutStatus.locked) {
      if (lockoutStatus.permanent) {
        return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1026' }, 'login');
      }
      return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1025' }, 'login', { time: formatLockoutTime(lockoutStatus.lockoutSeconds) });
    }
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    // Record failed attempt (for all roles, but lockout only enforced for non-admins)
    await authService.logActivity(email, ACTIVITY_TYPE.LOGIN_FAILED, getClientIP(req), null, role);

    if (role !== USER_ROLE.ADMIN && role !== USER_ROLE.SUPERADMIN) {
      const updatedStatus = await authService.checkLoginAttempts(email);
      if (updatedStatus.permanent) {
        await authService.disableUser(user.userId);
        return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1026' }, 'login');
      }
      if (updatedStatus.locked) {
        return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1025' }, 'login', { time: formatLockoutTime(updatedStatus.lockoutSeconds) });
      }
      return sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1003' }, 'login', { remaining: String(updatedStatus.remaining) });
    }

    return sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1036' }, 'login');
  }

  // IP restriction check for students
  let sessionIP = null;
  if (role === USER_ROLE.STUDENT) {
    const ipState = await authService.getIPRestrictionState();
    if (ipState.enabled && ipState.allowedIPs.length > 0) {
      const clientIP = getClientIP(req);
      const normalizedClientIP = clientIP === '::1' ? '127.0.0.1' : clientIP.replace(/^::ffff:/, '');
      const isAllowed = ipState.allowedIPs.some(allowed => allowed.ipAddress === normalizedClientIP);
      if (!isAllowed) {
        return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1004' }, 'login');
      }
      sessionIP = normalizedClientIP;
    }
  }

  // Update session — invalidates any previous session
  await authService.updateSessionId(user);

  // Record successful login attempt
  await authService.logActivity(email, ACTIVITY_TYPE.LOGIN_SUCCESS, getClientIP(req), user.userId, role);

  const accessToken = authService.generateAccessToken(user, role, sessionIP);
  const refreshToken = authService.generateRefreshToken(user, role);

  // Store refresh token in PostgreSQL
  await authService.saveRefreshToken(user.userId, role, refreshToken);

  return sendResponse(STATUS_CODE.SUCCESS, { result: { accessToken, refreshToken, mustChangePassword: user.mustChangePassword || false } }, 'login');
};

// Unified register — handles both student and teacher based on role field
const register = async (data, reqUser) => {
  const { error } = registerSchema.validate(data);
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'register');

  const { role } = data;

  if (role === USER_ROLE.TEACHER) return registerTeacher(data, reqUser);
  return registerStudent(data, reqUser);
};

const registerStudent = async (data, reqUser) => {
  const { name, email, userCode, mobile, lectures } = data;
  const orgId = reqUser.orgId;

  const defaultLecture = await studentService.getDefaultLecture();
  if (!defaultLecture) {
    return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1104' }, 'registerStudent');
  }

  const lectureIds = [...new Set(lectures)];
  if (!lectureIds.includes(defaultLecture.id)) {
    lectureIds.unshift(defaultLecture.id);
  }

  if (lectureIds.length < 2) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1105' }, 'registerStudent');
  }

  const validLectures = await studentService.getValidLectures(lectureIds);
  if (validLectures.length !== lectureIds.length) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1106' }, 'registerStudent');
  }

  // Teacher authorization check
  if (reqUser.role === USER_ROLE.TEACHER) {
    const teacher = await studentService.getTeacherById(reqUser._id);
    if (!teacher || !teacher.lectures || teacher.lectures.length === 0) {
      return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1107' }, 'registerStudent');
    }
    const teacherLectureIds = teacher.lectures.map(id => id.toString());
    const unauthorizedLectures = lectureIds.filter(lid => lid !== defaultLecture.id && !teacherLectureIds.includes(lid));
    if (unauthorizedLectures.length > 0) {
      return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1108' }, 'registerStudent');
    }
  }

  // Unified duplicate check across users table (email, mobile, userCode)
  const duplicate = await checkDuplicateFields({ email, mobile, userCode, orgId });
  if (duplicate) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1039' }, 'registerStudent', { fieldName: duplicate.field });
  }

  try {
    const tempPassword = crypto.randomUUID();
    const student = await studentService.createStudent({
      name, email, userCode, password: tempPassword, mobile, lectures: lectureIds, role: USER_ROLE.STUDENT, orgId
    });

    // Generate reset token for first-time password setup (24 hours expiry)
    const resetToken = student.getResetPasswordToken(1440);
    await student.save({ validate: false });

    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6003';
    await axios.post(`${notificationUrl}/api/notification/v1/welcome-email`, {
      name: student.name, email: student.email, userCode: student.userCode, mobile: student.mobile, role: USER_ROLE.STUDENT, resetToken
    }).catch((err) => console.error('Error sending welcome email:', err.message));

    return sendResponse(STATUS_CODE.CREATED, {
      code: '5101',
      result: { userId: student.userId, name: student.name, email: student.email, userCode: student.userCode, role: student.role }
    }, 'registerStudent');
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendResponse(STATUS_CODE.BAD_REQUEST, { message: errors.join(', ') }, 'registerStudent');
    }
    return sendResponse(STATUS_CODE.INTERNALERROR, { message: error.message || 'Error creating student' }, 'registerStudent');
  }
};

const registerTeacher = async (data, reqUser) => {
  const { name, email, userCode, mobile, lectures } = data;
  const orgId = reqUser.orgId;

  // Unified duplicate check across users table (email, mobile, userCode)
  const duplicate = await checkDuplicateFields({ email, mobile, userCode, orgId });
  if (duplicate) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1039' }, 'registerTeacher', { fieldName: duplicate.field });
  }

  const defaultLecture = await Lecture.findOne({ where: { isDefault: true } });
  if (defaultLecture && lectures.includes(defaultLecture.id)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1035' }, 'registerTeacher');
  }

  const validLectures = await Lecture.findAll({ where: { id: lectures, isActive: true } });
  if (validLectures.length !== lectures.length) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1106' }, 'registerTeacher');

  try {
    const tempPassword = crypto.randomUUID();
    const teacher = await teacherService.createTeacher({
      name, email, userCode, password: tempPassword, mobile, lectures, role: USER_ROLE.TEACHER, orgId
    });

    // Generate reset token for first-time password setup (24 hours expiry)
    const resetToken = teacher.getResetPasswordToken(1440);
    await teacher.save({ validate: false });

    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6003';
    await axios.post(`${notificationUrl}/api/notification/v1/welcome-email`, {
      name: teacher.name, email: teacher.email, userCode: teacher.userCode, mobile: teacher.mobile, role: USER_ROLE.TEACHER, resetToken
    }).catch((err) => console.error('Error sending welcome email:', err.message));

    return sendResponse(STATUS_CODE.CREATED, {
      code: '5101',
      result: { userId: teacher.userId, name: teacher.name, email: teacher.email, userCode: teacher.userCode, role: teacher.role }
    }, 'registerTeacher');
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendResponse(STATUS_CODE.BAD_REQUEST, { message: errors.join(', ') }, 'registerTeacher');
    }
    return sendResponse(STATUS_CODE.INTERNALERROR, { message: error.message || 'Error creating teacher' }, 'registerTeacher');
  }
};

// Bulk register — students only
const bulkRegister = async (studentsData, reqUser) => {
  const { error } = bulkRegisterSchema.validate(studentsData);
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'bulkRegister');

  if (studentsData.length > BULK_REGISTER_LIMIT) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1040' }, 'bulkRegister', { limit: String(BULK_REGISTER_LIMIT) });
  }

  const orgId = reqUser.orgId;

  const defaultLecture = await studentService.getDefaultLecture();
  if (!defaultLecture) {
    return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1104' }, 'bulkRegister');
  }

  const rowErrors = [];
  const validStudents = [];
  const batchEmails = new Set();
  const batchCodes = new Set();
  const batchMobiles = new Set();

  for (let i = 0; i < studentsData.length; i++) {
    const student = studentsData[i];
    const rowNum = i + 1;
    const email = student.email?.toLowerCase();

    if (batchEmails.has(email)) {
      rowErrors.push({ row: rowNum, field: 'email', message: `Row ${rowNum}: ${ERRORS['1039'].replace('$fieldName$', 'Email')} (duplicate in batch)` });
      continue;
    }
    if (batchCodes.has(student.userCode)) {
      rowErrors.push({ row: rowNum, field: 'userCode', message: `Row ${rowNum}: ${ERRORS['1039'].replace('$fieldName$', 'User code')} (duplicate in batch)` });
      continue;
    }
    if (student.mobile && batchMobiles.has(student.mobile)) {
      rowErrors.push({ row: rowNum, field: 'mobile', message: `Row ${rowNum}: ${ERRORS['1039'].replace('$fieldName$', 'Mobile')} (duplicate in batch)` });
      continue;
    }

    const duplicate = await checkDuplicateFields({ email, mobile: student.mobile, userCode: student.userCode, orgId });
    if (duplicate) {
      rowErrors.push({ row: rowNum, field: duplicate.field.toLowerCase(), message: `Row ${rowNum}: ${ERRORS['1039'].replace('$fieldName$', duplicate.field)}` });
      continue;
    }

    batchEmails.add(email);
    batchCodes.add(student.userCode);
    if (student.mobile) batchMobiles.add(student.mobile);

    const lectureIds = [...new Set(student.lectures)];
    if (!lectureIds.includes(defaultLecture.id)) lectureIds.unshift(defaultLecture.id);

    const tempPassword = crypto.randomUUID();
    validStudents.push({ ...student, email, password: tempPassword, lectures: lectureIds, role: USER_ROLE.STUDENT, orgId });
  }

  let createdStudents = [];
  if (validStudents.length > 0) {
    createdStudents = await studentService.bulkCreateStudents(validStudents);

    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6003';
    for (const student of createdStudents) {
      const resetToken = student.getResetPasswordToken(1440);
      await student.save({ validate: false });

      await axios.post(`${notificationUrl}/api/notification/v1/welcome-email`, {
        name: student.name, email: student.email, userCode: student.userCode, resetToken
      }).catch((err) => console.error(`Failed to send email to ${student.email}:`, err.message));
    }
  }

  return sendResponse(STATUS_CODE.CREATED, {
    code: rowErrors.length > 0 ? '5102' : '5103',
    result: {
      total: studentsData.length,
      created: { count: createdStudents.length, data: createdStudents.map(s => ({ userId: s.userId, name: s.name, email: s.email, userCode: s.userCode, role: s.role })) },
      failed: { count: rowErrors.length, errors: rowErrors },
    }
  }, 'bulkRegister', { count: String(createdStudents.length), count2: String(rowErrors.length) });
};

const getMe = async (userId) => {
  const user = await authService.findUserById(userId);
  if (!user) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'getMe');
  }

  // Get last login timestamp from activity logs
  const lastLogin = await authService.getLastLoginTime(user.email);

  const userData = {
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    mobile: user.mobile || null,
    orgId: user.orgId || null,
    lastLoginAt: lastLogin,
  };
  if (user.userCode) userData.userCode = user.userCode;
  if (user.role === USER_ROLE.TEACHER) userData.lectures = user.lectures || [];

  return sendResponse(STATUS_CODE.SUCCESS, { code: '5801', result: userData }, 'getMe');
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  const { error } = updatePasswordSchema.validate({ currentPassword, newPassword });
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'updatePassword');

  const validationErrors = validatePassword(newPassword);
  if (validationErrors.length > 0) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1006' }, 'updatePassword');
  }

  const user = await authService.findUserWithPassword(userId);
  if (!user) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'updatePassword');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1007' }, 'updatePassword');
  }

  const isSamePassword = await user.matchPassword(newPassword);
  if (isSamePassword) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1008' }, 'updatePassword');
  }

  user.password = newPassword;
  await user.save();

  // Kill all sessions — force re-login
  user.sessionId = null;
  await user.save({ validate: false });
  await authService.deleteRefreshToken(user.userId);

  // Log password change
  const isFirstLoginChange = user.mustChangePassword;
  await authService.logActivity(user.email, ACTIVITY_TYPE.PASSWORD_CHANGE, null, user.userId, user.role, { firstLogin: isFirstLoginChange });

  // Clear first-login flag
  if (isFirstLoginChange) {
    user.mustChangePassword = false;
    await user.save({ validate: false });
  }

  // Send notification email
  try {
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6003';
    await axios.post(`${notificationUrl}/api/notification/v1/password-reset-confirmation`, {
      email: user.email,
      name: user.name
    }).catch(() => {});
  } catch (err) {
    // Don't fail the request if email fails
  }

  return sendResponse(STATUS_CODE.SUCCESS, { code: '5001' }, 'updatePassword');
};

const refreshAccessToken = async (token) => {
  if (!token) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1021' }, 'refreshAccessToken');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if refresh token exists in PostgreSQL
    const storedToken = await authService.findRefreshToken(decoded.id);
    if (!storedToken || storedToken.token !== token) {
      return sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1023' }, 'refreshAccessToken');
    }

    // Verify user still exists
    const user = await authService.findUserByIdForRefresh(decoded.id);
    if (!user) {
      return sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1005' }, 'refreshAccessToken');
    }

    const accessToken = authService.generateAccessToken(user, user.role, null);
    return sendResponse(STATUS_CODE.SUCCESS, { code: '5007', result: { accessToken } }, 'refreshAccessToken');
  } catch (err) {
    return sendResponse(STATUS_CODE.UNAUTHORIZED, { code: '1022' }, 'refreshAccessToken');
  }
};

const logout = async (userId) => {
  // Delete refresh token from DB
  await authService.deleteRefreshToken(userId);

  // Clear session ID — invalidates all access tokens immediately
  const user = await authService.findUserByIdForRefresh(userId);
  if (user) {
    user.sessionId = null;
    await user.save({ validate: false });
  }

  return sendResponse(STATUS_CODE.SUCCESS, { code: '5010' }, 'logout');
};

export default { login, register, bulkRegister, getMe, updatePassword, refreshAccessToken, logout };
