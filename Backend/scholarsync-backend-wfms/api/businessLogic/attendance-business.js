import { Sequelize } from 'sequelize';
import attendanceService from '../service/attendance-service.js';
import { uploadToCloudinary } from '../utils/cloudinary-upload.js';
import { cloudinary, Lecture, Teacher, AttendanceSlot, Student, Attendance } from 'scholarsync-backend-common';
import { ATTENDANCE_STATUS_ACTIONS } from '../../constants/application-constants.js';

const { Op } = Sequelize;

// ========================
// ATTENDANCE SLOT OPERATIONS
// ========================

/**
 * Create attendance slot(s) for selected lectures
 */
const createAttendanceSlot = async ({ shift, date, startTime, endTime, lectures, user }) => {
  if (!shift || !date || !startTime || !endTime) {
    return { status: 400, success: false, message: 'Please provide all required fields: shift, date, startTime, endTime' };
  }

  if (!lectures || !Array.isArray(lectures) || lectures.length === 0) {
    return { status: 400, success: false, message: 'Please select at least one lecture' };
  }

  const slotDate = new Date(date);
  const slotStartTime = new Date(startTime);
  const slotEndTime = new Date(endTime);

  if (isNaN(slotDate.getTime()) || isNaN(slotStartTime.getTime()) || isNaN(slotEndTime.getTime())) {
    return { status: 400, success: false, message: 'Invalid date format. Please provide valid UTC timestamps' };
  }

  const defaultLecture = await Lecture.findOne({ where: { isDefault: true } });
  if (!defaultLecture) {
    return { status: 500, success: false, message: 'Default lecture not found' };
  }

  if (user.role === 'teacher' && lectures.includes(defaultLecture.id)) {
    return { status: 403, success: false, message: 'Teachers cannot create attendance slots for the default lecture. Only admins can do that.' };
  }

  if (user.role === 'teacher') {
    const teacher = await attendanceService.findTeacherById(user.id);
    if (!teacher || !teacher.lectures || teacher.lectures.length === 0) {
      return { status: 403, success: false, message: 'No lectures assigned to you. Please contact admin.' };
    }

    const teacherLectureIds = teacher.lectures.map(id => id.toString ? id.toString() : id);
    const unauthorizedLectures = lectures.filter(lectureId => !teacherLectureIds.includes(lectureId));

    if (unauthorizedLectures.length > 0) {
      return { status: 403, success: false, message: 'You can only create attendance slots for lectures assigned to you' };
    }
  }

  const validLectures = await Lecture.findAll({
    where: { id: lectures, isActive: true }
  });
  if (validLectures.length !== lectures.length) {
    return { status: 400, success: false, message: 'One or more invalid lecture IDs provided' };
  }

  const createdSlots = [];
  const errors = [];

  for (const lectureId of lectures) {
    try {
      const existingSlot = await attendanceService.findExistingSlot(slotDate, shift, lectureId);
      if (existingSlot) {
        errors.push({
          lectureId,
          message: `Attendance slot for ${shift} shift on this date already exists for this lecture`
        });
        continue;
      }

      const attendanceSlot = await attendanceService.createAttendanceSlot({
        shift,
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
        lectureId,
        isActive: true,
        createdBy: user.id,
      });

      const studentsInLecture = await attendanceService.getStudentsInLecture(lectureId);

      const pendingAttendance = studentsInLecture.map(student => ({
        studentId: student.id,
        slotId: attendanceSlot.id,
        lectureId,
        date: slotDate,
        shift,
        status: 'pending',
        studentCode: student.studentCode,
        studentName: student.name,
        studentEmail: student.email
      }));

      await attendanceService.insertManyAttendance(pendingAttendance);

      createdSlots.push({
        slot: attendanceSlot,
        studentsCount: studentsInLecture.length
      });
    } catch (error) {
      console.error(`Error creating slot for lecture ${lectureId}:`, error);
      errors.push({ lectureId, message: error.message });
    }
  }

  if (createdSlots.length === 0 && errors.length > 0) {
    return { status: 400, success: false, message: 'Failed to create attendance slots', errors };
  }

  return {
    status: 201,
    success: true,
    message: `${createdSlots.length} attendance slot(s) created successfully`,
    data: createdSlots,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Get all attendance slots with optional date filter and teacher lecture filter
 */
const getAllAttendanceSlots = async ({ date, user }) => {
  const now = new Date();
  let query = {};

  if (date) {
    const queryDate = new Date(date);
    if (isNaN(queryDate.getTime())) {
      return { status: 400, success: false, message: 'Invalid date format' };
    }
    queryDate.setHours(0, 0, 0, 0);
    query.date = queryDate;
  }

  if (user.role === 'teacher') {
    const teacher = await attendanceService.findTeacherById(user.id);
    if (!teacher || !teacher.lectures || teacher.lectures.length === 0) {
      return { status: 200, success: true, count: 0, data: [], message: 'No lectures assigned to this teacher' };
    }
    query.lecture = { $in: teacher.lectures };
  }

  const attendanceSlots = await attendanceService.getAllSlots(query);

  const updatePromises = [];
  const updatedSlots = [];

  for (const slot of attendanceSlots) {
    const slotEndTime = new Date(slot.endTime);
    if (slot.isActive && slotEndTime < now) {
      slot.isActive = false;
      updatePromises.push(attendanceService.saveSlot(slot));
    }
    updatedSlots.push(slot);
  }

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }

  return { status: 200, success: true, count: updatedSlots.length, data: updatedSlots };
};

/**
 * Close an attendance slot
 */
const closeAttendanceSlot = async (slotId) => {
  const slot = await attendanceService.closeSlot(slotId);
  if (!slot) {
    return { status: 404, success: false, message: 'Attendance slot not found' };
  }
  return { status: 200, success: true, message: 'Attendance slot closed successfully' };
};

/**
 * Delete an attendance slot and its associated records + photos
 */
const deleteAttendanceSlot = async (slotId) => {
  const slot = await attendanceService.findSlotById(slotId);
  if (!slot) {
    return { status: 404, success: false, message: 'Attendance slot not found' };
  }

  const attendanceRecords = await attendanceService.getAttendanceRecordsBySlotIds([slot.id]);

  const photoDeletePromises = attendanceRecords.map(record => {
    if (record.photo && record.photo.public_id) {
      return cloudinary.uploader.destroy(record.photo.public_id);
    }
    return Promise.resolve();
  });
  await Promise.all(photoDeletePromises);

  await attendanceService.deleteAttendanceBySlotId(slot.id);
  await attendanceService.deleteSlotById(slotId);

  return {
    status: 200,
    success: true,
    message: 'Attendance slot and associated records deleted successfully. Photos removed from Cloudinary.'
  };
};

// ========================
// STUDENT ATTENDANCE OPERATIONS
// ========================

/**
 * Get active/upcoming attendance slots for a student's lectures
 */
const getActiveAttendanceSlots = async (userId) => {
  const student = await attendanceService.findStudentByIdWithLectures(userId);

  if (!student || !student.lectures || student.lectures.length === 0) {
    return { status: 200, success: true, count: 0, data: [] };
  }

  const activeSlots = await attendanceService.getActiveSlots(student.lectures);

  const attendanceRecords = await attendanceService.getAttendanceByStudentSlots(
    userId,
    activeSlots.map(s => s.id)
  );

  const attendanceMap = new Map();
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.slotId, record.status);
  });

  const availableSlots = activeSlots.filter(slot => {
    const status = attendanceMap.get(slot.id);
    return status === 'pending' || !status;
  }).map(slot => {
    const plain = slot.toJSON ? slot.toJSON() : slot;
    return {
      ...plain,
      attendanceStatus: attendanceMap.get(slot.id) || 'not_created'
    };
  });

  return { status: 200, success: true, count: availableSlots.length, data: availableSlots };
};

