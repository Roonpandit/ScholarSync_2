import { Sequelize } from 'sequelize';
import {
  Student,
  Teacher,
  Lecture,
  LeaveRequest,
  LeaveSlot,
  Attendance,
  AttendanceSlot,
  sequelize
} from 'scholarsync-backend-common';

const { Op } = Sequelize;

// ========================
// LEAVE REQUEST OPERATIONS
// ========================

const createLeaveRequest = async (data) => {
  return LeaveRequest.create(data);
};

const findLeaveById = async (requestId) => {
  return LeaveRequest.findByPk(requestId);
};

const findLeaveByIdPopulated = async (requestId) => {
  // No populate — return raw record
  return LeaveRequest.findByPk(requestId);
};

const findLeaveByIdAndStudent = async (requestId, studentId) => {
  return LeaveRequest.findOne({ where: { id: requestId, studentId } });
};

const findLeaveByIdAndStudentPopulated = async (requestId, studentId) => {
  return LeaveRequest.findOne({ where: { id: requestId, studentId } });
};

const findLeaveByIdAndTeacher = async (requestId, teacherId) => {
  return LeaveRequest.findOne({ where: { id: requestId, teacherId } });
};

const deleteLeaveById = async (requestId) => {
  return LeaveRequest.destroy({ where: { id: requestId } });
};

const saveLeaveRequest = async (request) => {
  return request.save();
};

const findOverlappingLeave = async (studentId, lectureId, fromDate, toDate) => {
  return LeaveRequest.findOne({
    where: {
      studentId,
      lectureId,
      status: ['pending', 'approved'],
      fromDate: { [Op.lte]: new Date(toDate) },
      toDate: { [Op.gte]: new Date(fromDate) }
    }
  });
};

