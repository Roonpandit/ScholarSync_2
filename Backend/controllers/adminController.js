const asyncHandler = require('express-async-handler');
const User = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const AllowedIP = require('../models/AllowedIP');
const IPSettings = require('../models/IPSettings');
const mongoose = require('mongoose');
const { sendWelcomeEmail } = require('../services/welcomeEmailService');
const { checkEmailExists } = require('./emailController');

// Helper to compare dates
const isDateBefore = (date1, date2) => {
  return new Date(date1) < new Date(date2);
};

// @desc    Create attendance slot
// @route   POST /api/admin/attendance-slots
// @access  Private/Admin
exports.createAttendanceSlot = asyncHandler(async (req, res) => {
  try {
    const { shift, date, startTime, endTime } = req.body;
    const admin = req.user; // The authenticated admin user

    // Validate required fields
    if (!shift || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: shift, date, startTime, endTime'
      });
    }

    // Create the slot with the admin as createdBy
    const slot = new AttendanceSlot({
      shift,
      date,
      startTime,
      endTime,
      createdBy: admin._id
    });

    await slot.save();

    res.status(201).json({
      success: true,
      data: slot,
      message: 'Attendance slot created successfully'
    });
  } catch (error) {
    console.error('Error creating attendance slot:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating attendance slot',
      error: error.message
    });
  }
});

// @desc    Get student details with attendance history
// @route   GET /api/admin/students/:id/details
// @route   GET /api/teacher/students/:id/details
// @access  Private/Admin/Teacher
exports.getStudentDetailsWithAttendance = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month, date, startDate, endDate } = req.query;

    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }

    // Get student details with all fields and populate batches
    const student = await User.findById(id).populate('batches').lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get student's batch IDs
    const studentBatchIds = student.batches.map(b => b._id);

    // Build date filter based on query params
    let dateFilter = {};
    let filterDescription = 'All time';

    if (date) {
      const specificDate = new Date(date);
      if (isNaN(specificDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide valid date in YYYY-MM-DD format'
        });
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
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide valid dates in YYYY-MM-DD format'
        });
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
        return res.status(400).json({
          success: false,
          message: 'Invalid month or year values'
        });
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
        return res.status(400).json({
          success: false,
          message: 'Invalid year value'
        });
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

    // Get attendance records for the student within their time period and for their batches only
    const attendanceRecords = await Attendance.find({
      student: id,
      batch: { $in: studentBatchIds },
      date: dateFilter
    })
      .populate('slot', 'shift startTime endTime date')
      .populate('batch', 'name')
      .sort({ date: -1 })
      .lean();

    // Calculate attendance statistics by counting each status
    const pendingSlots = attendanceRecords.filter(r => r.status === 'pending').length;
    const awaitingSlots = attendanceRecords.filter(r => r.status === 'awaiting_approval').length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

    // totalSlots is the total attendance records for this specific student
    const totalSlots = attendanceRecords.length;

    const attendanceStats = {
      totalSlots: totalSlots,
      pendingSlots: pendingSlots,
      awaitingSlots: awaitingSlots,
      present: presentCount,
      absent: absentCount,
      attendancePercentage: totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0
    };

    // Format attendance records to include full date information
    const formattedAttendance = attendanceRecords.map(record => ({
      ...record,
      date: record.date,
      slot: {
        ...record.slot,
        date: record.slot.date
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        student,
        filter: {
          year: year || null,
          month: month || null,
          date: date || null,
          startDate: startDate || null,
          endDate: endDate || null,
          description: filterDescription
        },
        attendance: {
          records: formattedAttendance,
          stats: attendanceStats,
          totalRecords: attendanceRecords.length
        }
      }
    });
  } catch (error) {
    console.error('Error in getStudentDetailsWithAttendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Get student attendance counts with optional filters (year, month, date) - Universal for all roles
// @route   GET /api/admin/students/:id/attendance-counts
// @route   GET /api/teacher/students/:id/attendance-counts
// @route   GET /api/students/attendance-counts (for logged-in student)
// @access  Private/Admin/Teacher/Student
exports.getStudentAttendanceCounts = asyncHandler(async (req, res) => {
  try {
    // For student role, use req.user._id, for admin/teacher use params.id
    const studentId = req.user.role === 'student' ? req.user._id : req.params.id;
    const { year, month, date, startDate, endDate } = req.query;

    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }

    // Get student details with batches
    const student = await User.findById(studentId).populate('batches').lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get student's batch IDs
    const studentBatchIds = student.batches.map(b => b._id);

    // Build date filter
    let dateFilter = {};
    let filterDescription = 'All time';

    if (date) {
      // Specific date
      const specificDate = new Date(date);
      if (isNaN(specificDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide valid date in YYYY-MM-DD format'
        });
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
      // Custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide valid dates in YYYY-MM-DD format'
        });
      }

      dateFilter = {
        $gte: new Date(Math.max(start, new Date(student.createdAt))),
        $lte: end
      };
      filterDescription = `${start.toDateString()} to ${end.toDateString()}`;
    } else if (year && month) {
      // Specific month and year
      const parsedMonth = parseInt(month);
      const parsedYear = parseInt(year);

      if (isNaN(parsedMonth) || isNaN(parsedYear) ||
          parsedMonth < 1 || parsedMonth > 12 ||
          parsedYear < 2000 || parsedYear > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month or year values'
        });
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
      // Entire year
      const parsedYear = parseInt(year);

      if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year value'
        });
      }

      const startOfYear = new Date(parsedYear, 0, 1);
      const endOfYear = new Date(parsedYear, 11, 31, 23, 59, 59, 999);

      dateFilter = {
        $gte: new Date(Math.max(startOfYear, new Date(student.createdAt))),
        $lte: endOfYear
      };
      filterDescription = `Year ${parsedYear}`;
    } else {
      // No filter - all time since student joined
      dateFilter = {
        $gte: new Date(student.createdAt),
        $lte: new Date()
      };
      filterDescription = `All time since ${new Date(student.createdAt).toDateString()}`;
    }

    // Get attendance records for the student within the date range and for their batches
    const attendanceRecords = await Attendance.find({
      student: studentId,
      batch: { $in: studentBatchIds },
      date: dateFilter
    }).lean();

    // Calculate counts by status
    const pendingSlots = attendanceRecords.filter(r => r.status === 'pending').length;
    const awaitingSlots = attendanceRecords.filter(r => r.status === 'awaiting_approval').length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

    // totalSlots is the total attendance records for this specific student
    const totalSlots = attendanceRecords.length;

    const counts = {
      totalSlots: totalSlots,
      pendingSlots: pendingSlots,
      awaitingSlots: awaitingSlots,
      present: presentCount,
      absent: absentCount,
      totalRecords: attendanceRecords.length,
      attendancePercentage: totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        studentId: studentId,
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
    });
  } catch (error) {
    console.error('Error in getStudentAttendanceCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance counts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});


// @desc    Get all attendance slots
// @route   GET /api/admin/attendance-slots
// @access  Private/Admin
exports.getAllAttendanceSlots = asyncHandler(async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};
    
    // If date is provided, filter slots for that date
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide a valid date in YYYY-MM-DD format',
        });
      }
      
      query.date = {
        $gte: parsedDate,
        $lte: parsedDate
      };
    }
    
    const slots = await AttendanceSlot.find(query)
      .sort({ date: -1, startTime: 1 });
    
    // Add isExpired flag and convert times to IST for display
    const now = new Date();
    const processedSlots = slots.map(slot => {
      const slotObj = slot.toObject();
      return {
        ...slotObj,
        isExpired: isDateBefore(slotObj.endTime, now)
      };
    });
    
    res.status(200).json({
      success: true,
      count: processedSlots.length,
      data: processedSlots
    });
  } catch (error) {
    console.error('Error fetching attendance slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance slots',
      error: error.message
    });
  }
});