/**
 * Mark student attendance with photo, location, and leave check
 */
const markStudentAttendance = async ({ slotId, latitude, longitude, address, file, user }) => {
  if (!slotId || !latitude || !longitude) {
    return { status: 400, success: false, message: 'Please provide slot ID and location data' };
  }

  if (!file) {
    return { status: 400, success: false, message: 'Please upload a photo for attendance verification' };
  }

  const hasLeave = await attendanceService.hasLeaveForSlot(user.id, slotId);
  if (hasLeave) {
    return {
      status: 400,
      success: false,
      message: 'You have applied leave for this time. Please ask your teacher to approve/reject it or you can delete the request'
    };
  }

  const slot = await attendanceService.findSlotById(slotId);
  if (!slot) {
    return { status: 404, success: false, message: 'Attendance slot not found' };
  }

  if (!slot.isActive) {
    return { status: 400, success: false, message: 'This attendance slot is no longer active' };
  }

  const currentTime = new Date();
  if (currentTime < slot.startTime || currentTime > slot.endTime) {
    return { status: 400, success: false, message: 'Attendance can only be marked during the active time window' };
  }

  const existingAttendance = await attendanceService.findAttendanceByStudentAndSlot(user.id, slotId);

  if (existingAttendance && existingAttendance.status === 'present') {
    return { status: 400, success: false, message: 'You have already marked your attendance for this slot' };
  }

  if (existingAttendance && existingAttendance.status === 'absent') {
    return { status: 400, success: false, message: 'This attendance slot has been closed and marked as absent' };
  }

  const cloudinaryResult = await uploadToCloudinary(file);
  const markTime = new Date();

  if (existingAttendance) {
    existingAttendance.status = 'awaiting_approval';
    existingAttendance.photo = {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      format: cloudinaryResult.format,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    };
    existingAttendance.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address
    };
    existingAttendance.markedAt = markTime;

    await attendanceService.saveAttendance(existingAttendance);

    return {
      status: 200,
      success: true,
      message: 'Attendance marked successfully. Waiting for teacher approval.',
      data: existingAttendance
    };
  }

  const attendance = await attendanceService.createAttendance({
    studentId: user.id,
    slotId,
    lectureId: slot.lectureId,
    date: slot.date,
    shift: slot.shift,
    status: 'awaiting_approval',
    photo: {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      format: cloudinaryResult.format,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    },
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
      address
    },
    markedAt: markTime,
    studentCode: user.studentCode,
    studentName: user.name,
    studentEmail: user.email
  });

  return {
    status: 201,
    success: true,
    message: 'Attendance marked successfully. Waiting for teacher approval.',
    data: attendance
  };
};