const getMyLeaveRequests = async (query, skip, limit) => {
  const where = buildLeaveWhere(query);

  const [requests, total] = await Promise.all([
    LeaveRequest.findAll({
      where,
      order: [['appliedAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    }),
    LeaveRequest.count({ where })
  ]);
  return { requests, total };
};

const getPendingLeaveRequests = async (query, skip, limit) => {
  const where = buildLeaveWhere(query);

  const [requests, total] = await Promise.all([
    LeaveRequest.findAll({
      where,
      order: [['appliedAt', 'ASC']],
      offset: skip,
      limit: parseInt(limit)
    }),
    LeaveRequest.count({ where })
  ]);
  return { requests, total };
};

const getAllLeaveRequestsForTeacher = async (query, skip, limit) => {
  const where = buildLeaveWhere(query);

  const [requests, total] = await Promise.all([
    LeaveRequest.findAll({
      where,
      order: [['appliedAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    }),
    LeaveRequest.count({ where })
  ]);
  return { requests, total };
};

const getAllLeaveRequests = async (query, skip, limit) => {
  const where = buildLeaveWhere(query);

  const [requests, total] = await Promise.all([
    LeaveRequest.findAll({
      where,
      order: [['appliedAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    }),
    LeaveRequest.count({ where })
  ]);
  return { requests, total };
};

/**
 * Build Sequelize where clause from Mongoose-style query object.
 */
const buildLeaveWhere = (query) => {
  const where = {};

  if (query.studentId) where.studentId = query.studentId;
  if (query.teacherId) where.teacherId = query.teacherId;

  if (query.lectureId) {
    if (query.lectureId.$in) {
      where.lectureId = query.lectureId.$in;
    } else {
      where.lectureId = query.lectureId;
    }
  }

  if (query.teacherId && query.teacherId.$in) {
    where.teacherId = query.teacherId.$in;
  }

  if (query.status) {
    if (query.status.$in) {
      where.status = query.status.$in;
    } else {
      where.status = query.status;
    }
  }

  // Handle date overlap queries ($or with fromDate/toDate)
  if (query.$or && query.$or.length > 0) {
    const orConditions = query.$or.map(cond => {
      const c = {};
      if (cond.fromDate && cond.fromDate.$lte) {
        c.fromDate = { [Op.lte]: cond.fromDate.$lte };
      }
      if (cond.toDate && cond.toDate.$gte) {
        c.toDate = { [Op.gte]: cond.toDate.$gte };
      }
      return c;
    });
    where[Op.or] = orConditions;
  }

  // Simple date filters
  if (query.fromDate && !query.$or) {
    if (query.fromDate.$lte) {
      where.fromDate = { [Op.lte]: query.fromDate.$lte };
    }
  }
  if (query.toDate && !query.$or) {
    if (query.toDate.$gte) {
      where.toDate = { [Op.gte]: query.toDate.$gte };
    }
  }

  return where;
};

const getLeaveStats = async () => {
  const stats = await LeaveRequest.findAll({
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  const leaveTypeStats = await LeaveRequest.findAll({
    attributes: [
      'leaveType',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['leaveType'],
    raw: true
  });

  return { stats, leaveTypeStats };
};

// ========================
// LEAVE SLOT OPERATIONS
// ========================

const createSlotsForLeave = async (leaveRequestId, studentId, lectureId, fromDate, toDate) => {
  return LeaveSlot.createSlotsForLeave(leaveRequestId, studentId, lectureId, fromDate, toDate);
};

const deleteLeaveSlots = async (requestId) => {
  return LeaveSlot.deleteLeaveSlots(requestId);
};

const approveLeaveSlots = async (requestId) => {
  return LeaveSlot.approveLeaveSlots(requestId);
};

const cancelFutureSlots = async (requestId) => {
  return LeaveSlot.cancelFutureSlots(requestId);
};

const findLeaveSlotsOnLeave = async (requestId) => {
  return LeaveSlot.findAll({ where: { leaveRequestId: requestId, status: 'on_leave' } });
};

const hasLeaveForSlot = async (studentId, attendanceSlotId) => {
  return LeaveSlot.hasLeaveForSlot(studentId, attendanceSlotId);
};

// ========================
// RELATED MODEL OPERATIONS
// ========================

const findStudentById = async (studentId) => {
  // lectures is ARRAY(UUID) — no populate needed
  return Student.findByPk(studentId);
};

const findStudentByIdBasic = async (studentId) => {
  return Student.findByPk(studentId);
};

const findTeacherById = async (teacherId) => {
  return Teacher.findByPk(teacherId);
};

const findLectureById = async (lectureId) => {
  return Lecture.findByPk(lectureId);
};

const findAttendanceSlotById = async (slotId) => {
  return AttendanceSlot.findByPk(slotId);
};

const findAttendanceByStudentAndSlot = async (studentId, slotId) => {
  return Attendance.findOne({ where: { studentId, slotId } });
};

const createAttendance = async (data) => {
  // Map old Mongoose field names to Sequelize camelCase
  const mapped = { ...data };
  if (mapped.student !== undefined && mapped.studentId === undefined) {
    mapped.studentId = mapped.student;
    delete mapped.student;
  }
  if (mapped.slot !== undefined && mapped.slotId === undefined) {
    mapped.slotId = mapped.slot;
    delete mapped.slot;
  }
  if (mapped.lecture !== undefined && mapped.lectureId === undefined) {
    mapped.lectureId = mapped.lecture;
    delete mapped.lecture;
  }
  return Attendance.create(mapped);
};

const updateManyAttendance = async (filter, update) => {
  const where = {};
  if (filter.leaveRequestId) where.leaveRequestId = filter.leaveRequestId;
  if (filter.status) where.status = filter.status;

  if (filter.date) {
    where.date = {};
    if (filter.date.$gte || filter.date[Op.gte]) {
      where.date[Op.gte] = filter.date.$gte || filter.date[Op.gte];
    }
  }

  // Extract update values (strip $set / $unset)
  let updateValues = {};
  if (update.$set) {
    updateValues = { ...updateValues, ...update.$set };
  }
  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) {
      updateValues[key] = null;
    }
  }
  if (!update.$set && !update.$unset) {
    updateValues = update;
  }

  const [affectedCount] = await Attendance.update(updateValues, { where });
  return { modifiedCount: affectedCount };
};

export default {
  // Leave request operations
  createLeaveRequest,
  findLeaveById,
  findLeaveByIdPopulated,
  findLeaveByIdAndStudent,
  findLeaveByIdAndStudentPopulated,
  findLeaveByIdAndTeacher,
  deleteLeaveById,
  saveLeaveRequest,
  findOverlappingLeave,
  getMyLeaveRequests,
  getPendingLeaveRequests,
  getAllLeaveRequestsForTeacher,
  getAllLeaveRequests,
  getLeaveStats,

  // Leave slot operations
  createSlotsForLeave,
  deleteLeaveSlots,
  approveLeaveSlots,
  cancelFutureSlots,
  findLeaveSlotsOnLeave,
  hasLeaveForSlot,

  // Related model operations
  findStudentById,
  findStudentByIdBasic,
  findTeacherById,
  findLectureById,
  findAttendanceSlotById,
  findAttendanceByStudentAndSlot,
  createAttendance,
  updateManyAttendance
};
