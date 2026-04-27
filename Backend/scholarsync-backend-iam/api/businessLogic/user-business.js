import { checkEmailExists, Lecture, STATUS_CODE, sendResponse, ACTIVITY_TYPE, USER_STATUS, USER_ROLE, ACTION_TYPE, DeletionLog, UpdateHistory } from 'scholarsync-backend-common';
import { updateUserSchema } from '../../model-validators/user-validator.js';
import userService from '../service/user-service.js';
import teacherService from '../service/teacher-service.js';
import studentService from '../service/student-service.js';
import authService from '../service/auth-service.js';

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

const isSuperAdmin = (reqUser) => reqUser.role === USER_ROLE.SUPERADMIN;

const isOrgMatch = (user, reqUser) => isSuperAdmin(reqUser) || user.orgId === reqUser.orgId;

const getUser = async (id, reqUser) => {
  if (!isValidUUID(id)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1028' }, 'getUser');
  }

  const { user } = await userService.findUserById(id);
  if (!user) return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'getUser');

  if (!isOrgMatch(user, reqUser)) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'getUser');
  }

  return sendResponse(STATUS_CODE.SUCCESS, { code: '5801', result: user }, 'getUser');
};

const updateUser = async (id, data, reqUser) => {
  if (!isValidUUID(id)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1028' }, 'updateUser');
  }

  const { error } = updateUserSchema.validate(data);
  if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'updateUser');

  const { user, role } = await userService.findUserById(id);
  if (!user) return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'updateUser');

  if (!isOrgMatch(user, reqUser)) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'updateUser');
  }

  if (role === USER_ROLE.STUDENT) return updateStudent(id, user, data, reqUser);
  if (role === USER_ROLE.TEACHER) return updateTeacher(id, user, data, reqUser);
  return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1029' }, 'updateUser');
};

const updateStudent = async (id, student, data, reqUser) => {
  const isTeacher = reqUser.role === USER_ROLE.TEACHER;
  const { name, email, userCode, mobile, lectures } = data;

  if (isTeacher && (email || userCode || lectures)) {
    return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1115' }, 'updateStudent');
  }

  const updateFields = { name, email, userCode, mobile, lectures };
  const fieldsToUpdate = Object.keys(updateFields).filter(f => updateFields[f] !== undefined);
  if (fieldsToUpdate.length === 0) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1116' }, 'updateStudent');
  }

  if (mobile && !/^\d{10}$/.test(mobile)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1112' }, 'updateStudent');
  }

  const updateObject = {};
  if (name) updateObject.name = name;

  if (email && email !== student.email) {
    const { exists } = await checkEmailExists(email);
    if (exists) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1111' }, 'updateStudent');
    updateObject.email = email;
  }

  if (userCode && userCode !== student.userCode) {
    const existing = await studentService.findStudentByCode(userCode, student.orgId);
    if (existing && existing.userId !== id) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1118' }, 'updateStudent');
    updateObject.userCode = userCode;
  }

  if (mobile) updateObject.mobile = mobile;

  if (lectures !== undefined) {
    if (!Array.isArray(lectures) || lectures.length === 0) {
      return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1119' }, 'updateStudent');
    }
    const defaultLecture = await studentService.getDefaultLecture();
    if (!defaultLecture) return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1120' }, 'updateStudent');

    const lectureIds = [...new Set(lectures)];
    if (!lectureIds.includes(defaultLecture.id)) lectureIds.unshift(defaultLecture.id);
    if (lectureIds.length < 2) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1121' }, 'updateStudent');

    const validLectures = await studentService.getValidLectures(lectureIds);
    if (validLectures.length !== lectureIds.length) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1106' }, 'updateStudent');
    updateObject.lectures = lectureIds;
  }

  const originalUserData = student.toJSON ? student.toJSON() : student;
  const updatedStudent = await studentService.updateStudentById(id, updateObject);

  await UpdateHistory.create({
    entityType: USER_ROLE.STUDENT,
    entityId: id,
    actionType: ACTION_TYPE.UPDATE_DATA,
    originalData: originalUserData,
    editData: updateObject,
    updatedByUser: reqUser._id,
  });

  return sendResponse(STATUS_CODE.SUCCESS, { code: '5801', result: updatedStudent }, 'updateStudent');
};