/**
 * Get student's attendance history with date filtering and optional type filter.
 * type can be: 'present', 'absent', 'pending', 'awaiting_approval'
 * When type is 'absent', returns the detailed absence breakdown (former getAbsenceHistory).
 */
const getAttendanceHistory = async ({ userId, month, year, startDate, endDate, type, userCreatedAt }) => {
  // If type is 'absent', return the detailed absence breakdown
  if (type === 'absent') {
    return _getAbsenceHistory({ userId, month, year, userCreatedAt });
  }

  let dateFilter = { studentId: userId };

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { status: 400, success: false, message: 'Invalid date format' };
    }
    dateFilter.date = { $gte: start, $lte: end };
  } else if (month && year) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    dateFilter.date = { $gte: startOfMonth, $lte: endOfMonth };
  }

  if (type) {
    dateFilter.status = type;
  }

  const attendance = await attendanceService.getAttendanceByDateFilter(dateFilter);

  return { status: 200, success: true, count: attendance.length, data: attendance };
};

/**
 * Internal: Get student's absence history with complex breakdown
 */
const _getAbsenceHistory = async ({ userId, month, year, userCreatedAt }) => {
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
    return { status: 400, success: false, error: 'Invalid month or year' };
  }

  const startOfMonth = new Date(yearNum, monthNum - 1, 1);
  const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  const joinDate = new Date(userCreatedAt);
  const effectiveStartDate = startOfMonth < joinDate ? joinDate : startOfMonth;

  const student = await attendanceService.findStudentByIdWithLectures(userId);

  if (!student || !student.lectures || student.lectures.length === 0) {
    return {
      status: 200,
      success: true,
      absences: [],
      pending: [],
      totalAbsences: 0,
      totalPending: 0,
      totalClosedSlots: 0,
      totalActiveSlots: 0
    };
  }

  const slots = await AttendanceSlot.findAll({
    where: {
      date: { [Op.gte]: effectiveStartDate, [Op.lte]: endOfMonth },
      lectureId: student.lectures
    }
  });

  const attendanceRecords = await attendanceService.getAttendanceByStudentAndDateRange(userId, {
    date: { $gte: effectiveStartDate, $lte: endOfMonth }
  });

  const absences = [];
  const pending = [];
  const awaitingApproval = [];
  let totalClosedSlots = 0;
  let totalActiveSlots = 0;

  attendanceRecords.forEach(record => {
    if (record.status === 'awaiting_approval') {
      const matchedSlot = slots.find(s => s.id === record.slotId);
      if (matchedSlot) {
        awaitingApproval.push({
          date: matchedSlot.date,
          shift: matchedSlot.shift,
          slotStartTime: matchedSlot.startTime,
          slotEndTime: matchedSlot.endTime
        });
      }
    }
  });

  slots.forEach(slot => {
    const attendanceRecord = attendanceRecords.find(record =>
      record.slotId === slot.id
    );

    if (slot.status === 'closed') totalClosedSlots++;
    else if (slot.status === 'active') totalActiveSlots++;

    if (!attendanceRecord) {
      const entry = {
        date: slot.date,
        shift: slot.shift,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime
      };

      if (slot.status === 'closed') absences.push(entry);
      else if (slot.status === 'active') pending.push(entry);
    } else if (attendanceRecord.status === 'absent' && slot.status === 'closed') {
      absences.push({
        date: slot.date,
        shift: slot.shift,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime
      });
    } else if (attendanceRecord.status === 'pending' && slot.status === 'active') {
      pending.push({
        date: slot.date,
        shift: slot.shift,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime
      });
    }
  });

  return {
    status: 200,
    success: true,
    absences,
    pending,
    awaitingApproval,
    totalAbsences: absences.length,
    totalPending: pending.length,
    totalAwaitingApproval: awaitingApproval.length,
    totalClosedSlots,
    totalActiveSlots
  };
};

