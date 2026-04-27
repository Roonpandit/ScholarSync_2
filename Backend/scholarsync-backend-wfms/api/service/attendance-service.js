import { Sequelize } from 'sequelize';
import {
  Student,
  Teacher,
  Attendance,
  AttendanceSlot,
  LeaveSlot,
  Lecture,
  sequelize
} from 'scholarsync-backend-common';

const { Op } = Sequelize;

// ========================
// ATTENDANCE SLOT OPERATIONS
// ========================

const findSlotById = async (slotId) => {
  return AttendanceSlot.findByPk(slotId);
};

const findSlotByIdPopulated = async (slotId) => {
  // No populate in Sequelize — return raw slot
  return AttendanceSlot.findByPk(slotId);
};

const createAttendanceSlot = async (data) => {
  return AttendanceSlot.create(data);
};

const findExistingSlot = async (date, shift, lectureId) => {
  return AttendanceSlot.findOne({ where: { date, shift, lectureId } });
};

const getAllSlots = async (query) => {
  // Convert Mongoose-style query to Sequelize where clause
  const where = {};
  if (query.date) where.date = query.date;
  if (query.lectureId) where.lectureId = query.lectureId;
  // Support legacy 'lecture' key with $in
  if (query.lecture) {
    if (query.lecture.$in) {
      where.lectureId = query.lecture.$in;
    } else {
      where.lectureId = query.lecture;
    }
  }

  return AttendanceSlot.findAll({
    where,
    order: [['date', 'DESC'], ['shift', 'ASC']]
  });
};

const closeSlot = async (slotId) => {
  const slot = await AttendanceSlot.findByPk(slotId);
  if (!slot) return null;
  slot.isClosed = true;
  await slot.save();
  return slot;
};

const deleteSlotById = async (slotId) => {
  return AttendanceSlot.destroy({ where: { id: slotId } });
};

const saveSlot = async (slot) => {
  return slot.save();
};

const getActiveSlots = async (lectureIds) => {
  return AttendanceSlot.findAll({
    where: {
      isActive: true,
      status: ['active', 'upcoming'],
      lectureId: lectureIds
    },
    order: [['startTime', 'ASC']]
  });
};

const getSlotsByDateAndStatus = async (dateFilter, statuses) => {
  const where = { status: statuses };
  if (dateFilter.date) {
    where.date = {};
    if (dateFilter.date.$gte || dateFilter.date[Op.gte]) {
      where.date[Op.gte] = dateFilter.date.$gte || dateFilter.date[Op.gte];
    }
    if (dateFilter.date.$lte || dateFilter.date[Op.lte]) {
      where.date[Op.lte] = dateFilter.date.$lte || dateFilter.date[Op.lte];
    }
  }
  return AttendanceSlot.findAll({ where });
};

const getSlotsByLecture = async (lectureId) => {
  return AttendanceSlot.findAll({
    where: { lectureId },
    attributes: ['id']
  });
};

// ========================
// ATTENDANCE RECORD OPERATIONS
// ========================

const findAttendanceByStudentAndSlot = async (studentId, slotId) => {
  return Attendance.findOne({ where: { studentId, slotId } });
};

const findAttendanceById = async (id) => {
  return Attendance.findByPk(id);
};