// @desc    Get attendance records by slot ID
// @route   GET /api/attendance?slotId=:slotId
// @access  Private/Admin
exports.getAttendanceBySlot = asyncHandler(async (req, res) => {
  try {
    const { slotId } = req.query;
    
    //console.log('Received request for slot ID:', slotId);
    
    if (!slotId) {
      console.error('No slot ID provided');
      return res.status(400).json({
        success: false,
        message: 'Slot ID is required',
      });
    }

    // Find all attendance records for this slot
    const attendanceRecords = await Attendance.find({ slot: slotId })
      .populate('student', 'name email rollNumber studentCode')
      .sort({ createdAt: -1 });
    
    // Get slot details
    const slot = await AttendanceSlot.findById(slotId);
    
    if (!slot) {
      console.error('Slot not found:', slotId);
      return res.status(404).json({
        success: false,
        message: 'Attendance slot not found',
      });
    }

    //console.log(`Found ${attendanceRecords.length} attendance records for slot:`, slotId);
    
    // Format the response
    const formattedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      student: {
        _id: record.student._id,
        name: record.student.name,
        email: record.student.email,
        rollNumber: record.student.rollNumber,
        studentCode: record.student.studentCode
      },
      status: 'present',
      markedAt: record.markedAt,
      photo: record.photo,
      location: record.location,
      shift: record.shift,
      date: record.date
    }));
    
    res.status(200).json({
      success: true,
      count: formattedRecords.length,
      data: {
        slot: {
          _id: slot._id,
          shift: slot.shift,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: slot.isActive
        },
        attendance: formattedRecords
      }
    });
  } catch (error) {
    console.error('Error fetching attendance by slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
});

// @desc    Get students by class ID
// @route   GET /api/admin/students/class?classId=:classId
// @access  Private/Admin
exports.getStudentsByClass = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.query;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
      });
    }

    // Find all students in the specified class
    const students = await User.find({ 
      class: classId,
      role: 'student'
    }).select('-password -refreshToken');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Mark attendance for a student
// @route   POST /api/admin/attendance/mark
// @access  Private/Admin
exports.markAttendance = asyncHandler(async (req, res) => {
  try {
    const { slotId, studentId, isPresent, timestamp } = req.body;

    // Validate input
    if (!slotId || !studentId || isPresent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide slotId, studentId, and isPresent',
      });
    }

    // Check if slot exists and is active
    const slot = await AttendanceSlot.findOne({
      _id: slotId,
      isActive: true
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Active attendance slot not found',
      });
    }

    const now = new Date();

    // Check if student exists
    const student = await User.findOne({
      _id: studentId,
      role: 'student'
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if attendance record already exists for this student and slot
    let attendance = await Attendance.findOne({
      student: studentId,
      slot: slotId
    });

    if (attendance) {
      // Update existing attendance
      attendance = await Attendance.findByIdAndUpdate(
        attendance._id,
        { $set: attendanceData },
        { new: true, runValidators: true }
      );
    } else {
      // Create new attendance record
      attendance = new Attendance(attendanceData);
      await attendance.save();
    }

    // Populate student data in the response
    attendance = await attendance.populate('student', 'name rollNumber email');

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully',
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Get all students by class ID
// @route   GET /api/admin/students?classId=:classId
// @access  Private/Admin
exports.getStudentsByClass = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.query;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
      });
    }

    const students = await User.find({ class: classId, role: 'student' })
      .select('-password -refreshToken')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Get attendance records by slot ID
