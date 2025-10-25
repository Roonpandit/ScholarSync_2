const LeaveRequest = require('../models/LeaveRequest');
const LeaveSlot = require('../models/LeaveSlot');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Lecture = require('../models/Lecture');
const mongoose = require('mongoose');

// ========================
// STUDENT CONTROLLERS
// ========================

// @desc    Apply for leave
// @route   POST /api/student/leave/apply
// @access  Private (Student)
exports.applyLeave = async (req, res) => {
  try {
    const { leaveRequests, leaveType, fromDate, toDate, reason } = req.body;

    // Validate required fields
    if (!leaveRequests || !Array.isArray(leaveRequests) || leaveRequests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one lecture-teacher pair'
      });
    }

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const studentId = req.user.id;

    // Get student details
    const student = await Student.findById(studentId).populate('lectures');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate all lecture-teacher pairs
    const studentLectureIds = student.lectures.map(l => l._id.toString());
    const createdRequests = [];

    for (const request of leaveRequests) {
      const { lectureId, teacherId } = request;

      // Check if student is enrolled in the lecture
      if (!studentLectureIds.includes(lectureId)) {
        return res.status(400).json({
          success: false,
          message: `You are not enrolled in the selected lecture`
        });
      }

      // Check if lecture is not default
      const lecture = await Lecture.findById(lectureId);
      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: 'Lecture not found'
        });
      }

      if (lecture.isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Cannot apply leave for default lecture'
        });
      }

      // Verify teacher is assigned to the lecture
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      if (!teacher.lectures.some(l => l.toString() === lectureId)) {
        return res.status(400).json({
          success: false,
          message: 'Selected teacher is not assigned to the lecture'
        });
      }

      // Check for existing overlapping leave requests for this lecture
      const existingLeave = await LeaveRequest.findOne({
        studentId,
        lectureId,
        status: { $in: ['pending', 'approved'] }, // Check pending and approved leaves
        $or: [
          {
            // New leave starts during existing leave
            fromDate: { $lte: new Date(toDate) },
            toDate: { $gte: new Date(fromDate) }
          }
        ]
      }).populate('lectureId', 'name');

      if (existingLeave) {
        const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        return res.status(400).json({
          success: false,
          message: `You already have a ${existingLeave.status} leave request for ${existingLeave.lectureId.name} from ${formatDate(existingLeave.fromDate)} to ${formatDate(existingLeave.toDate)}. Please delete or cancel it before applying for overlapping dates.`
        });
      }

      // Create leave request
      const leaveRequest = await LeaveRequest.create({
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

      // Create leave slots for blocking attendance
      await LeaveSlot.createSlotsForLeave(
        leaveRequest._id,
        studentId,
        lectureId,
        fromDate,
        toDate
      );

      createdRequests.push(leaveRequest);
    }

    res.status(201).json({
      success: true,
      message: 'Leave requests submitted successfully',
      data: createdRequests
    });

  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error applying leave'
    });
  }
};

// @desc    Get student's leave requests with filters
// @route   GET /api/student/leave/my-requests
// @access  Private (Student)
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { lecture, teacher, status, fromDate, toDate, page = 1, limit = 10 } = req.query;

    const query = { studentId };

    // Apply filters
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

    // Date range filter (on leave dates, not appliedAt)
    if (fromDate || toDate) {
      query.$or = [];

      if (fromDate && toDate) {
        // Leave overlaps with the date range
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

    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('lectureId', 'name lectureId')
        .populate('teacherId', 'name teacherCode email')
        .populate('respondedBy', 'name teacherCode')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LeaveRequest.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests'
    });
  }
};

// @desc    Get single leave request details
// @route   GET /api/student/leave/:requestId
// @access  Private (Student)
exports.getLeaveRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.user.id;

    const request = await LeaveRequest.findOne({ _id: requestId, studentId })
      .populate('lectureId', 'name lectureId')
      .populate('teacherId', 'name teacherCode email phone')
      .populate('respondedBy', 'name teacherCode');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Error fetching leave request details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave request details'
    });
  }
};