// ========================
// ADMIN/TEACHER ATTENDANCE OPERATIONS
// ========================

/**
 * Get attendance records by slot ID
 */
const getAttendance = async (slotId) => {
  if (!slotId) {
    return { status: 400, success: false, message: 'Slot ID is required' };
  }

  const slot = await attendanceService.findSlotById(slotId);
  if (!slot) {
    return { status: 404, success: false, message: 'Attendance slot not found' };
  }

  const attendanceRecords = await attendanceService.getAttendanceBySlotId(slotId);

  const formattedRecords = attendanceRecords.map(record => ({
    id: record.id,
    student: {
      id: record.studentId,
      name: record.studentName,
      email: record.studentEmail,
      studentCode: record.studentCode
    },
    status: 'present',
    markedAt: record.markedAt,
    photo: record.photo,
    location: record.location,
    shift: record.shift,
    date: record.date
  }));

  return {
    status: 200,
    success: true,
    count: formattedRecords.length,
    data: {
      slot: {
        id: slot.id,
        shift: slot.shift,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive
      },
      attendance: formattedRecords
    }
  };
};

/**
 * Admin/Teacher mark attendance for a student
 */
const markAttendance = async ({ slotId, studentId, isPresent, timestamp }) => {
  if (!slotId || !studentId || isPresent === undefined) {
    return { status: 400, success: false, message: 'Please provide slotId, studentId, and isPresent' };
  }

  const slot = await AttendanceSlot.findOne({ where: { id: slotId, isActive: true } });
  if (!slot) {
    return { status: 404, success: false, message: 'Active attendance slot not found' };
  }

  const student = await Student.findOne({ where: { id: studentId, role: 'student' } });
  if (!student) {
    return { status: 404, success: false, message: 'Student not found' };
  }

  const now = new Date();
  const attendanceData = {
    studentId,
    slotId,
    lectureId: slot.lectureId,
    date: slot.date,
    shift: slot.shift,
    status: isPresent ? 'present' : 'absent',
    markedAt: timestamp ? new Date(timestamp) : now,
    studentCode: student.studentCode,
    studentName: student.name,
    studentEmail: student.email
  };

  let attendance = await attendanceService.findAttendanceByStudentAndSlot(studentId, slotId);

  if (attendance) {
    Object.assign(attendance, attendanceData);
    await attendanceService.saveAttendance(attendance);
  } else {
    attendance = await attendanceService.createAttendance(attendanceData);
  }

  // Re-fetch to get full record
  attendance = await Attendance.findByPk(attendance.id);

  return { status: 200, success: true, data: attendance, message: 'Attendance marked successfully' };
};