const updateTeacher = async (id, teacher, data, reqUser) => {
  const originalTeacherData = teacher.toJSON ? teacher.toJSON() : { ...teacher };
  const { name, email, userCode, mobile, lectures } = data;

  if (email && email !== teacher.email) {
    const { exists } = await checkEmailExists(email);
    if (exists) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1111' }, 'updateTeacher');
    teacher.email = email;
  }
  if (userCode && userCode !== teacher.userCode) {
    const existing = await teacherService.findTeacherByCode(userCode, teacher.orgId);
    if (existing && existing.userId !== id) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1204' }, 'updateTeacher');
    teacher.userCode = userCode;
  }
  if (mobile) {
    if (!/^\d{10}$/.test(mobile)) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1112' }, 'updateTeacher');
    teacher.mobile = mobile;
  }

  if (lectures !== undefined) {
    if (!Array.isArray(lectures) || lectures.length === 0) {
      return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1034' }, 'updateTeacher');
    }
    const defaultLecture = await Lecture.findOne({ where: { isDefault: true } });
    if (defaultLecture && lectures.includes(defaultLecture.id)) {
      return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1035' }, 'updateTeacher');
    }
    const validLectures = await Lecture.findAll({ where: { id: lectures, isActive: true } });
    if (validLectures.length !== lectures.length) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1106' }, 'updateTeacher');
    teacher.lectures = lectures;
  }

  if (name) teacher.name = name;

  try {
    await teacher.save();
    teacher.password = undefined;

    await UpdateHistory.create({
      entityType: USER_ROLE.TEACHER,
      entityId: id,
      actionType: ACTION_TYPE.UPDATE_DATA,
      originalData: originalTeacherData,
      editData: data,
      updatedByUser: reqUser._id,
    });

    return sendResponse(STATUS_CODE.SUCCESS, { code: '5801', result: teacher }, 'updateTeacher');
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendResponse(STATUS_CODE.BAD_REQUEST, { message: errors.join(', ') }, 'updateTeacher');
    }
    return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1027' }, 'updateTeacher');
  }
};

const deleteUser = async (id, reqUser) => {
  if (!isValidUUID(id)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1028' }, 'deleteUser');
  }

  if (id === reqUser._id) return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1041' }, 'deleteUser');

  const { user, role } = await userService.findUserById(id);
  if (!user) return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'deleteUser');

  if (!isOrgMatch(user, reqUser)) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'deleteUser');
  }

  if (role === USER_ROLE.ADMIN || role === USER_ROLE.SUPERADMIN) return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1030' }, 'deleteUser');

  await DeletionLog.create({
    tableName: 'users',
    entityId: id,
    data: user.toJSON ? user.toJSON() : user,
    reason: 'Admin deleted user',
    deletedBy: reqUser._id,
  });

  await userService.deleteUserById(id, role);

  if (role === USER_ROLE.STUDENT) return sendResponse(STATUS_CODE.SUCCESS, { code: '5104' }, 'deleteUser');
  return sendResponse(STATUS_CODE.SUCCESS, { code: '5201' }, 'deleteUser');
};

const manageUserStatus = async (id, action, reqUser) => {
  if (!isValidUUID(id)) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1028' }, 'manageUserStatus');
  if (!action || !['block', 'unblock'].includes(action)) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1037' }, 'manageUserStatus');

  if (action === 'block' && id === reqUser._id) return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1042' }, 'manageUserStatus');

  const { user, role } = await userService.findUserById(id);
  if (!user) return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'manageUserStatus');

  if (!isOrgMatch(user, reqUser)) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1005' }, 'manageUserStatus');
  }

  if (role === USER_ROLE.ADMIN || role === USER_ROLE.SUPERADMIN) return sendResponse(STATUS_CODE.FORBIDDEN, { code: '1031' }, 'manageUserStatus');

  if (action === 'block') {
    if (user.status === USER_STATUS.DISABLED) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1032' }, 'manageUserStatus');
    await authService.disableUser(id);
    await authService.logActivity(user.email, ACTIVITY_TYPE.USER_BLOCKED, null, id, role);
    await UpdateHistory.create({
      entityType: role,
      entityId: id,
      actionType: ACTION_TYPE.CHANGE_STATUS,
      originalData: { status: user.status },
      editData: { status: USER_STATUS.DISABLED },
      updatedByUser: reqUser._id,
    });
    return sendResponse(STATUS_CODE.SUCCESS, { code: '5008', result: { userId: id, status: USER_STATUS.DISABLED } }, 'manageUserStatus');
  }

  // unblock
  if (user.status === USER_STATUS.ACTIVE) return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1033' }, 'manageUserStatus');
  await authService.enableUser(id);
  await authService.clearFailedAttempts(user.email);
  await authService.logActivity(user.email, ACTIVITY_TYPE.USER_UNBLOCKED, null, id, role);
  await UpdateHistory.create({
    entityType: role,
    entityId: id,
    actionType: ACTION_TYPE.CHANGE_STATUS,
    originalData: { status: user.status },
    editData: { status: USER_STATUS.ACTIVE },
    updatedByUser: reqUser._id,
  });
  return sendResponse(STATUS_CODE.SUCCESS, { code: '5009', result: { userId: id, status: USER_STATUS.ACTIVE } }, 'manageUserStatus');
};

export default { getUser, updateUser, deleteUser, manageUserStatus };