// @route   GET /api/admin/attendance?slotId=:slotId
// @access  Private/Admin
exports.getAttendanceBySlot = asyncHandler(async (req, res) => {
  try {
    const { slotId } = req.query;
    
    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: 'Slot ID is required',
      });
    }

    // Check if slot exists
    const slot = await AttendanceSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Attendance slot not found',
      });
    }

    const attendanceRecords = await Attendance.find({ slot: slotId })
      .populate('student', 'name rollNumber email')
      .select('-__v');

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error) {
    console.error('Error fetching attendance by slot:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @desc    Delete attendance slot
// @route   DELETE /api/admin/attendance-slots/:id
// @access  Private/Admin
exports.deleteAttendanceSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid attendance slot ID',
    });
  }

  try {
    const slot = await AttendanceSlot.findById(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Attendance slot not found',
      });
    }

    // Delete associated attendance records
    await Attendance.deleteMany({ slot: id });

    // Delete the slot
    await slot.remove();

    res.status(200).json({
      success: true,
      message: 'Attendance slot and associated records deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attendance slot:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Update student details
// @route   PUT /api/admin/students/:id
// @access  Private/Admin/Teacher
exports.updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, studentCode, phone, batches } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid student ID',
    });
  }

  // Role-based field restrictions
  const isAdmin = req.user.role === 'admin';
  const isTeacher = req.user.role === 'teacher';

  // Teachers can only update name and phone
  if (isTeacher && (email || studentCode || batches)) {
    return res.status(403).json({
      success: false,
      message: 'Teachers can only update student name and phone number'
    });
  }

  // Validate request body - at least one field must be provided
  const updateFields = { name, email, studentCode, phone, batches };
  const fieldsToUpdate = Object.keys(updateFields).filter(field => updateFields[field] !== undefined);

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one field to update',
    });
  }

  // Validate phone number if provided
  if (phone && !/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit phone number'
    });
  }

  try {
    // Check if student exists
    const student = await User.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Prepare update object with only the fields that need to be updated
    const updateObject = {};

    if (name) updateObject.name = name;

    // Check if email is being updated (Admin only)
    if (isAdmin && email && email !== student.email) {
      // Check if email exists in any user collection (student, teacher, or admin)
      const { exists: emailExists, userType } = await checkEmailExists(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please use a different email.',
        });
      }
      updateObject.email = email;
    }

    // Check if studentCode is being updated (Admin only)
    if (isAdmin && studentCode && studentCode !== student.studentCode) {
      // Check if studentCode is already used by another student
      const existingStudent = await User.findOne({ studentCode });
      if (existingStudent && existingStudent._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'Student code is already in use by another student',
        });
      }
      updateObject.studentCode = studentCode;
    }

    if (phone) updateObject.phone = phone;

    // Handle batch updates (Admin only)
    if (isAdmin && batches !== undefined) {
      const Batch = require('../models/Batch');

      // Validate batches array
      if (!Array.isArray(batches) || batches.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one batch for the student'
        });
      }

      // Get the default batch
      const defaultBatch = await Batch.findOne({ isDefault: true });

      if (!defaultBatch) {
        return res.status(500).json({
          success: false,
          message: 'Default batch not found'
        });
      }

      // Ensure default batch is included
      const batchIds = [...new Set(batches)]; // Remove duplicates
      if (!batchIds.includes(defaultBatch._id.toString())) {
        batchIds.unshift(defaultBatch._id.toString());
      }

      // Validate minimum 2 batches
      if (batchIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Please select at least one batch in addition to the default batch'
        });
      }

      // Validate all batch IDs exist
      const validBatches = await Batch.find({ _id: { $in: batchIds }, isActive: true });
      if (validBatches.length !== batchIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid batch IDs provided'
        });
      }

      updateObject.batches = batchIds;
    }

    // Update student details
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      updateObject,
      { new: true, runValidators: true }
    ).populate('batches', 'name batchId isDefault');

    res.status(200).json({
      success: true,
      data: updatedStudent,
    });
  } catch (error) {
    console.error('Error updating student:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// @desc    Add batches to student (Teachers can only add, not remove)
// @route   POST /api/admin/students/:id/add-batches
// @access  Private/Admin/Teacher
exports.addBatchesToStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { batches } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid student ID',
    });
  }

  // Validate batches array
  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one batch to add'
    });
  }

  try {
    // Check if student exists
    const student = await User.findById(id).populate('batches');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const Batch = require('../models/Batch');

    // Get default batch
    const defaultBatch = await Batch.findOne({ isDefault: true });

    // If teacher, validate they can only add batches they're assigned to
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user._id).select('batches');

      if (!teacher || !teacher.batches || teacher.batches.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No batches assigned to you. Please contact admin.'
        });
      }

      // Convert teacher batches to strings
      const teacherBatchIds = teacher.batches.map(id => id.toString());

      // Check if teacher is trying to add batches they don't have
      const unauthorizedBatches = batches.filter(batchId =>
        batchId !== defaultBatch._id.toString() && !teacherBatchIds.includes(batchId)
      );

      if (unauthorizedBatches.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only add batches that are assigned to you'
        });
      }
    }

    // Validate all batch IDs exist
    const validBatches = await Batch.find({ _id: { $in: batches }, isActive: true });
    if (validBatches.length !== batches.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid batch IDs provided'
      });
    }

    // Get current student batches as strings
    const currentBatchIds = student.batches.map(b => b._id.toString());

    // Add new batches (only those not already present)
    const newBatchIds = batches.filter(batchId => !currentBatchIds.includes(batchId));

    if (newBatchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All provided batches are already assigned to this student'
      });
    }

    // Combine current and new batches
    const updatedBatchIds = [...currentBatchIds, ...newBatchIds];

    // Update student with new batches
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      { batches: updatedBatchIds },
      { new: true, runValidators: true }
    ).populate('batches', 'name batchId isDefault');

    res.status(200).json({
      success: true,
      message: `${newBatchIds.length} batch(es) added successfully`,
      data: updatedStudent,
    });
  } catch (error) {
    console.error('Error adding batches to student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @desc    Get attendance details for a specific student
// @route   GET /api/admin/attendance/details
// @access  Private/Admin
exports.getAttendanceDetails = asyncHandler(async (req, res) => {
  try {
    const { studentId, month, year } = req.query;

    //console.log('Fetching attendance details for:', { studentId, month, year });

    if (!studentId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, month, and year',
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Please provide a month between 1 and 12',
      });
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const attendanceRecords = await Attendance.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: {
            $gte: new Date(Math.max(startDate, new Date(student.createdAt))),
            $lte: endDate,
          },
        },
      },
      {
        $lookup: {
          from: 'attendanceslots',
          let: { slotId: '$slot' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$slotId'] },
                status: { $in: ['active', 'closed'] },
              },
            },
          ],
          as: 'slotDetails',
        },
      },
      { $unwind: '$slotDetails' },
      {
        $project: {
          _id: 1,
          date: 1,
          status: 1,
          slotStatus: '$slotDetails.status',
          shift: '$slotDetails.shift',
          startTime: '$slotDetails.startTime',
          endTime: '$slotDetails.endTime',
          createdAt: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    //console.log("Attendance Records Length:", attendanceRecords.length);
    //console.log("Attendance Records:", attendanceRecords);

    // Calculate counts
    let present = 0;
    let absent = 0;

    attendanceRecords.forEach((record) => {
      if (record.status === 'present' && ['active', 'closed'].includes(record.slotStatus)) {
        present++;
      } else if (record.status === 'absent' && record.slotStatus === 'closed') {
        absent++;
      }
    });

    //console.log("Present Count:", present);
    //console.log("Absent Count:", absent);

    res.status(200).json({
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
    });
  } catch (error) {
    console.error('Error in getAttendanceDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});





// @desc    Create a new student
// @route   POST /api/admin/students
// @access  Private/Admin
exports.createStudent = asyncHandler(async (req, res) => {
  const { name, email, studentCode, password, phone, batches } = req.body;

  // Validation
  if (!name || !email || !studentCode || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Validate batches array
  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please select at least one batch for the student'
    });
  }

  // Get the default batch
  const Batch = require('../models/Batch');
  const defaultBatch = await Batch.findOne({ isDefault: true });

  if (!defaultBatch) {
    return res.status(500).json({
      success: false,
      message: 'Default batch not found. Please create a batch first.'
    });
  }

  // Ensure default batch is included in the batches array
  const batchIds = [...new Set(batches)]; // Remove duplicates
  if (!batchIds.includes(defaultBatch._id.toString())) {
    batchIds.unshift(defaultBatch._id.toString()); // Add default batch at the beginning
  }

  // Validate that at least one batch other than default is selected
  if (batchIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Please select at least one batch in addition to the default batch'
    });
  }

  // Validate all batch IDs exist
  const validBatches = await Batch.find({ _id: { $in: batchIds }, isActive: true });
  if (validBatches.length !== batchIds.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more invalid batch IDs provided'
    });
  }

  // If teacher, validate they can only create students in their assigned batches
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findById(req.user._id).select('batches');

    if (!teacher || !teacher.batches || teacher.batches.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No batches assigned to you. Please contact admin.'
      });
    }

    // Convert teacher batches to strings for comparison
    const teacherBatchIds = teacher.batches.map(id => id.toString());

    // Check if all requested batches (excluding default) are in teacher's assigned batches
    const unauthorizedBatches = batchIds.filter(batchId =>
      batchId !== defaultBatch._id.toString() && !teacherBatchIds.includes(batchId)
    );

    if (unauthorizedBatches.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign students to batches assigned to you'
      });
    }
  }

  // Validate phone number if provided
  if (phone && !/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit phone number'
    });
  }

  // Check if student code already exists
  const existingStudentCode = await User.findOne({ studentCode });
  if (existingStudentCode) {
    return res.status(400).json({
      success: false,
      message: 'Student with this student code already exists',
    });
  }

  // Check if email exists in any user collection (student, teacher, or admin)
  const { exists: emailExists, userType } = await checkEmailExists(email);
  if (emailExists) {
    return res.status(400).json({
      success: false,
      message: `This email is already registered. Please use a different email.`,
    });
  }

  try {
    // Create student with batches
    const student = await User.create({
      name,
      email,
      studentCode,
      password,
      phone,
      batches: batchIds,
      role: 'student',
    });

    // Send welcome email
    try {
      await sendWelcomeEmail({
        name: student.name,
        email: student.email,
        studentCode: student.studentCode,
        phone: student.phone,
        role: 'student'
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentCode: student.studentCode,
        role: student.role,
      },
    });
  } catch (error) {
    console.error('Error creating student:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating student'
    });
  }
});

