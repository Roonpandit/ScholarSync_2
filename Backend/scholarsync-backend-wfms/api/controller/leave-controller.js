import asyncHandler from 'express-async-handler';
import leaveBusiness from '../businessLogic/leave-business.js';

const applyLeave = asyncHandler(async (req, res) => {
  const { leaveRequests, leaveType, fromDate, toDate, reason } = req.body;
  const result = await leaveBusiness.applyLeave({
    leaveRequests, leaveType, fromDate, toDate, reason, studentId: req.user.id
  });
  res.status(result.status).json(result);
});

const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const { lecture, teacher, status, fromDate, toDate, page, limit } = req.query;
  const result = await leaveBusiness.getMyLeaveRequests({
    studentId: req.user.id, lecture, teacher, status, fromDate, toDate, page, limit
  });
  res.status(result.status).json(result);
});

const getLeaveRequestDetails = asyncHandler(async (req, res) => {
  const result = await leaveBusiness.getLeaveRequestDetails({
    requestId: req.params.requestId, studentId: req.user.id
  });
  res.status(result.status).json(result);
});

const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const result = await leaveBusiness.deleteLeaveRequest({
    requestId: req.params.requestId, studentId: req.user.id
  });
  res.status(result.status).json(result);
});

const manageLeaveRequest = asyncHandler(async (req, res) => {
  const result = await leaveBusiness.manageLeaveRequest(
    req.params.requestId, req.body.action, req.body, req.user
  );
  res.status(result.status).json(result);
});

const getLeaveRequests = asyncHandler(async (req, res) => {
  const result = await leaveBusiness.getLeaveRequests(req.query.status, req.user);
  res.status(result.status).json(result);
});

const checkLeaveForSlot = asyncHandler(async (req, res) => {
  const { studentId, attendanceSlotId } = req.query;
  const result = await leaveBusiness.checkLeaveForSlot({ studentId, attendanceSlotId });
  res.status(result.status).json(result);
});

const getLeaveDetailsForAttendance = asyncHandler(async (req, res) => {
  const result = await leaveBusiness.getLeaveDetailsForAttendance(req.params.leaveRequestId);
  res.status(result.status).json(result);
});

export default {
  applyLeave,
  getMyLeaveRequests,
  getLeaveRequestDetails,
  deleteLeaveRequest,
  manageLeaveRequest,
  getLeaveRequests,
  checkLeaveForSlot,
  getLeaveDetailsForAttendance
};