const findAttendanceByIdPopulated = async (id) => {
  // No populate in Sequelize — return raw record
  return Attendance.findByPk(id);
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

const insertManyAttendance = async (records) => {
  if (records.length === 0) return [];
  // Map old field names
  const mapped = records.map(r => {
    const rec = { ...r };
    if (rec.student !== undefined && rec.studentId === undefined) {
      rec.studentId = rec.student;
      delete rec.student;
    }
    if (rec.slot !== undefined && rec.slotId === undefined) {
      rec.slotId = rec.slot;
      delete rec.slot;
    }
    if (rec.lecture !== undefined && rec.lectureId === undefined) {
      rec.lectureId = rec.lecture;
      delete rec.lecture;
    }
    return rec;
  });
  return Attendance.bulkCreate(mapped, { ignoreDuplicates: true });
};

const saveAttendance = async (attendance) => {
  return attendance.save();
};

const getAttendanceByStudentSlots = async (studentId, slotIds) => {
  return Attendance.findAll({
    where: {
      studentId,
      slotId: slotIds
    }
  });
};

const getAttendanceByDateFilter = async (dateFilter) => {
  const where = {};
  if (dateFilter.student) where.studentId = dateFilter.student;
  if (dateFilter.studentId) where.studentId = dateFilter.studentId;
  if (dateFilter.date) {
    where.date = {};
    if (dateFilter.date.$gte || dateFilter.date[Op.gte]) {
      where.date[Op.gte] = dateFilter.date.$gte || dateFilter.date[Op.gte];
    }
    if (dateFilter.date.$lte || dateFilter.date[Op.lte]) {
      where.date[Op.lte] = dateFilter.date.$lte || dateFilter.date[Op.lte];
    }
  }
  return Attendance.findAll({
    where,
    order: [['date', 'DESC']]
  });
};

const getAttendanceByStudentAndDateRange = async (studentId, dateFilter) => {
  const where = { studentId };
  if (dateFilter.date) {
    where.date = {};
    if (dateFilter.date.$gte || dateFilter.date[Op.gte]) {
      where.date[Op.gte] = dateFilter.date.$gte || dateFilter.date[Op.gte];
    }
    if (dateFilter.date.$lte || dateFilter.date[Op.lte]) {
      where.date[Op.lte] = dateFilter.date.$lte || dateFilter.date[Op.lte];
    }
  }
  return Attendance.findAll({ where });
};

const getAttendanceBySlotId = async (slotId) => {
  return Attendance.findAll({
    where: { slotId },
    order: [['createdAt', 'DESC']]
  });
};

const getAttendanceBySlotIdBasic = async (slotId) => {
  return Attendance.findAll({
    where: { slotId }
  });
};

const deleteAttendanceBySlotId = async (slotId) => {
  return Attendance.destroy({ where: { slotId } });
};

const deleteAttendanceBySlotIds = async (slotIds) => {
  return Attendance.destroy({ where: { slotId: slotIds } });
};

const getAttendanceRecordsBySlotIds = async (slotIds) => {
  return Attendance.findAll({ where: { slotId: slotIds } });
};

const getAttendanceByDateRange = async (dateFilter) => {
  const where = {};
  if (dateFilter.date) {
    where.date = {};
    if (dateFilter.date.$gte || dateFilter.date[Op.gte]) {
      where.date[Op.gte] = dateFilter.date.$gte || dateFilter.date[Op.gte];
    }
    if (dateFilter.date.$lte || dateFilter.date[Op.lte]) {
      where.date[Op.lte] = dateFilter.date.$lte || dateFilter.date[Op.lte];
    }
  }
  return Attendance.findAll({ where });
};

const getAttendanceByDate = async (date, shift) => {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);

  const where = { date: localDate };
  if (shift) where.shift = shift;

  return Attendance.findAll({ where });
};

const getAttendanceDetails = async (studentId, monthNum, yearNum, studentCreatedAt) => {
  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
  const effectiveStart = new Date(Math.max(startDate, new Date(studentCreatedAt)));

  // Raw SQL to replace Mongoose aggregate with $lookup
  const records = await sequelize.query(`
    SELECT
      a.id,
      a.date,
      a.status,
      s.status AS "slotStatus",
      s.shift,
      s.start_time AS "startTime",
      s.end_time AS "endTime",
      a.created_at AS "createdAt"
    FROM attendances a
    JOIN attendance_slots s ON a.slot_id = s.id
    WHERE a.student_id = :studentId
      AND a.date >= :startDate
      AND a.date <= :endDate
      AND s.status IN ('active', 'closed')
    ORDER BY a.date ASC
  `, {
    replacements: {
      studentId,
      startDate: effectiveStart.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    },
    type: Sequelize.QueryTypes.SELECT
  });

  return records;
};

const getStudentAttendanceRecords = async (studentId, lectureIds, dateFilter) => {
  if (!lectureIds || lectureIds.length === 0) return [];

  const where = {
    studentId,
    lectureId: lectureIds
  };

  if (dateFilter) {
    where.date = {};
    if (dateFilter.$gte || dateFilter[Op.gte]) {
      where.date[Op.gte] = dateFilter.$gte || dateFilter[Op.gte];
    }
    if (dateFilter.$lte || dateFilter[Op.lte]) {
      where.date[Op.lte] = dateFilter.$lte || dateFilter[Op.lte];
    }
  }

  return Attendance.findAll({ where, raw: true });
};