// @desc    Create multiple students at once
// @route   POST /api/admin/students/bulk
// @access  Private/Admin
exports.createStudentsBulk = asyncHandler(async (req, res) => {
  const studentsData = req.body;

  // Validate input
  if (!Array.isArray(studentsData) || studentsData.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of student data',
    });
  }

  // Get the default batch
  const Batch = require('../models/Batch');
  const defaultBatch = await Batch.findOne({ isDefault: true });

  if (!defaultBatch) {
    return res.status(500).json({
      success: false,
      message: 'Default batch not found. Please create a batch first.'
    });
  }

  // Validate each student's data
  const validationErrors = studentsData.map((student, index) => {
    if (!student.name || !student.email || !student.studentCode || !student.password) {
      return `Student ${index + 1}: Missing required fields`;
    }
    if (student.phone && !/^[\d]{10}$/.test(student.phone)) {
      return `Student ${index + 1}: Invalid phone number`;
    }
    if (!student.batches || !Array.isArray(student.batches) || student.batches.length === 0) {
      return `Student ${index + 1}: Please select at least one batch`;
    }
    return null;
  }).filter(error => error !== null);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: validationErrors
    });
  }

  // Separate existing and new students
  const existingStudents = await User.find({
    $or: [
      { email: { $in: studentsData.map(s => s.email) } },
      { studentCode: { $in: studentsData.map(s => s.studentCode) } }
    ]
  });

  const existingStudentIds = new Set(existingStudents.map(student => student._id.toString()));
  const existingEmails = new Set(existingStudents.map(student => student.email));
  const existingStudentCodes = new Set(existingStudents.map(student => student.studentCode));

  // Filter out students that already exist
  const studentsToCreate = studentsData.filter(student => {
    return !existingEmails.has(student.email) && !existingStudentCodes.has(student.studentCode);
  });

  // Process batches for each student
  const processedStudents = studentsToCreate.map(student => {
    const batchIds = [...new Set(student.batches)]; // Remove duplicates
    // Ensure default batch is included
    if (!batchIds.includes(defaultBatch._id.toString())) {
      batchIds.unshift(defaultBatch._id.toString());
    }

    return {
      ...student,
      batches: batchIds,
      role: 'student'
    };
  });

  // Create students in bulk
  const createdStudents = await User.insertMany(
    processedStudents,
    { ordered: false } // Continue on error
  ).catch(err => {
    console.error('Error creating students:', err);
    throw err;
  });

  // Send welcome emails only to newly created students
  const emailResults = [];
  
  for (const student of createdStudents) {
    try {
      await sendWelcomeEmail({
        name: student.name,
        email: student.email,
        studentCode: student.studentCode
      });
      emailResults.push({
        email: student.email,
        status: 'success'
      });
    } catch (error) {
      console.error(`Failed to send email to ${student.email}:`, error);
      emailResults.push({
        email: student.email,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Log email sending results
  //console.log('Email sending results:', emailResults);

  // Prepare response data
  const createdStudentEmails = createdStudents.map(student => student.email);
  const existingStudentEmails = studentsData
    .filter(student => !createdStudentEmails.includes(student.email))
    .map(student => student.email);

  const message = existingStudentEmails.length > 0
    ? `${createdStudents.length} students created successfully, ${existingStudentEmails.length} students could not be created as they already exist`
    : `${createdStudents.length} students created successfully and Welcame email also sent to all students`;

  res.status(201).json({
    success: true,
    message,
    emailResults,
    existing: {
      count: existingStudentEmails.length,
      emails: existingStudentEmails
    },
    created: {
      count: createdStudents.length,
      emails: createdStudentEmails
    },
    data: createdStudents.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      studentCode: student.studentCode,
      role: student.role,
    }))
  });
});

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
exports.getAllStudents = asyncHandler(async (req, res) => {
  let students;

  if (req.user.role === 'teacher') {
    // Teachers can only see students from their assigned batches
    const teacher = await Teacher.findById(req.user._id).select('batches');

    if (!teacher || !teacher.batches || teacher.batches.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No batches assigned to this teacher'
      });
    }

    // Find students who belong to at least one of the teacher's batches
    students = await User.find({
      role: 'student',
      batches: { $in: teacher.batches }
    }).select('-password');
  } else {
    // Admins can see all students
    students = await User.find({ role: 'student' }).select('-password');
  }

  res.status(200).json({
    success: true,
    count: students.length,
    data: students,
  });
});