// @desc    Delete pending leave request
// @route   DELETE /api/student/leave/:requestId
// @access  Private (Student)
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.user.id;

    const request = await LeaveRequest.findOne({ _id: requestId, studentId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (!request.canDelete()) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending requests'
      });
    }

    // Delete all leave slots
    await LeaveSlot.deleteLeaveSlots(requestId);

    // Delete the request
    await LeaveRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leave request'
    });
  }
};

// @desc    Resend rejected leave request
// @route   POST /api/student/leave/:requestId/resend
// @access  Private (Student)
exports.resendLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { studentRemark } = req.body;
    const studentId = req.user.id;

    if (!studentRemark || studentRemark.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student remark is required when resending'
      });
    }

    const request = await LeaveRequest.findOne({ _id: requestId, studentId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (!request.canResend()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend this request. Either it is not rejected, already resent once, or the 48-hour window has expired'
      });
    }

    // Update the existing request instead of creating a new one
    request.status = 'pending';
    request.studentRemark = studentRemark;
    request.isResent = true;
    request.resendCount = (request.resendCount || 0) + 1;
    request.appliedAt = new Date(); // Update applied date
    // Clear rejection fields
    request.rejectedAt = undefined;
    request.rejectExpiresAt = undefined;

    await request.save();

    // Create leave slots for the resent request
    await LeaveSlot.createSlotsForLeave(
      request._id,
      studentId,
      request.lectureId,
      request.fromDate,
      request.toDate
    );

    res.status(200).json({
      success: true,
      message: 'Leave request resent successfully',
      data: request
    });

  } catch (error) {
    console.error('Error resending leave request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error resending leave request'
    });
  }
};

// @desc    Cancel approved leave request
// @route   POST /api/student/leave/:requestId/cancel
// @access  Private (Student)
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { cancelReason } = req.body;
    const studentId = req.user.id;

    if (!cancelReason || cancelReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cancel reason is required'
      });
    }

    const request = await LeaveRequest.findOne({ _id: requestId, studentId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (!request.canCancel()) {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel approved requests'
      });
    }

    // Update request status
    request.status = 'cancelled';
    request.isCancelled = true;
    request.cancelledAt = new Date();
    request.cancelReason = cancelReason;
    await request.save();

    // Cancel future leave slots (past slots remain on_leave)
    await LeaveSlot.cancelFutureSlots(requestId);

    // Update future attendance records
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    await Attendance.updateMany(
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

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: request
    });

  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling leave request'
    });
  }
};

// ========================
// TEACHER CONTROLLERS
// ========================

// @desc    Get pending leave requests for teacher
// @route   GET /api/teacher/leave/pending
// @access  Private (Teacher)
exports.getPendingLeaveRequests = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { lecture, student, page = 1, limit = 10 } = req.query;

    const query = { teacherId, status: 'pending' };

    if (lecture) {
      const lectureIds = Array.isArray(lecture) ? lecture : [lecture];
      query.lectureId = { $in: lectureIds };
    }

    if (student) {
      query.studentId = student;
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('studentId', 'name studentCode email phone')
        .populate('lectureId', 'name lectureId')
        .sort({ appliedAt: 1 }) // Oldest first
        .skip(skip)
        .limit(parseInt(limit)),
      LeaveRequest.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leave requests'
    });
  }
};

// @desc    Get all leave requests for teacher with filters
// @route   GET /api/teacher/leave/all
// @access  Private (Teacher)
exports.getAllLeaveRequestsForTeacher = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { lecture, student, status, fromDate, toDate, page = 1, limit = 10 } = req.query;

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

    // Date range filter
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

    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('studentId', 'name studentCode email phone')
        .populate('lectureId', 'name lectureId')
        .populate('respondedBy', 'name teacherCode')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LeaveRequest.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests'
    });
  }
};