/**
 * Get absent students with threshold
 */
const getAbsentStudents = async ({ threshold = 0, month, year }) => {
  let dateFilter = {};

  if (month && year) {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    if (isNaN(parsedMonth) || isNaN(parsedYear) ||
        parsedMonth < 1 || parsedMonth > 12 ||
        parsedYear < 2000 || parsedYear > 2100) {
      return { status: 400, success: false, message: 'Invalid month or year values' };
    }

    const startOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
    const endOfMonth = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));
    dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
  } else {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
  }

  const allStudents = await attendanceService.getAllStudents();

  const absenteeMap = {};
  allStudents.forEach(student => {
    const plain = student.toJSON ? student.toJSON() : student;
    const studentJoinDate = plain.createdAt ? new Date(plain.createdAt) : null;
    const studentLectureIds = (plain.lectures || []).map(id => id.toString ? id.toString() : id);

    absenteeMap[plain.id] = {
      student: {
        id: plain.id,
        name: plain.name,
        email: plain.email,
        studentCode: plain.studentCode
      },
      joinDate: studentJoinDate,
      lectureIds: studentLectureIds,
      absentCount: 0,
      absentDates: []
    };
  });

  const slots = await attendanceService.getSlotsByDateAndStatus(dateFilter, ['active', 'closed']);
  const attendanceRecords = await attendanceService.getAttendanceByDateRange(dateFilter);

  slots.forEach(slot => {
    const slotDate = new Date(slot.date).toISOString().split('T')[0];
    const slotShift = slot.shift;
    const slotDateObj = new Date(slot.date);
    const slotLectureId = slot.lectureId;

    allStudents.forEach(student => {
      const plain = student.toJSON ? student.toJSON() : student;
      const studentId = plain.id;
      const studentJoinDate = plain.createdAt ? new Date(plain.createdAt) : new Date(0);
      const studentLectureIds = absenteeMap[studentId].lectureIds;

      if (slotDateObj >= studentJoinDate && studentLectureIds.includes(slotLectureId)) {
        const isPresent = attendanceRecords.some(record => {
          const recPlain = record.toJSON ? record.toJSON() : record;
          return recPlain.studentId === studentId &&
            new Date(recPlain.date).toISOString().split('T')[0] === slotDate &&
            recPlain.shift === slotShift;
        });

        if (!isPresent) {
          absenteeMap[studentId].absentCount += 1;
          absenteeMap[studentId].absentDates.push({
            date: slot.date,
            shift: slotShift
          });
        }
      }
    });
  });

  const absentees = Object.values(absenteeMap)
    .filter(data => data.absentCount >= parseInt(threshold))
    .sort((a, b) => b.absentCount - a.absentCount);

  return { status: 200, success: true, count: absentees.length, data: absentees };
};

/**
 * Get attendance details for a specific student (admin view)
 */
const getAttendanceDetails = async ({ studentId, month, year }) => {
  if (!studentId || !month || !year) {
    return { status: 400, success: false, message: 'Please provide studentId, month, and year' };
  }

  const student = await attendanceService.findStudentById(studentId);
  if (!student) {
    return { status: 404, success: false, message: 'Student not found' };
  }

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return { status: 400, success: false, message: 'Invalid month. Please provide a month between 1 and 12' };
  }

  const attendanceRecords = await attendanceService.getAttendanceDetails(studentId, monthNum, yearNum, student.createdAt);

  let present = 0;
  let absent = 0;

  attendanceRecords.forEach((record) => {
    if (record.status === 'present' && ['active', 'closed'].includes(record.slotStatus)) {
      present++;
    } else if (record.status === 'absent' && record.slotStatus === 'closed') {
      absent++;
    }
  });

  return {
    status: 200,
    success: true,
    data: {
      student,
      attendance: {
        records: attendanceRecords,
        stats: {
          total: present + absent,
          present,
          absent,
        },
        totalRecords: attendanceRecords.length,
      },
    },
  };
};