const getStudentAttendanceRecordsPopulated = async (studentId, lectureIds, dateFilter) => {
  if (!lectureIds || lectureIds.length === 0) return [];

  const where = {
    studentId,
    lectureId: lectureIds
  };

  if (dateFilter) {
    where.date = {};
    if (dateFilter.$gte || dateFilter[Op.gte]) {
      where.date[Op.gte] = dateFilter.$gte || dateFilter[Op.gte];
    }
    if (dateFilter.$lte || dateFilter[Op.lte]) {
      where.date[Op.lte] = dateFilter.$lte || dateFilter[Op.lte];
    }
  }

  return Attendance.findAll({
    where,
    order: [['date', 'DESC']],
    raw: true
  });
};

const updateManyAttendance = async (filter, update) => {
  // Convert Mongoose-style filter/update to Sequelize
  const where = {};
  if (filter.slot) where.slotId = filter.slot;
  if (filter.slotId) where.slotId = filter.slotId;
  if (filter.student) where.studentId = filter.student;
  if (filter.studentId) where.studentId = filter.studentId;
  if (filter.status) where.status = filter.status;
  if (filter.leaveRequestId) where.leaveRequestId = filter.leaveRequestId;

  // Handle date filters
  if (filter.date) {
    where.date = {};
    if (filter.date.$gte || filter.date[Op.gte]) {
      where.date[Op.gte] = filter.date.$gte || filter.date[Op.gte];
    }
    if (filter.date.$lte || filter.date[Op.lte]) {
      where.date[Op.lte] = filter.date.$lte || filter.date[Op.lte];
    }
  }

  // Handle $in for arrays
  if (filter.student && filter.student.$in) {
    where.studentId = filter.student.$in;
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
  // If no $set/$unset, use update directly
  if (!update.$set && !update.$unset) {
    updateValues = update;
  }

  const [affectedCount] = await Attendance.update(updateValues, { where });
  return { modifiedCount: affectedCount };
};

// ========================
// STUDENT OPERATIONS
// ========================

const findStudentById = async (studentId) => {
  return Student.findByPk(studentId);
};

const findStudentByIdWithLectures = async (studentId) => {
  return Student.findByPk(studentId, {
    attributes: ['id', 'lectures']
  });
};

const findStudentByIdPopulated = async (studentId) => {
  // lectures is ARRAY(UUID) in Sequelize — no populate needed
  return Student.findByPk(studentId, { raw: true });
};

const getStudentsInLecture = async (lectureId) => {
  return Student.findAll({
    where: {
      lectures: { [Op.contains]: [lectureId] },
      role: 'student'
    }
  });
};

const getAllStudents = async () => {
  return Student.findAll({
    where: { role: 'student' },
    attributes: ['id', 'name', 'email', 'studentCode', 'createdAt', 'lectures']
  });
};

// ========================
// TEACHER OPERATIONS
// ========================

const findTeacherById = async (teacherId) => {
  return Teacher.findByPk(teacherId, {
    attributes: ['id', 'lectures']
  });
};

// ========================
// LEAVE SLOT OPERATIONS
// ========================

const hasLeaveForSlot = async (studentId, slotId) => {
  return LeaveSlot.hasLeaveForSlot(studentId, slotId);
};

export default {
  // Slot operations
  findSlotById,
  findSlotByIdPopulated,
  createAttendanceSlot,
  findExistingSlot,
  getAllSlots,
  closeSlot,
  deleteSlotById,
  saveSlot,
  getActiveSlots,
  getSlotsByDateAndStatus,
  getSlotsByLecture,

  // Attendance record operations
  findAttendanceByStudentAndSlot,
  findAttendanceById,
  findAttendanceByIdPopulated,
  createAttendance,
  insertManyAttendance,
  saveAttendance,
  getAttendanceByStudentSlots,
  getAttendanceByDateFilter,
  getAttendanceByStudentAndDateRange,
  getAttendanceBySlotId,
  getAttendanceBySlotIdBasic,
  deleteAttendanceBySlotId,
  deleteAttendanceBySlotIds,
  getAttendanceRecordsBySlotIds,
  getAttendanceByDateRange,
  getAttendanceByDate,
  getAttendanceDetails,
  getStudentAttendanceRecords,
  getStudentAttendanceRecordsPopulated,
  updateManyAttendance,

  // Student operations
  findStudentById,
  findStudentByIdWithLectures,
  findStudentByIdPopulated,
  getStudentsInLecture,
  getAllStudents,

  // Teacher operations
  findTeacherById,

  // Leave operations
  hasLeaveForSlot
};