// @desc    Approve leave request
// @route   POST /api/teacher/leave/:requestId/approve
// @access  Private (Teacher)
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const teacherId = req.user.id;

    const request = await LeaveRequest.findOne({ _id: requestId, teacherId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve pending requests'
      });
    }

    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date();
    request.respondedBy = teacherId;
    await request.save();

    // Update leave slots to on_leave
    await LeaveSlot.approveLeaveSlots(requestId);

    // Create or update attendance records
    const leaveSlots = await LeaveSlot.find({ leaveRequestId: requestId, status: 'on_leave' });

    for (const slot of leaveSlots) {
      // Check if attendance record exists
      const existingAttendance = await Attendance.findOne({
        student: request.studentId,
        slot: slot.attendanceSlotId
      });

      if (existingAttendance) {
        // Update existing record
        existingAttendance.status = 'on_leave';
        existingAttendance.leaveRequestId = requestId;
        await existingAttendance.save();
      } else {
        // Create new attendance record
        const student = await Student.findById(request.studentId);
        const attendanceSlot = await mongoose.model('AttendanceSlot').findById(slot.attendanceSlotId);

        if (student && attendanceSlot) {
          await Attendance.create({
            student: request.studentId,
            slot: slot.attendanceSlotId,
            lecture: request.lectureId,
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

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: request
    });

  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave request'
    });
  }
};

// @desc    Reject leave request
// @route   POST /api/teacher/leave/:requestId/reject
// @access  Private (Teacher)
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { teacherRemark } = req.body;
    const teacherId = req.user.id;

    if (!teacherRemark || teacherRemark.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Teacher remark is required when rejecting'
      });
    }

    const request = await LeaveRequest.findOne({ _id: requestId, teacherId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending requests'
      });
    }

    // Update request status
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

    request.status = 'rejected';
    request.rejectedAt = now;
    request.rejectExpiresAt = expiresAt;
    request.teacherRemark = teacherRemark;
    request.respondedBy = teacherId;
    await request.save();

    // Delete all leave slots
    await LeaveSlot.deleteLeaveSlots(requestId);

    res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: request
    });

  } catch (error) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave request'
    });
  }
};

// ========================
// ADMIN CONTROLLERS
// ========================

// @desc    Get all leave requests with filters (Admin)
// @route   GET /api/admin/leave/all
// @access  Private (Admin)
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { lecture, teacher, student, status, fromDate, toDate, page = 1, limit = 10 } = req.query;

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

    const [requests, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('studentId', 'name studentCode email')
        .populate('lectureId', 'name lectureId')
        .populate('teacherId', 'name teacherCode')
        .populate('respondedBy', 'name teacherCode')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LeaveRequest.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests'
    });
  }
};

// @desc    Get leave statistics (Admin)
// @route   GET /api/admin/leave/stats
// @access  Private (Admin)
exports.getLeaveStats = async (req, res) => {
  try {
    const stats = await LeaveRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      closed: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    // Get leave type stats
    const leaveTypeStats = await LeaveRequest.aggregate([
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = {
      sick: 0,
      other: 0
    };

    leaveTypeStats.forEach(stat => {
      typeStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        statusStats: formattedStats,
        typeStats
      }
    });

  } catch (error) {
    console.error('Error fetching leave stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave stats'
    });
  }
};

// ========================
// HELPER CONTROLLERS
// ========================

// @desc    Check if student has leave for a slot
// @route   GET /api/leave/check-slot
// @access  Private
exports.checkLeaveForSlot = async (req, res) => {
  try {
    const { studentId, attendanceSlotId } = req.query;

    if (!studentId || !attendanceSlotId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Attendance Slot ID are required'
      });
    }

    const hasLeave = await LeaveSlot.hasLeaveForSlot(studentId, attendanceSlotId);

    if (hasLeave) {
      return res.status(200).json({
        success: true,
        hasLeave: true,
        message: 'You have applied leave for this time. Please ask your teacher to approve/reject it or you can delete the request'
      });
    }

    res.status(200).json({
      success: true,
      hasLeave: false
    });

  } catch (error) {
    console.error('Error checking leave slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking leave slot'
    });
  }
};

// @desc    Get leave details for attendance (for modal)
// @route   GET /api/leave/details/:leaveRequestId
// @access  Private
exports.getLeaveDetailsForAttendance = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;

    const request = await LeaveRequest.findById(leaveRequestId)
      .populate('studentId', 'name studentCode')
      .populate('lectureId', 'name')
      .populate('respondedBy', 'name teacherCode');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.status(200).json({
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
    });

  } catch (error) {
    console.error('Error fetching leave details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave details'
    });
  }
};