/**
 * Mark attendance as absent (override present to absent)
 */
const markAttendanceAsAbsent = async ({ attendanceId, remark, user }) => {
  if (!remark || remark.trim().length === 0) {
    return { status: 400, success: false, message: 'Remark is required to mark attendance as absent' };
  }

  if (remark.length > 1000) {
    return { status: 400, success: false, message: 'Remark must not exceed 1000 characters' };
  }

  const attendance = await attendanceService.findAttendanceByIdPopulated(attendanceId);
  if (!attendance) {
    return { status: 404, success: false, message: 'Attendance record not found' };
  }

  if (attendance.status === 'absent') {
    return { status: 400, success: false, message: 'Attendance is already marked as absent' };
  }

  if (attendance.status !== 'present') {
    return { status: 400, success: false, message: 'Only present attendance can be marked as absent' };
  }

  attendance.status = 'absent';
  attendance.statusUpdatedBy = user.id;
  attendance.remark = remark.trim();
  attendance.statusUpdatedAt = new Date();

  await attendanceService.saveAttendance(attendance);

  return {
    status: 200,
    success: true,
    message: 'Attendance marked as absent successfully.',
    data: attendance
  };
};

/**
 * Update attendance status (approve or reject)
 * action must be 'approve' or 'reject'
 */
const updateAttendanceStatus = async (id, action, remark, user) => {
  const validActions = [ATTENDANCE_STATUS_ACTIONS.APPROVE, ATTENDANCE_STATUS_ACTIONS.REJECT];
  if (!action || !validActions.includes(action)) {
    return { status: 400, success: false, message: `Invalid action. Must be one of: ${validActions.join(', ')}` };
  }

  if (action === ATTENDANCE_STATUS_ACTIONS.REJECT) {
    if (!remark || remark.trim().length === 0) {
      return { status: 400, success: false, message: 'Remark is required to reject attendance' };
    }
    if (remark.length > 1000) {
      return { status: 400, success: false, message: 'Remark must not exceed 1000 characters' };
    }
  }

  const attendance = await attendanceService.findAttendanceByIdPopulated(id);
  if (!attendance) {
    return { status: 404, success: false, message: 'Attendance record not found' };
  }

  const slot = await attendanceService.findSlotById(attendance.slotId);
  if (!slot || slot.status !== 'closed') {
    return { status: 400, success: false, message: `Cannot ${action} attendance. Slot must be closed first.` };
  }

  if (attendance.status !== 'awaiting_approval') {
    return { status: 400, success: false, message: `Cannot ${action}. Current status is '${attendance.status}'.` };
  }

  if (action === ATTENDANCE_STATUS_ACTIONS.APPROVE) {
    attendance.status = 'present';
    attendance.statusUpdatedBy = user.id;
    attendance.statusUpdatedAt = new Date();
    await attendanceService.saveAttendance(attendance);
    return { status: 200, success: true, message: 'Attendance approved successfully', data: attendance };
  }

  // reject
  attendance.status = 'absent';
  attendance.statusUpdatedBy = user.id;
  attendance.remark = remark.trim();
  attendance.statusUpdatedAt = new Date();
  await attendanceService.saveAttendance(attendance);

  return {
    status: 200,
    success: true,
    message: 'Attendance rejected successfully.',
    data: attendance
  };
};

/**
 * Get attendance by date
 */
const getAttendanceByDate = async ({ date, shift }) => {
  if (!date) {
    return { status: 400, success: false, message: 'Please provide a date' };
  }

  const queryDate = new Date(date);
  if (isNaN(queryDate.getTime())) {
    return { status: 400, success: false, message: 'Invalid date format. Please provide a valid date in YYYY-MM-DD format' };
  }

  const attendance = await attendanceService.getAttendanceByDate(date, shift);

  return { status: 200, success: true, count: attendance.length, data: attendance };
};

