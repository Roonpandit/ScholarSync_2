import asyncHandler from 'express-async-handler';
import attendanceBusiness from '../businessLogic/attendance-business.js';

const createAttendanceSlot = asyncHandler(async (req, res) => {
  const { shift, date, startTime, endTime, lectures } = req.body;
  const result = await attendanceBusiness.createAttendanceSlot({
    shift, date, startTime, endTime, lectures, user: req.user
  });
  res.status(result.status).json(result);
});

const getAllAttendanceSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const result = await attendanceBusiness.getAllAttendanceSlots({ date, user: req.user });
  res.status(result.status).json(result);
});

const closeAttendanceSlot = asyncHandler(async (req, res) => {
  const result = await attendanceBusiness.closeAttendanceSlot(req.params.id);
  res.status(result.status).json(result);
});

const deleteAttendanceSlot = asyncHandler(async (req, res) => {
  const result = await attendanceBusiness.deleteAttendanceSlot(req.params.id);
  res.status(result.status).json(result);
});

const getActiveAttendanceSlots = asyncHandler(async (req, res) => {
  const result = await attendanceBusiness.getActiveAttendanceSlots(req.user.id);
  res.status(result.status).json(result);
});

const markStudentAttendance = asyncHandler(async (req, res) => {
  const { slotId, latitude, longitude, address } = req.body;
  const result = await attendanceBusiness.markStudentAttendance({
    slotId, latitude, longitude, address, file: req.file, user: req.user
  });
  res.status(result.status).json(result);
});

const getAttendanceHistory = asyncHandler(async (req, res) => {
  const { month, year, startDate, endDate, type } = req.query;
  const result = await attendanceBusiness.getAttendanceHistory({
    userId: req.user.id, month, year, startDate, endDate, type, userCreatedAt: req.user.createdAt
  });
  res.status(result.status).json(result);
});

const getStudentAttendanceCounts = asyncHandler(async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.id : req.params.id;
  const { year, month, date, startDate, endDate } = req.query;
  const result = await attendanceBusiness.getStudentAttendanceCounts({
    studentId, year, month, date, startDate, endDate
  });
  res.status(result.status).json(result);
});

const getAttendance = asyncHandler(async (req, res) => {
  const { slotId } = req.query;
  const result = await attendanceBusiness.getAttendance(slotId);
  res.status(result.status).json(result);
});

const markAttendance = asyncHandler(async (req, res) => {
  const { slotId, studentId, isPresent, timestamp } = req.body;
  const result = await attendanceBusiness.markAttendance({ slotId, studentId, isPresent, timestamp });
  res.status(result.status).json(result);
});

const getAbsentStudents = asyncHandler(async (req, res) => {
  const { threshold, month, year } = req.query;
  const result = await attendanceBusiness.getAbsentStudents({ threshold, month, year });
  res.status(result.status).json(result);
});

const getAttendanceDetails = asyncHandler(async (req, res) => {
  const { studentId, month, year } = req.query;
  const result = await attendanceBusiness.getAttendanceDetails({ studentId, month, year });
  res.status(result.status).json(result);
});

const markAttendanceAsAbsent = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  const result = await attendanceBusiness.markAttendanceAsAbsent({
    attendanceId: req.params.id, remark, user: req.user
  });
  res.status(result.status).json(result);
});

const updateAttendanceStatus = asyncHandler(async (req, res) => {
  const result = await attendanceBusiness.updateAttendanceStatus(
    req.params.id, req.body.action, req.body.remark, req.user
  );
  res.status(result.status).json(result);
});

const getAttendanceStats = asyncHandler(async (req, res) => {
  const { month, year, minAbsences, startDate, endDate } = req.query;
  const result = await attendanceBusiness.getAttendanceStats({
    month, year, minAbsences, startDate, endDate
  });
  res.status(result.status).json(result);
});

export default {
  createAttendanceSlot,
  getAllAttendanceSlots,
  closeAttendanceSlot,
  deleteAttendanceSlot,
  getActiveAttendanceSlots,
  markStudentAttendance,
  getAttendanceHistory,
  getStudentAttendanceCounts,
  getAttendance,
  markAttendance,
  getAbsentStudents,
  getAttendanceDetails,
  markAttendanceAsAbsent,
  updateAttendanceStatus,
  getAttendanceStats
};
