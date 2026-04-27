import { Sequelize } from 'sequelize';
import {
  Student,
  Attendance,
  AttendanceSlot,
  LeaveRequest,
  sequelize
} from 'scholarsync-backend-common';

const { Op } = Sequelize;

/**
 * Find a student by ID (without password).
 * @param {string} studentId
 * @returns {Promise<Object|null>}
 */
const getStudentWithLectures = async (studentId) => {
  return Student.findByPk(studentId, {
    attributes: { exclude: ['password'] },
    raw: true
  });
};

/**
 * Find attendance records for a student filtered by lecture IDs and date range.
 * Uses a raw SQL query to join with attendance_slots and lectures.
 * @param {string} studentId
 * @param {Array} lectureIds
 * @param {{ startDate: Date, endDate: Date }} dateRange
 * @returns {Promise<Array>}
 */
const getAttendanceRecords = async (studentId, lectureIds, dateRange) => {
  if (!lectureIds || lectureIds.length === 0) return [];

  const records = await sequelize.query(`
    SELECT
      a.id,
      a.date,
      a.status,
      a.shift,
      a.student_id AS "studentId",
      a.lecture_id AS "lectureId",
      a.slot_id AS "slotId",
      a.marked_at AS "markedAt",
      a.created_at AS "createdAt",
      s.shift AS "slotShift",
      s.start_time AS "slotStartTime",
      s.end_time AS "slotEndTime",
      s.date AS "slotDate"
    FROM attendances a
    JOIN attendance_slots s ON a.slot_id = s.id
    WHERE a.student_id = :studentId
      AND a.lecture_id IN (:lectureIds)
      AND a.date >= :startDate
      AND a.date <= :endDate
    ORDER BY a.date DESC
  `, {
    replacements: { studentId, lectureIds, startDate: dateRange.startDate, endDate: dateRange.endDate },
    type: Sequelize.QueryTypes.SELECT
  });

  return records;
};

/**
 * Find attendance records for a student (lean, no joins) for counting.
 * @param {string} studentId
 * @param {Array} lectureIds
 * @param {{ startDate: Date, endDate: Date }} dateRange
 * @returns {Promise<Array>}
 */
const getAttendanceRecordsLean = async (studentId, lectureIds, dateRange) => {
  if (!lectureIds || lectureIds.length === 0) return [];

  return Attendance.findAll({
    where: {
      studentId,
      lectureId: lectureIds,
      date: {
        [Op.gte]: dateRange.startDate,
        [Op.lte]: dateRange.endDate
      }
    },
    raw: true
  });
};

/**
 * Run attendance aggregation for monthly details.
 * Matches only active/closed slots via JOIN.
 * @param {string} studentId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>}
 */
const getAttendanceAggregation = async (studentId, startDate, endDate) => {
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
    replacements: { studentId, startDate, endDate },
    type: Sequelize.QueryTypes.SELECT
  });

  return records;
};

/**
 * Get attendance stats: all students, slots, and attendance records in a date range.
 * @param {{ startDate: Date, endDate: Date }} dateRange
 * @returns {Promise<{ allStudents: Array, slots: Array, attendanceRecords: Array }>}
 */
const getAttendanceStatsData = async (dateRange) => {
  const { Op } = Sequelize;

  const [allStudents, slots, attendanceRecords] = await Promise.all([
    Student.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'studentCode', 'created_at', 'lectures'],
      raw: true
    }),
    AttendanceSlot.findAll({
      where: {
        date: {
          [Op.gte]: dateRange.startDate,
          [Op.lte]: dateRange.endDate
        },
        status: ['active', 'closed']
      },
      raw: true
    }),
    sequelize.query(`
      SELECT
        a.id,
        a.date,
        a.status,
        a.slot_id AS "slotId",
        a.student_id AS "studentId",
        a.student_name AS "studentName",
        a.student_email AS "studentEmail",
        a.student_code AS "studentCode"
      FROM attendances a
      WHERE a.date >= :startDate
        AND a.date <= :endDate
    `, {
      replacements: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      type: Sequelize.QueryTypes.SELECT
    })
  ]);

  return { allStudents, slots, attendanceRecords };
};

/**
 * Get leave statistics by status and type using Sequelize group queries.
 * @returns {Promise<{ statusStats: Array, typeStats: Array }>}
 */
const getLeaveStatsData = async () => {
  const [statusStats, typeStats] = await Promise.all([
    LeaveRequest.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', '*'), 'count']],
      group: ['status'],
      raw: true
    }),
    LeaveRequest.findAll({
      attributes: ['leaveType', [Sequelize.fn('COUNT', '*'), 'count']],
      group: ['leaveType'],
      raw: true
    })
  ]);

  return { statusStats, typeStats };
};

export default {
  getStudentWithLectures,
  getAttendanceRecords,
  getAttendanceRecordsLean,
  getAttendanceAggregation,
  getAttendanceStatsData,
  getLeaveStatsData
};