/**
 * Get attendance statistics
 */
const getAttendanceStats = async ({ month, year, minAbsences, startDate: startDateParam, endDate: endDateParam }) => {
  let dateFilter = {};
  let startDate, endDate;

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { status: 400, success: false, message: 'Invalid date format. Please provide valid dates in YYYY-MM-DD format' };
    }

    dateFilter.date = { $gte: startDate, $lte: endDate };
  } else if (month && year) {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    if (isNaN(parsedMonth) || isNaN(parsedYear) ||
        parsedMonth < 1 || parsedMonth > 12 ||
        parsedYear < 2000 || parsedYear > 2100) {
      return { status: 400, success: false, message: 'Invalid month or year values' };
    }

    startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
    endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));
    dateFilter.date = { $gte: startDate, $lte: endDate };
  } else {
    return { status: 400, success: false, message: 'Either month+year or startDate+endDate parameters are required' };
  }

  const parsedMinAbsences = parseInt(minAbsences) || 0;

  const allStudents = await attendanceService.getAllStudents();
  const slots = await attendanceService.getSlotsByDateAndStatus(dateFilter, ['active', 'closed']);
  const attendanceRecords = await attendanceService.getAttendanceByDateRange(dateFilter);

  const studentAttendance = new Map();

  allStudents.forEach(student => {
    const plain = student.toJSON ? student.toJSON() : student;
    const studentJoinDate = new Date(plain.createdAt);
    const studentLectureIds = (plain.lectures || []).map(id => id.toString ? id.toString() : id);

    studentAttendance.set(plain.id, {
      student: {
        id: plain.id,
        name: plain.name,
        email: plain.email,
        studentCode: plain.studentCode
      },
      joinDate: studentJoinDate,
      lectureIds: studentLectureIds,
      present: 0,
      absent: 0,
      attendanceDates: [],
      absentDates: []
    });
  });

  attendanceRecords.forEach(record => {
    const recPlain = record.toJSON ? record.toJSON() : record;
    const studentId = recPlain.studentId;
    if (studentAttendance.has(studentId)) {
      const data = studentAttendance.get(studentId);
      data.present += 1;
      data.attendanceDates.push({ date: recPlain.date, slot: recPlain.slotId });
      studentAttendance.set(studentId, data);
    }
  });

  studentAttendance.forEach((data, studentId) => {
    const studentJoinDate = data.joinDate;
    const studentLectureIds = data.lectureIds;

    const totalAvailableSlots = slots.filter(slot => {
      const slotPlain = slot.toJSON ? slot.toJSON() : slot;
      const slotDate = new Date(slotPlain.date);
      const slotLectureId = slotPlain.lectureId;
      return slotDate >= studentJoinDate && studentLectureIds.includes(slotLectureId);
    });

    const totalSlotsCount = totalAvailableSlots.length;

    const presentCount = attendanceRecords.filter(record => {
      const recPlain = record.toJSON ? record.toJSON() : record;
      return recPlain.studentId === studentId &&
        new Date(recPlain.date) >= studentJoinDate;
    }).length;

    data.present = presentCount;
    data.absent = totalSlotsCount - presentCount;

    const presentDates = new Set(
      attendanceRecords
        .filter(r => {
          const rp = r.toJSON ? r.toJSON() : r;
          return rp.studentId === studentId;
        })
        .map(r => {
          const rp = r.toJSON ? r.toJSON() : r;
          return new Date(rp.date).toISOString();
        })
    );

    data.absentDates = totalAvailableSlots
      .map(slot => {
        const sp = slot.toJSON ? slot.toJSON() : slot;
        return new Date(sp.date).toISOString();
      })
      .filter(dateStr => !presentDates.has(dateStr));

    studentAttendance.set(studentId, data);
  });

  const studentsWithAbsences = Array.from(studentAttendance.values())
    .filter(data => data.absent >= parsedMinAbsences)
    .sort((a, b) => b.absent - a.absent);

  const stats = {
    totalSlots: slots.length,
    totalStudents: allStudents.length,
    attendanceRecords: attendanceRecords.length,
    studentsWithAbsences
  };

  return {
    status: 200,
    success: true,
    data: {
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      stats
    }
  };
};

