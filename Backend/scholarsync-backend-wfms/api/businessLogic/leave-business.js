import { Sequelize } from 'sequelize';
import leaveService from '../service/leave-service.js';
import { LEAVE_MANAGE_ACTIONS } from '../../constants/application-constants.js';

const { Op } = Sequelize;

// ========================
// STUDENT LEAVE OPERATIONS
// ========================

/**
 * Apply for leave - validates lecture-teacher pairs, checks enrollment,
 * checks overlapping leaves, creates request + leave slots
 */
const applyLeave = async ({ leaveRequests, leaveType, fromDate, toDate, reason, studentId }) => {
  if (!leaveRequests || !Array.isArray(leaveRequests) || leaveRequests.length === 0) {
    return { status: 400, success: false, message: 'Please provide at least one lecture-teacher pair' };
  }

  if (!leaveType || !fromDate || !toDate || !reason) {
    return { status: 400, success: false, message: 'Please provide all required fields' };
  }

  const student = await leaveService.findStudentById(studentId);
  if (!student) {
    return { status: 404, success: false, message: 'Student not found' };
  }

  const studentLectureIds = (student.lectures || []).map(l => l.toString ? l.toString() : l);
  const createdRequests = [];

  for (const request of leaveRequests) {
    const { lectureId, teacherId } = request;

    if (!studentLectureIds.includes(lectureId)) {
      return { status: 400, success: false, message: 'You are not enrolled in the selected lecture' };
    }

    const lecture = await leaveService.findLectureById(lectureId);
    if (!lecture) {
      return { status: 404, success: false, message: 'Lecture not found' };
    }

    if (lecture.isDefault) {
      return { status: 400, success: false, message: 'Cannot apply leave for default lecture' };
    }

    const teacher = await leaveService.findTeacherById(teacherId);
    if (!teacher) {
      return { status: 404, success: false, message: 'Teacher not found' };
    }

    if (!teacher.lectures.some(l => (l.toString ? l.toString() : l) === lectureId)) {
      return { status: 400, success: false, message: 'Selected teacher is not assigned to the lecture' };
    }

    const existingLeave = await leaveService.findOverlappingLeave(studentId, lectureId, fromDate, toDate);

    if (existingLeave) {
      const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      // Fetch lecture name for message
      const lectureName = lecture.name;
      return {
        status: 400,
        success: false,
        message: `You already have a ${existingLeave.status} leave request for ${lectureName} from ${formatDate(existingLeave.fromDate)} to ${formatDate(existingLeave.toDate)}. Please delete or cancel it before applying for overlapping dates.`
      };
    }

    const leaveRequest = await leaveService.createLeaveRequest({
      studentId,
      lectureId,
      teacherId,
      leaveType,
      fromDate,
      toDate,
      reason,
      status: 'pending',
      appliedAt: new Date()
    });

    await leaveService.createSlotsForLeave(leaveRequest.id, studentId, lectureId, fromDate, toDate);

    createdRequests.push(leaveRequest);
  }

  return {
    status: 201,
    success: true,
    message: 'Leave requests submitted successfully',
    data: createdRequests
  };
};

/**
 * Get student's leave requests with filters and pagination
 */
