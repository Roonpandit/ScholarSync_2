import asyncHandler from 'express-async-handler';
import reportBusiness from '../businessLogic/report-business.js';

const getStudentDetailsWithAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { year, month, date, startDate, endDate } = req.query;
  const result = await reportBusiness.getStudentDetailsWithAttendance(id, {
    year, month, date, startDate, endDate
  });
  res.status(result.status).json(result);
});

const getAttendanceDetails = asyncHandler(async (req, res) => {
  const { studentId, month, year } = req.query;
  const result = await reportBusiness.getAttendanceDetails(studentId, month, year);
  res.status(result.status).json(result);
});

const getAttendanceStats = asyncHandler(async (req, res) => {
  const result = await reportBusiness.getAttendanceStats(req.query);
  res.status(result.status).json(result);
});

const getLeaveStats = asyncHandler(async (req, res) => {
  const result = await reportBusiness.getLeaveStats();
  res.status(result.status).json(result);
});

export default {
  getStudentDetailsWithAttendance,
  getAttendanceDetails,
  getAttendanceStats,
  getLeaveStats
};