/**
 * Get student attendance counts with optional filters
 */
const getStudentAttendanceCounts = async ({ studentId, year, month, date, startDate, endDate }) => {
  // UUID validation (simple regex check)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(studentId)) {
    return { status: 400, success: false, message: 'Invalid student ID' };
  }

  const student = await attendanceService.findStudentByIdPopulated(studentId);
  if (!student) {
    return { status: 404, success: false, message: 'Student not found' };
  }

  const studentLectureIds = (student.lectures || []).map(l => l.id || l);

  let dateFilter = {};
  let filterDescription = 'All time';

  if (date) {
    const specificDate = new Date(date);
    if (isNaN(specificDate.getTime())) {
      return { status: 400, success: false, message: 'Invalid date format. Please provide valid date in YYYY-MM-DD format' };
    }
    const startOfDay = new Date(specificDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(specificDate);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter = {
      $gte: new Date(Math.max(startOfDay, new Date(student.createdAt))),
      $lte: endOfDay
    };
    filterDescription = `Date: ${specificDate.toDateString()}`;
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { status: 400, success: false, message: 'Invalid date format. Please provide valid dates in YYYY-MM-DD format' };
    }
    dateFilter = {
      $gte: new Date(Math.max(start, new Date(student.createdAt))),
      $lte: end
    };
    filterDescription = `${start.toDateString()} to ${end.toDateString()}`;
  } else if (year && month) {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);
    if (isNaN(parsedMonth) || isNaN(parsedYear) ||
        parsedMonth < 1 || parsedMonth > 12 ||
        parsedYear < 2000 || parsedYear > 2100) {
      return { status: 400, success: false, message: 'Invalid month or year values' };
    }
    const startOfMonth = new Date(parsedYear, parsedMonth - 1, 1);
    const endOfMonth = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
    dateFilter = {
      $gte: new Date(Math.max(startOfMonth, new Date(student.createdAt))),
      $lte: endOfMonth
    };
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    filterDescription = `${monthNames[parsedMonth - 1]} ${parsedYear}`;
  } else if (year) {
    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return { status: 400, success: false, message: 'Invalid year value' };
    }
    const startOfYear = new Date(parsedYear, 0, 1);
    const endOfYear = new Date(parsedYear, 11, 31, 23, 59, 59, 999);
    dateFilter = {
      $gte: new Date(Math.max(startOfYear, new Date(student.createdAt))),
      $lte: endOfYear
    };
    filterDescription = `Year ${parsedYear}`;
  } else {
    dateFilter = {
      $gte: new Date(student.createdAt),
      $lte: new Date()
    };
    filterDescription = `All time since ${new Date(student.createdAt).toDateString()}`;
  }

  const attendanceRecords = await attendanceService.getStudentAttendanceRecords(studentId, studentLectureIds, dateFilter);

  const pendingSlots = attendanceRecords.filter(r => r.status === 'pending').length;
  const awaitingSlots = attendanceRecords.filter(r => r.status === 'awaiting_approval').length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalSlots = attendanceRecords.length;

  const counts = {
    totalSlots,
    pendingSlots,
    awaitingSlots,
    present: presentCount,
    absent: absentCount,
    totalRecords: attendanceRecords.length,
    attendancePercentage: totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0
  };

  return {
    status: 200,
    success: true,
    data: {
      studentId,
      studentName: student.name,
      studentCode: student.studentCode,
      filter: {
        year: year || null,
        month: month || null,
        date: date || null,
        startDate: startDate || null,
        endDate: endDate || null,
        description: filterDescription
      },
      counts
    }
  };
};

export default {
  createAttendanceSlot,
  getAllAttendanceSlots,
  closeAttendanceSlot,
  deleteAttendanceSlot,
  getActiveAttendanceSlots,
  markStudentAttendance,
  getAttendanceHistory,
  getAttendance,
  markAttendance,
  getAbsentStudents,
  getAttendanceDetails,
  markAttendanceAsAbsent,
  updateAttendanceStatus,
  getAttendanceByDate,
  getAttendanceStats,
  getStudentAttendanceCounts
};