// @desc    Create attendance slot(s) for selected batches
// @route   POST /api/admin/attendance-slots
// @access  Private/Admin/Teacher
exports.createAttendanceSlot = asyncHandler(async (req, res) => {
  const { shift, date, startTime, endTime, batches } = req.body;

  // Validation
  if (!shift || !date || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Validate batches
  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please select at least one batch'
    });
  }

  // Parse the UTC timestamps
  const slotDate = new Date(date);
  const slotStartTime = new Date(startTime);
  const slotEndTime = new Date(endTime);

  // Validate the dates
  if (isNaN(slotDate.getTime()) || isNaN(slotStartTime.getTime()) || isNaN(slotEndTime.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Please provide valid UTC timestamps'
    });
  }

  // Get the Batch model
  const Batch = require('../models/Batch');

  // Get the default batch
  const defaultBatch = await Batch.findOne({ isDefault: true });

  if (!defaultBatch) {
    return res.status(500).json({
      success: false,
      message: 'Default batch not found'
    });
  }

  // Check if user is teacher and trying to create slot for default batch
  if (req.user.role === 'teacher' && batches.includes(defaultBatch._id.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Teachers cannot create attendance slots for the default batch. Only admins can do that.'
    });
  }

  // If teacher, validate they can only create slots for their assigned batches
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findById(req.user._id).select('batches');

    if (!teacher || !teacher.batches || teacher.batches.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No batches assigned to you. Please contact admin.'
      });
    }

    // Convert teacher batches to strings for comparison
    const teacherBatchIds = teacher.batches.map(id => id.toString());

    // Check if all requested batches are in teacher's assigned batches
    const unauthorizedBatches = batches.filter(batchId => !teacherBatchIds.includes(batchId));

    if (unauthorizedBatches.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only create attendance slots for batches assigned to you'
      });
    }
  }

  // Validate all batch IDs
  const validBatches = await Batch.find({ _id: { $in: batches }, isActive: true });

  if (validBatches.length !== batches.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more invalid batch IDs provided'
    });
  }

  const createdSlots = [];
  const errors = [];

  // Create a slot for each batch
  for (const batchId of batches) {
    try {
      // Check if slot already exists for this batch, date, and shift
      const existingSlot = await AttendanceSlot.findOne({
        date: slotDate,
        shift,
        batch: batchId
      });

      if (existingSlot) {
        errors.push({
          batchId,
          message: `Attendance slot for ${shift} shift on this date already exists for this batch`
        });
        continue;
      }

      // Create attendance slot
      const attendanceSlot = await AttendanceSlot.create({
        shift,
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
        batch: batchId,
        isActive: true,
        createdBy: req.user._id,
      });

      // Get all students in this batch
      const studentsInBatch = await User.find({ batches: batchId, role: 'student' });

      // Create pending attendance records for all students
      const pendingAttendance = studentsInBatch.map(student => ({
        student: student._id,
        slot: attendanceSlot._id,
        batch: batchId,
        date: slotDate,
        shift,
        status: 'pending',
        studentCode: student.studentCode,
        studentName: student.name,
        studentEmail: student.email
      }));

      // Insert all pending attendance records
      if (pendingAttendance.length > 0) {
        await Attendance.insertMany(pendingAttendance, { ordered: false });
      }

      createdSlots.push({
        slot: attendanceSlot,
        studentsCount: studentsInBatch.length
      });
    } catch (error) {
      console.error(`Error creating slot for batch ${batchId}:`, error);
      errors.push({
        batchId,
        message: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${createdSlots.length} attendance slot(s) created successfully`,
    data: createdSlots,
    errors: errors.length > 0 ? errors : undefined
  });
});

// @desc    Get all attendance slots
// @route   GET /api/admin/attendance-slots
// @access  Private/Admin
exports.getAllAttendanceSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const now = new Date();

  let query = {};

  if (date) {
    try {
      const queryDate = new Date(date);
      if (isNaN(queryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      queryDate.setHours(0, 0, 0, 0);
      query.date = queryDate;
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
  } else {
    // If no date provided, get all slots
    query = {};
  }

  // Filter slots by teacher's assigned batches
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findById(req.user._id).select('batches');

    if (!teacher || !teacher.batches || teacher.batches.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No batches assigned to this teacher'
      });
    }

    // Add batch filter to query
    query.batch = { $in: teacher.batches };
  }

  // Find all slots that match the query
  const attendanceSlots = await AttendanceSlot.find(query)
    .sort({ date: -1, shift: 1 })
    .populate('createdBy', 'name email');

  // Check for and close expired slots
  const updatePromises = [];
  const updatedSlots = [];

  for (const slot of attendanceSlots) {
    const slotEndTime = new Date(slot.endTime);
    
    // If slot has ended and is still active, close it
    if (slot.isActive && slotEndTime < now) {
      slot.isActive = false;
      updatePromises.push(slot.save());
    }
    
    updatedSlots.push(slot);
  }

  // Wait for all updates to complete
  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }

  res.status(200).json({
    success: true,
    count: updatedSlots.length,
    data: updatedSlots,
  });
});

// @desc    Close attendance slot
// @route   PUT /api/admin/attendance-slots/:id/close
// @access  Private/Admin
exports.closeAttendanceSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const slot = await AttendanceSlot.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Attendance slot not found'
      });
    }

    slot.isClosed = true;
    await slot.save();

    res.status(200).json({
      success: true,
      message: 'Attendance slot closed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error closing attendance slot',
      error: error.message
    });
  }
});

const cloudinary = require('../config/cloudinary');

// @desc    Delete an attendance slot and its associated records
// @route   DELETE /api/admin/attendance-slots/:id
// @access  Private/Admin
exports.deleteAttendanceSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // First check if slot exists
    const slot = await AttendanceSlot.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Attendance slot not found'
      });
    }

    // Get all attendance records for this slot
    const attendanceRecords = await Attendance.find({ slot: slot._id });

    // Delete photos from Cloudinary
    const photoDeletePromises = attendanceRecords.map(record => {
      if (record.photo && record.photo.public_id) {
        return cloudinary.uploader.destroy(record.photo.public_id);
      }
      return Promise.resolve();
    });

    // Wait for all photo deletions to complete
    await Promise.all(photoDeletePromises);

    // Delete all attendance records associated with this slot
    await Attendance.deleteMany({ slot: slot._id });

    // Delete the slot itself
    await AttendanceSlot.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Attendance slot and associated records deleted successfully. Photos removed from Cloudinary.'
    });
  } catch (error) {
    console.error('Error in deleteAttendanceSlot:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance slot',
      error: error.message
    });
  }
});

// @desc    Get attendance by date
// @route   GET /api/admin/attendance
// @access  Private/Admin
exports.getAttendanceByDate = asyncHandler(async (req, res) => {
  const { date, shift } = req.query;
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a date',
    });
  }

  // Parse the date and validate it
  const queryDate = new Date(date);
  if (isNaN(queryDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Please provide a valid date in YYYY-MM-DD format',
    });
  }
  
  // Ensure the date is set to the start of the day in the local timezone
  const localDate = new Date(queryDate);
  localDate.setHours(0, 0, 0, 0);
  
  let query = { date: localDate };
  
  if (shift) {
    query.shift = shift;
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'name email studentCode')
    .populate('slot', 'shift startTime endTime');

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance,
  });
});

// @desc    Get attendance statistics
// @route   GET /api/admin/attendance/stats
// @access  Private/Admin
exports.getAttendanceStats = asyncHandler(async (req, res) => {
  try {
    //console.log('Fetching attendance stats for:', req.query);

    const { month, year, minAbsences, startDate: startDateParam, endDate: endDateParam } = req.query;

    let dateFilter = {};
    let startDate, endDate;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide valid dates in YYYY-MM-DD format'
        });
      }

      dateFilter.date = { $gte: startDate, $lte: endDate };
    } else if (month && year) {
      const parsedMonth = parseInt(month);
      const parsedYear = parseInt(year);

      if (isNaN(parsedMonth) || isNaN(parsedYear) ||
        parsedMonth < 1 || parsedMonth > 12 ||
        parsedYear < 2000 || parsedYear > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month or year values'
        });
      }

      startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
      endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));

      dateFilter.date = { $gte: startDate, $lte: endDate };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either month+year or startDate+endDate parameters are required'
      });
    }

    const parsedMinAbsences = parseInt(minAbsences) || 0;

    //console.log('Using date range:', startDate.toISOString(), 'to', endDate.toISOString());

    // Get all students with their batches
    const allStudents = await User.find({ role: 'student' }).populate('batches').select('_id name email studentCode createdAt batches');

    // Get slots within date range and only 'active' or 'closed'
    const slots = await AttendanceSlot.find({
      ...dateFilter,
      status: { $in: ['active', 'closed'] }
    });

    //console.log(`Found ${slots.length} attendance slots (active/closed)`);

    // Get attendance records in range
    const attendanceRecords = await Attendance.find(dateFilter)
      .populate('student', 'name email studentCode');

    //console.log(`Found ${attendanceRecords.length} attendance records`);

    const studentAttendance = new Map();

    // Initialize with student info
    allStudents.forEach(student => {
      const studentJoinDate = new Date(student.createdAt);
      const studentBatchIds = student.batches.map(b => b._id.toString());

      studentAttendance.set(student._id.toString(), {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentCode: student.studentCode
        },
        joinDate: studentJoinDate,
        batchIds: studentBatchIds,
        present: 0,
        absent: 0,
        attendanceDates: [],
        absentDates: []
      });
    });

    // Mark present days
    attendanceRecords.forEach(record => {
      const studentId = record.student._id.toString();
      if (studentAttendance.has(studentId)) {
        const data = studentAttendance.get(studentId);
        data.present += 1;
        data.attendanceDates.push({
          date: record.date,
          slot: record.slot
        });
        studentAttendance.set(studentId, data);
      }
    });

    // Now calculate absents per student
    studentAttendance.forEach((data, studentId) => {
      const studentJoinDate = data.joinDate;
      const studentBatchIds = data.batchIds;

      // Only count slots for batches this student is enrolled in
      const totalAvailableSlots = slots.filter(slot => {
        const slotDate = new Date(slot.date);
        const slotBatchId = slot.batch.toString();
        return slotDate >= studentJoinDate && studentBatchIds.includes(slotBatchId); // Skip slots before student joined AND slots for batches they're not in
      });

      const totalSlotsCount = totalAvailableSlots.length;

      const presentCount = attendanceRecords.filter(record =>
        record.student._id.toString() === studentId &&
        new Date(record.date) >= studentJoinDate
      ).length;

      data.present = presentCount;
      data.absent = totalSlotsCount - presentCount;

      // Optional: collect absentDates if needed
      const presentDates = new Set(
        attendanceRecords
          .filter(r => r.student._id.toString() === studentId)
          .map(r => new Date(r.date).toISOString())
      );

      data.absentDates = totalAvailableSlots
        .map(slot => new Date(slot.date).toISOString())
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

    res.status(200).json({
      success: true,
      data: {
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
});


// @desc    Register a new teacher (Admin only)
// @route   POST /api/admin/teachers
// @access  Private/Admin
exports.registerTeacher = asyncHandler(async (req, res) => {
  const { name, email, teacherCode, phone, password, batches } = req.body;

  // Check if teacher code already exists
  const existingTeacherCode = await Teacher.findOne({ teacherCode });
  if (existingTeacherCode) {
    return res.status(400).json({
      success: false,
      message: 'Teacher with this teacher code already exists',
    });
  }

  // Check if email exists in any user collection (student, teacher, or admin)
  const { exists: emailExists, userType } = await checkEmailExists(email);
  if (emailExists) {
    return res.status(400).json({
      success: false,
      message: `This email is already registered. Please use a different email.`,
    });
  }

  // Validate batches - minimum 1 batch required
  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please assign at least one batch to the teacher'
    });
  }

  const Batch = require('../models/Batch');

  // Get default batch
  const defaultBatch = await Batch.findOne({ isDefault: true });

  // Check if default batch is being assigned (should not be allowed for teachers)
  if (defaultBatch && batches.includes(defaultBatch._id.toString())) {
    return res.status(400).json({
      success: false,
      message: 'Default batch cannot be assigned to teachers'
    });
  }

  // Validate all batch IDs exist
  const validBatches = await Batch.find({ _id: { $in: batches }, isActive: true });
  if (validBatches.length !== batches.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more invalid batch IDs provided'
    });
  }

  try {
    // Create teacher
    const teacher = await Teacher.create({
      name,
      email,
      teacherCode,
      phone,
      password,
      batches,
      role: 'teacher',
    });

    // Send welcome email
    try {
      await sendWelcomeEmail({
        name: teacher.name,
        email: teacher.email,
        teacherCode: teacher.teacherCode,
        phone: teacher.phone,
        role: 'teacher',
      }, 'teacher');
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail the request if email fails
    }

    // Remove password from output
    teacher.password = undefined;

    res.status(201).json({
      success: true,
      data: teacher,
      message: 'Teacher registered successfully',
    });
  } catch (error) {
    console.error('Error creating teacher:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating teacher'
    });
  }
});

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private/Admin
exports.getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().select('-password').populate('batches', 'name batchId isDefault');

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Get single teacher
// @route   GET /api/admin/teachers/:id
// @access  Private/Admin
exports.getTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).select('-password').populate('batches', 'name batchId isDefault');

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  res.status(200).json({
    success: true,
    data: teacher,
  });
});

// @desc    Update teacher
// @route   PUT /api/admin/teachers/:id
// @access  Private/Admin
exports.updateTeacher = asyncHandler(async (req, res) => {
  const { name, email, teacherCode, phone, batches } = req.body;

  let teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  // Check if email is being updated
  if (email && email !== teacher.email) {
    // Check if email exists in any user collection (student, teacher, or admin)
    const { exists: emailExists, userType } = await checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please use a different email.',
      });
    }
  }

  if (teacherCode && teacherCode !== teacher.teacherCode) {
    const existingTeacher = await Teacher.findOne({ teacherCode });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher code already in use',
      });
    }
  }

  // Validate batches if provided
  if (batches !== undefined) {
    // Minimum 1 batch required
    if (!Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please assign at least one batch to the teacher'
      });
    }

    const Batch = require('../models/Batch');

    // Get default batch
    const defaultBatch = await Batch.findOne({ isDefault: true });

    // Check if default batch is being assigned (should not be allowed for teachers)
    if (defaultBatch && batches.includes(defaultBatch._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Default batch cannot be assigned to teachers'
      });
    }

    // Validate all batch IDs exist
    const validBatches = await Batch.find({ _id: { $in: batches }, isActive: true });
    if (validBatches.length !== batches.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid batch IDs provided'
      });
    }

    teacher.batches = batches;
  }

  // Update fields
  teacher.name = name || teacher.name;
  teacher.email = email || teacher.email;
  teacher.teacherCode = teacherCode || teacher.teacherCode;
  teacher.phone = phone || teacher.phone;

  try {
    await teacher.save();

    // Remove password from output
    teacher.password = undefined;

    res.status(200).json({
      success: true,
      data: teacher,
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    console.error('Error updating teacher:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating teacher'
    });
  }
});

// @desc    Delete teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Private/Admin
exports.deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Validate teacher ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID',
      });
    }

    // Check if teacher exists
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Set createdBy to null for all attendance slots created by this teacher
    // This preserves the slots while removing the orphaned reference
    await AttendanceSlot.updateMany(
      { createdBy: id },
      { $set: { createdBy: null } }
    );

    // Delete the teacher
    const result = await Teacher.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully. Attendance slots created by this teacher have been preserved.'
    });
  } catch (error) {
    console.error('Error in deleteTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete a student and all their related data
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
exports.deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }

    // Get student details to retrieve their cloudinary photos
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get all attendance records for this student
    const attendanceRecords = await Attendance.find({ student: id });

    // Delete photos from Cloudinary
    const photoDeletePromises = attendanceRecords.map(record => {
      if (record.photo && record.photo.public_id) {
        return cloudinary.uploader.destroy(record.photo.public_id);
      }
      return Promise.resolve();
    });

    await Promise.all(photoDeletePromises);

    // Delete attendance records
    await Attendance.deleteMany({ student: id });

    // Delete student
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Student and all related data deleted successfully. Photos removed from Cloudinary.'
    });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});
// @desc    Get students with absent count greater than threshold
// @route   GET /api/admin/attendance/absent
// @access  Private/Admin
exports.getAbsentStudents = asyncHandler(async (req, res) => {
  const { threshold = 0, month, year } = req.query;
  
  let dateFilter = {};

  // Apply date filters if provided
  if (month && year) {
    try {
      const parsedMonth = parseInt(month);
      const parsedYear = parseInt(year);
      
      // Validate month and year
      if (isNaN(parsedMonth) || isNaN(parsedYear) || 
          parsedMonth < 1 || parsedMonth > 12 || 
          parsedYear < 2000 || parsedYear > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month or year values'
        });
      }

      const startOfMonth = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
      const endOfMonth = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));

      dateFilter = {
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
  } else {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    dateFilter = {
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    };
  }
  
  try {
    const allStudents = await User.find({ role: 'student' }).populate('batches').select('_id name email studentCode createdAt batches');

    const absenteeMap = {};

    allStudents.forEach(student => {
      const studentJoinDate = student.createdAt ? new Date(student.createdAt) : null;
      const studentBatchIds = student.batches.map(b => b._id.toString());

      absenteeMap[student._id] = {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentCode: student.studentCode
        },
        joinDate: studentJoinDate,
        batchIds: studentBatchIds,
        absentCount: 0,
        absentDates: []
      };
    });

    // ✅ Only get slots with "active" or "closed" status
    const slots = await AttendanceSlot.find({
      ...dateFilter,
      status: { $in: ['active', 'closed'] }
    });

    const attendanceRecords = await Attendance.find(dateFilter);

    // Calculate absences
    slots.forEach(slot => {
      const slotDate = slot.date.toISOString().split('T')[0];
      const slotShift = slot.shift;
      const slotDateObj = new Date(slot.date);
      const slotBatchId = slot.batch.toString();

      allStudents.forEach(student => {
        const studentId = student._id.toString();
        const studentJoinDate = student.createdAt ? new Date(student.createdAt) : new Date(0);
        const studentBatchIds = absenteeMap[studentId].batchIds;

        // ✅ Ignore slots before student joined AND slots for batches they're not enrolled in
        if (slotDateObj >= studentJoinDate && studentBatchIds.includes(slotBatchId)) {
          const isPresent = attendanceRecords.some(record =>
            record.student.toString() === studentId &&
            record.date.toISOString().split('T')[0] === slotDate &&
            record.shift === slotShift
          );

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

    res.status(200).json({
      success: true,
      count: absentees.length,
      data: absentees,
    });
  } catch (error) {
    console.error('Error in getAbsentStudents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching absent students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ========== IP MANAGEMENT ==========

// @desc    Add IP to allowed list
// @route   POST /api/admin/add-ip
// @access  Private/Admin
exports.addIP = asyncHandler(async (req, res) => {
  try {
    const { ipAddress, locationName, description } = req.body;

    // Validate required fields
    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an IP address',
      });
    }

    if (!locationName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a location name',
      });
    }

    // Validate location name minimum length
    if (locationName.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Location name must be at least 10 characters long',
      });
    }

    // Check if IP already exists
    const existingIP = await AllowedIP.findOne({ ipAddress });
    if (existingIP) {
      return res.status(400).json({
        success: false,
        message: 'This IP address is already in the allowed list',
      });
    }

    // Create new allowed IP
    const allowedIP = await AllowedIP.create({
      ipAddress,
      locationName,
      description: description || '',
      addedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'IP address added successfully',
      data: allowedIP
    });
  } catch (error) {
    console.error('Error adding IP address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding IP address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Delete IP from allowed list
// @route   DELETE /api/admin/delete-ip/:id
// @access  Private/Admin
exports.deleteIP = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP ID',
      });
    }

    // Find and delete IP
    const allowedIP = await AllowedIP.findByIdAndDelete(id);

    if (!allowedIP) {
      return res.status(404).json({
        success: false,
        message: 'IP address not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'IP address deleted successfully',
      data: allowedIP
    });
  } catch (error) {
    console.error('Error deleting IP address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting IP address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Get all allowed IPs
// @route   GET /api/admin/allowed-ips
// @access  Private/Admin
exports.getAllowedIPs = asyncHandler(async (req, res) => {
  try {
    const allowedIPs = await AllowedIP.find()
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: allowedIPs.length,
      data: allowedIPs
    });
  } catch (error) {
    console.error('Error fetching allowed IPs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching allowed IPs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Toggle IP restriction on/off
// @route   POST /api/admin/toggle-ip-restriction
// @access  Private/Admin
exports.toggleIPRestriction = asyncHandler(async (req, res) => {
  try {
    const { isEnabled } = req.body;

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid boolean value for isEnabled',
      });
    }

    // Find or create IP settings (only one document should exist)
    let settings = await IPSettings.findOne();

    if (!settings) {
      // Create new settings document
      settings = await IPSettings.create({
        isEnabled,
        updatedBy: req.user._id
      });
    } else {
      // Update existing settings
      settings.isEnabled = isEnabled;
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: `IP restrictions ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: settings
    });
  } catch (error) {
    console.error('Error toggling IP restriction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling IP restriction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Get IP restriction status
// @route   GET /api/admin/ip-restriction-status
// @access  Private/Admin
exports.getIPRestrictionStatus = asyncHandler(async (req, res) => {
  try {
    let settings = await IPSettings.findOne().populate('updatedBy', 'name email');

    if (!settings) {
      // Return default settings if none exist
      return res.status(200).json({
        success: true,
        data: {
          isEnabled: false,
          updatedBy: null,
          createdAt: null,
          updatedAt: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching IP restriction status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching IP restriction status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Mark student as absent (Admin/Teacher can override present to absent)
// @route   POST /api/admin/attendance/:id/mark-absent
// @access  Private/Admin
exports.markAttendanceAsAbsent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;

  // Validate remark
  if (!remark || remark.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Remark is required to mark attendance as absent'
    });
  }

  if (remark.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Remark must not exceed 1000 characters'
    });
  }

  try {
    // Find the attendance record
    const attendance = await Attendance.findById(id)
      .populate('student', 'name email studentCode')
      .populate('slot', 'shift startTime endTime')
      .populate('batch', 'name');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if already absent
    if (attendance.status === 'absent') {
      return res.status(400).json({
        success: false,
        message: 'Attendance is already marked as absent'
      });
    }

    // Check if status is present (we can only mark present as absent)
    if (attendance.status !== 'present') {
      return res.status(400).json({
        success: false,
        message: 'Only present attendance can be marked as absent'
      });
    }

    // Update attendance to absent with remark
    attendance.status = 'absent';
    attendance.statusUpdatedBy = req.user._id;
    attendance.remark = remark.trim();
    attendance.statusUpdatedAt = new Date();

    await attendance.save();

    // Send email notification to student
    const { sendAbsentNotificationEmail } = require('../services/absentNotificationService');

    const emailData = {
      studentName: attendance.student.name,
      studentEmail: attendance.student.email,
      batchName: attendance.batch.name,
      date: attendance.date,
      shift: attendance.shift,
      slotTime: `${attendance.slot.startTime.toLocaleTimeString()} - ${attendance.slot.endTime.toLocaleTimeString()}`,
      markedAt: attendance.markedAt,
      location: attendance.location?.address || 'N/A',
      photoUrl: attendance.photo?.url || null,
      remark: remark.trim(),
      updatedByName: req.user.name,
      updatedByRole: req.user.role
    };

    // Send email asynchronously (don't wait for it)
    sendAbsentNotificationEmail(emailData).catch(err => {
      console.error('Error sending absent notification email:', err);
    });

    res.status(200).json({
      success: true,
      message: 'Attendance marked as absent successfully. Notification email sent to student.',
      data: attendance
    });
  } catch (error) {
    console.error('Error marking attendance as absent:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking attendance as absent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Approve attendance (awaiting_approval -> present)
// @route   POST /api/admin/attendance/:id/approve
// @access  Private/Admin/Teacher
exports.approveAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Find attendance and populate related data
    const attendance = await Attendance.findById(id)
      .populate('student', 'name email studentCode')
      .populate('slot', 'status endTime shift')
      .populate('batch', 'name');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Validation: slot must be closed
    if (attendance.slot.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve attendance. Slot must be closed first.'
      });
    }

    // Validation: status must be awaiting_approval
    if (attendance.status !== 'awaiting_approval') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Current status is '${attendance.status}'.`
      });
    }

    // Approve
    attendance.status = 'present';
    attendance.statusUpdatedBy = req.user._id;
    attendance.statusUpdatedAt = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance approved successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error approving attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Reject attendance (awaiting_approval -> absent with remark)
// @route   POST /api/admin/attendance/:id/reject
// @access  Private/Admin/Teacher
exports.rejectAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;

  // Validate remark
  if (!remark || remark.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Remark is required to reject attendance'
    });
  }

  if (remark.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Remark must not exceed 1000 characters'
    });
  }

  try {
    // Find and validate
    const attendance = await Attendance.findById(id)
      .populate('student', 'name email studentCode')
      .populate('slot', 'status shift startTime endTime')
      .populate('batch', 'name');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check slot is closed
    if (attendance.slot.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject attendance. Slot must be closed first.'
      });
    }

    // Check status is awaiting_approval
    if (attendance.status !== 'awaiting_approval') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Current status is '${attendance.status}'.`
      });
    }

    // Reject
    attendance.status = 'absent';
    attendance.statusUpdatedBy = req.user._id;
    attendance.remark = remark.trim();
    attendance.statusUpdatedAt = new Date();
    await attendance.save();

    // Send email to student
    const { sendAbsentNotificationEmail } = require('../services/absentNotificationService');

    const emailData = {
      studentName: attendance.student.name,
      studentEmail: attendance.student.email,
      batchName: attendance.batch.name,
      date: attendance.date,
      shift: attendance.shift,
      slotTime: `${attendance.slot.startTime.toLocaleTimeString()} - ${attendance.slot.endTime.toLocaleTimeString()}`,
      markedAt: attendance.markedAt,
      location: attendance.location?.address || 'N/A',
      photoUrl: attendance.photo?.url || null,
      remark: remark.trim(),
      updatedByName: req.user.name,
      updatedByRole: req.user.role
    };

    sendAbsentNotificationEmail(emailData).catch(err =>
      console.error('Error sending rejection email:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Attendance rejected successfully. Notification email sent to student.',
      data: attendance
    });
  } catch (error) {
    console.error('Error rejecting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