const getMyLeaveRequests = async ({ studentId, lecture, teacher, status, fromDate, toDate, page = 1, limit = 10 }) => {
  const query = { studentId };

  if (lecture) {
    const lectureIds = Array.isArray(lecture) ? lecture : [lecture];
    query.lectureId = { $in: lectureIds };
  }

  if (teacher) {
    const teacherIds = Array.isArray(teacher) ? teacher : [teacher];
    query.teacherId = { $in: teacherIds };
  }

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query.status = { $in: statuses };
  }

  if (fromDate || toDate) {
    query.$or = [];
    if (fromDate && toDate) {
      query.$or = [
        { fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } }
      ];
    } else if (fromDate) {
      query.toDate = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.fromDate = { $lte: new Date(toDate) };
    }
  }

  const skip = (page - 1) * limit;
  const { requests, total } = await leaveService.getMyLeaveRequests(query, skip, limit);

  return {
    status: 200,
    success: true,
    data: requests,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single leave request details
 */
const getLeaveRequestDetails = async ({ requestId, studentId }) => {
  const request = await leaveService.findLeaveByIdAndStudentPopulated(requestId, studentId);

  if (!request) {
    return { status: 404, success: false, message: 'Leave request not found' };
  }

  return { status: 200, success: true, data: request };
};

/**
 * Delete pending leave request
 */
const deleteLeaveRequest = async ({ requestId, studentId }) => {
  const request = await leaveService.findLeaveByIdAndStudent(requestId, studentId);

  if (!request) {
    return { status: 404, success: false, message: 'Leave request not found' };
  }

  if (!request.canDelete()) {
    return { status: 400, success: false, message: 'Can only delete pending requests' };
  }

  await leaveService.deleteLeaveSlots(requestId);
  await leaveService.deleteLeaveById(requestId);

  return { status: 200, success: true, message: 'Leave request deleted successfully' };
};

// ========================
// MERGED: MANAGE LEAVE REQUEST (approve/reject/resend/cancel)
// ========================

/**
 * Manage leave request - dispatches to appropriate internal handler based on action
 * action must be one of: 'approve', 'reject', 'resend', 'cancel'
 */
const manageLeaveRequest = async (requestId, action, data, user) => {
  const validActions = Object.values(LEAVE_MANAGE_ACTIONS);
  if (!action || !validActions.includes(action)) {
    return { status: 400, success: false, message: `Invalid action. Must be one of: ${validActions.join(', ')}` };
  }

  switch (action) {
    case LEAVE_MANAGE_ACTIONS.APPROVE:
      return _approveLeaveRequest({ requestId, teacherId: user.id });
    case LEAVE_MANAGE_ACTIONS.REJECT:
      return _rejectLeaveRequest({ requestId, teacherRemark: data.teacherRemark, teacherId: user.id });
    case LEAVE_MANAGE_ACTIONS.RESEND:
      return _resendLeaveRequest({ requestId, studentRemark: data.studentRemark, studentId: user.id });
    case LEAVE_MANAGE_ACTIONS.CANCEL:
      return _cancelLeaveRequest({ requestId, cancelReason: data.cancelReason, studentId: user.id });
    default:
      return { status: 400, success: false, message: `Invalid action: ${action}` };
  }
};

/**
 * Internal: Resend rejected leave request - validates canResend, 48hr window
 */
const _resendLeaveRequest = async ({ requestId, studentRemark, studentId }) => {
  if (!studentRemark || studentRemark.trim().length === 0) {
    return { status: 400, success: false, message: 'Student remark is required when resending' };
  }

  const request = await leaveService.findLeaveByIdAndStudent(requestId, studentId);

  if (!request) {
    return { status: 404, success: false, message: 'Leave request not found' };
  }

  if (!request.canResend()) {
    return {
      status: 400,
      success: false,
      message: 'Cannot resend this request. Either it is not rejected, already resent once, or the 48-hour window has expired'
    };
  }

  request.status = 'pending';
  request.studentRemark = studentRemark;
  request.isResent = true;
  request.resendCount = (request.resendCount || 0) + 1;
  request.appliedAt = new Date();
  request.rejectedAt = null;
  request.rejectExpiresAt = null;

  await leaveService.saveLeaveRequest(request);

  await leaveService.createSlotsForLeave(request.id, studentId, request.lectureId, request.fromDate, request.toDate);

  return { status: 200, success: true, message: 'Leave request resent successfully', data: request };
};

/**
 * Internal: Cancel approved leave request - validates canCancel, cancels future slots
 */
const _cancelLeaveRequest = async ({ requestId, cancelReason, studentId }) => {
  if (!cancelReason || cancelReason.trim().length === 0) {
    return { status: 400, success: false, message: 'Cancel reason is required' };
  }

  const request = await leaveService.findLeaveByIdAndStudent(requestId, studentId);

  if (!request) {
    return { status: 404, success: false, message: 'Leave request not found' };
  }

  if (!request.canCancel()) {
    return { status: 400, success: false, message: 'Can only cancel approved requests' };
  }

  request.status = 'cancelled';
  request.isCancelled = true;
  request.cancelledAt = new Date();
  request.cancelReason = cancelReason;
  await leaveService.saveLeaveRequest(request);

  await leaveService.cancelFutureSlots(requestId);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  await leaveService.updateManyAttendance(
    {
      leaveRequestId: requestId,
      date: { $gte: now },
      status: 'on_leave'
    },
    {
      $set: { status: 'pending' },
      $unset: { leaveRequestId: 1 }
    }
  );

  return { status: 200, success: true, message: 'Leave request cancelled successfully', data: request };
};

// ========================
// MERGED: GET LEAVE REQUESTS (pending + all)
// ========================

/**
 * Get leave requests with optional status filter.
 * If status is provided, filter by it; otherwise return all.
 * Teacher sees only their assigned requests; Admin sees all.
 */
const getLeaveRequests = async (status, user) => {
  if (status === 'pending') {
    return _getPendingLeaveRequests({ teacherId: user.id });
  }

  // For teacher, delegate to teacher-specific query
  if (user.role === 'teacher') {
    return _getAllLeaveRequestsForTeacher({ teacherId: user.id, status });
  }

  // Admin: return all with optional status filter
  return _getAllLeaveRequests({ status });
};

/**
 * Internal: Get pending leave requests for teacher
 */
const _getPendingLeaveRequests = async ({ teacherId, lecture, student, page = 1, limit = 10 }) => {
  const query = { teacherId, status: 'pending' };

  if (lecture) {
    const lectureIds = Array.isArray(lecture) ? lecture : [lecture];
    query.lectureId = { $in: lectureIds };
  }

  if (student) {
    query.studentId = student;
  }

  const skip = (page - 1) * limit;
  const { requests, total } = await leaveService.getPendingLeaveRequests(query, skip, limit);

  return {
    status: 200,
    success: true,
    data: requests,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Internal: Get all leave requests for teacher with filters
 */
const _getAllLeaveRequestsForTeacher = async ({ teacherId, lecture, student, status, fromDate, toDate, page = 1, limit = 10 }) => {
  const query = { teacherId };

  if (lecture) {
    const lectureIds = Array.isArray(lecture) ? lecture : [lecture];
    query.lectureId = { $in: lectureIds };
  }

  if (student) {
    query.studentId = student;
  }

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query.status = { $in: statuses };
  }

  if (fromDate || toDate) {
    query.$or = [];
    if (fromDate && toDate) {
      query.$or = [
        { fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } }
      ];
    } else if (fromDate) {
      query.toDate = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.fromDate = { $lte: new Date(toDate) };
    }
  }

  const skip = (page - 1) * limit;
  const { requests, total } = await leaveService.getAllLeaveRequestsForTeacher(query, skip, limit);

  return {
    status: 200,
    success: true,
    data: requests,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Internal: Get all leave requests (Admin) with filters
 */
const _getAllLeaveRequests = async ({ lecture, teacher, student, status, fromDate, toDate, page = 1, limit = 10 }) => {
  const query = {};

  if (lecture) {
    const lectureIds = Array.isArray(lecture) ? lecture : [lecture];
    query.lectureId = { $in: lectureIds };
  }

  if (teacher) {
    const teacherIds = Array.isArray(teacher) ? teacher : [teacher];
    query.teacherId = { $in: teacherIds };
  }

  if (student) {
    query.studentId = student;
  }

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query.status = { $in: statuses };
  }

  if (fromDate || toDate) {
    query.$or = [];
    if (fromDate && toDate) {
      query.$or = [
        { fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } }
      ];
    } else if (fromDate) {
      query.toDate = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.fromDate = { $lte: new Date(toDate) };
    }
  }

  const skip = (page - 1) * limit;
  const { requests, total } = await leaveService.getAllLeaveRequests(query, skip, limit);

  return {
    status: 200,
    success: true,
    data: requests,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Internal: Approve leave request - updates status, approves leave slots, creates/updates attendance records
 */
const _approveLeaveRequest = async ({ requestId, teacherId }) => {
  const request = await leaveService.findLeaveByIdAndTeacher(requestId, teacherId);

  if (!request) {
    return { status: 404, success: false, message: 'Leave request not found' };
  }

  if (request.status !== 'pending') {
    return { status: 400, success: false, message: 'Can only approve pending requests' };
  }

  request.status = 'approved';
  request.approvedAt = new Date();
  request.respondedBy = teacherId;
  await leaveService.saveLeaveRequest(request);

  await leaveService.approveLeaveSlots(requestId);

  const leaveSlots = await leaveService.findLeaveSlotsOnLeave(requestId);

  for (const slot of leaveSlots) {
    const existingAttendance = await leaveService.findAttendanceByStudentAndSlot(request.studentId, slot.attendanceSlotId);

    if (existingAttendance) {
      existingAttendance.status = 'on_leave';
      existingAttendance.leaveRequestId = requestId;
      await existingAttendance.save();
    } else {
      const student = await leaveService.findStudentByIdBasic(request.studentId);
      const attendanceSlot = await leaveService.findAttendanceSlotById(slot.attendanceSlotId);

      if (student && attendanceSlot) {
        await leaveService.createAttendance({
          studentId: request.studentId,
          slotId: slot.attendanceSlotId,
          lectureId: request.lectureId,
          date: slot.date,
          shift: attendanceSlot.shift,
          status: 'on_leave',
          leaveRequestId: requestId,
          studentCode: student.studentCode,
          studentName: student.name,
          studentEmail: student.email
        });
      }
    }
  }

  return { status: 200, success: true, message: 'Leave request approved successfully', data: request };
};

/**
 * Internal: Reject leave request - updates status, deletes leave slots
 */
const _rejectLeaveRequest = async ({ requestId, teacherRemark, teacherId }) => {
  if (!teacherRemark || teacherRemark.trim().length === 0) {
    return { status: 400, success: false, message: 'Teacher remark is required when rejecting' };
  }

  const request = await leaveService.findLeaveByIdAndTeacher(requestId, teacherId);

  if (!request) {
    return { status: 404, success: false, message: 'Leave request not found' };
  }

  if (request.status !== 'pending') {
    return { status: 400, success: false, message: 'Can only reject pending requests' };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  request.status = 'rejected';
  request.rejectedAt = now;
  request.rejectExpiresAt = expiresAt;
  request.teacherRemark = teacherRemark;
  request.respondedBy = teacherId;
  await leaveService.saveLeaveRequest(request);

  await leaveService.deleteLeaveSlots(requestId);

  return { status: 200, success: true, message: 'Leave request rejected successfully', data: request };
};

// ========================
// HELPER OPERATIONS
// ========================

/**
 * Check if student has leave for a slot
 */
const checkLeaveForSlot = async ({ studentId, attendanceSlotId }) => {
  if (!studentId || !attendanceSlotId) {
    return { status: 400, success: false, message: 'Student ID and Attendance Slot ID are required' };
  }

  const hasLeave = await leaveService.hasLeaveForSlot(studentId, attendanceSlotId);

  if (hasLeave) {
    return {
      status: 200,
      success: true,
      hasLeave: true,
      message: 'You have applied leave for this time. Please ask your teacher to approve/reject it or you can delete the request'
    };
  }

  return { status: 200, success: true, hasLeave: false };
};

/**
 * Get leave details for attendance (for modal)
 */
const getLeaveDetailsForAttendance = async (leaveRequestId) => {
  const request = await leaveService.findLeaveByIdPopulated(leaveRequestId);

  if (!request) {
    return { status: 404, success: false, message: 'Leave request not found' };
  }

  return {
    status: 200,
    success: true,
    data: {
      leaveType: request.leaveType,
      fromDate: request.fromDate,
      toDate: request.toDate,
      reason: request.reason,
      approvedBy: request.respondedBy,
      approvedAt: request.approvedAt,
      student: request.studentId,
      lecture: request.lectureId
    }
  };
};

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
