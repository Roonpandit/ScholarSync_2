const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

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
      
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    const slots = await AttendanceSlot.find(query)
      .sort({ date: -1, startTime: 1 });
    
    // Add isExpired flag and convert times to IST for display
    const now = new Date();
    const processedSlots = slots.map(slot => {
      const slotObj = slot.toObject();
      const startTimeIST = new Date(slotObj.startTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const endTimeIST = new Date(slotObj.endTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      
      return {
        ...slotObj,
        startTime: startTimeIST,
        endTime: endTimeIST,
        isExpired: new Date(slotObj.endTime) < now
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
    
    console.log('Received request for slot ID:', slotId);
    
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

    console.log(`Found ${attendanceRecords.length} attendance records for slot:`, slotId);
    
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
          startTime: new Date(slot.startTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
          endTime: new Date(slot.endTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
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

    // Get current time in IST
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

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

// @desc    Get attendance details for a specific student
// @route   GET /api/admin/attendance/details
// @access  Private/Admin
exports.getAttendanceDetails = asyncHandler(async (req, res) => {
  try {
    const { studentId, month, year } = req.query;
    
    console.log('Fetching attendance details for:', { studentId, month, year });

    // Validation
    if (!studentId || !month || !year) {
      console.error('Missing required parameters');
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, month, and year',
      });
    }

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student) {
      console.error('Student not found:', studentId);
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Parse month and year to numbers
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      console.error('Invalid month:', month);
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Please provide a month between 1 and 12',
      });
    }


    // Calculate start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    console.log('Date range:', { startDate, endDate });

    // Get attendance records for the student in the specified month
    const attendanceRecords = await Attendance.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $lookup: {
          from: 'attendanceslots',
          localField: 'slot',
          foreignField: '_id',
          as: 'slotDetails',
        },
      },
      { $unwind: '$slotDetails' },
      {
        $project: {
          _id: 1,
          date: 1,
          status: 1,
          shift: '$slotDetails.shift',
          startTime: '$slotDetails.startTime',
          endTime: '$slotDetails.endTime',
          createdAt: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    console.log('Found records:', attendanceRecords.length);

    res.status(200).json({
      success: true,
      data: attendanceRecords,
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
  const { name, email, studentCode, password } = req.body;

  // Validation
  if (!name || !email || !studentCode || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Check if student already exists
  const existingStudent = await User.findOne({
    $or: [{ email }, { studentCode }],
  });

  if (existingStudent) {
    return res.status(400).json({
      success: false,
      message: 'Student with this email or student code already exists',
    });
  }

  // Create student
  const student = await User.create({
    name,
    email,
    studentCode,
    password,
    role: 'student',
  });

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
});

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
exports.getAllStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password');

  res.status(200).json({
    success: true,
    count: students.length,
    data: students,
  });
});

// @desc    Create attendance slot
// @route   POST /api/admin/attendance-slots
// @access  Private/Admin
exports.createAttendanceSlot = asyncHandler(async (req, res) => {
  const { shift, date, startTime, endTime } = req.body;

  // Validation
  if (!shift || !date || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
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

  // Check if slot already exists for this date and shift
  const existingSlot = await AttendanceSlot.findOne({
    date: slotDate,
    shift,
  });

  if (existingSlot) {
    return res.status(400).json({
      success: false,
      message: `Attendance slot for ${shift} shift on this date already exists`,
    });
  }

  // Create attendance slot with UTC timestamps
  const attendanceSlot = await AttendanceSlot.create({
    shift,
    date: slotDate,
    startTime: slotStartTime,
    endTime: slotEndTime,
    timezone: 'Asia/Kolkata',
    isActive: true,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: attendanceSlot,
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
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    query.date = queryDate;
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

    // Delete all attendance records associated with this slot
    await Attendance.deleteMany({ slot: slot._id });

    // Delete the slot itself
    await AttendanceSlot.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Attendance slot and associated records deleted successfully'
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
  const { month, year, startDate, endDate, minAbsences } = req.query;
  
  let dateFilter = {};
  
  // Apply date filters
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    dateFilter = {
      date: {
        $gte: start,
        $lte: end
      }
    };
  } else if (month && year) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    dateFilter = {
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    };
  }

  // Get all students
  const allStudents = await User.find({ role: 'student' }).select('_id name email studentCode');
  
  // Get all attendance slots within the date range
  const slots = await AttendanceSlot.find(dateFilter);
  
  // Get all attendance records within the date range
  const attendanceRecords = await Attendance.find(dateFilter);
  
  // Create a mapping of student attendance
  const attendanceMap = {};
  
  // Initialize attendance map for all students
  allStudents.forEach(student => {
    attendanceMap[student._id] = {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentCode: student.studentCode
      },
      present: 0,
      absent: 0,
      attendanceDates: [],
      absentDates: []
    };
  });
  
  // Process attendance records
  attendanceRecords.forEach(record => {
    const studentId = record.student.toString();
    if (attendanceMap[studentId]) {
      attendanceMap[studentId].present += 1;
      attendanceMap[studentId].attendanceDates.push({
        date: record.date,
        shift: record.shift
      });
    }
  });
  
  // Calculate absences
  slots.forEach(slot => {
    const slotDate = slot.date.toISOString().split('T')[0];
    const slotShift = slot.shift;
    
    allStudents.forEach(student => {
      const studentId = student._id.toString();
      const isPresent = attendanceRecords.some(record => 
        record.student.toString() === studentId && 
        record.date.toISOString().split('T')[0] === slotDate &&
        record.shift === slotShift
      );
      
      if (!isPresent) {
        attendanceMap[studentId].absent += 1;
        attendanceMap[studentId].absentDates.push({
          date: slot.date,
          shift: slotShift
        });
      }
    });
  });
  
  // Convert to array and filter by minimum absences if needed
  let attendanceStats = Object.values(attendanceMap);
  
  if (minAbsences) {
    attendanceStats = attendanceStats.filter(stats => stats.absent >= parseInt(minAbsences));
  }
  
  res.status(200).json({
    success: true,
    count: attendanceStats.length,
    data: attendanceStats,
  });
});

// @desc    Get students with absent count greater than threshold
// @route   GET /api/admin/attendance/absent
// @access  Private/Admin
exports.getAbsentStudents = asyncHandler(async (req, res) => {
  const { threshold = 2, month, year } = req.query;
  
  let dateFilter = {};
  
  // Apply date filters
  if (month && year) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    dateFilter = {
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    };
  }
  
  // Get all students
  const allStudents = await User.find({ role: 'student' }).select('_id name email studentCode');
  
  // Get all attendance slots within the date range
  const slots = await AttendanceSlot.find(dateFilter);
  
  // Get all attendance records within the date range
  const attendanceRecords = await Attendance.find(dateFilter);
  
  // Create a mapping of student absences
  const absenteeMap = {};
  
  // Initialize the map
  allStudents.forEach(student => {
    absenteeMap[student._id] = {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentCode: student.studentCode
      },
      absentCount: 0,
      absentDates: []
    };
  });
  
  // Calculate absences for each student
  slots.forEach(slot => {
    const slotDate = slot.date.toISOString().split('T')[0];
    const slotShift = slot.shift;
    
    allStudents.forEach(student => {
      const studentId = student._id.toString();
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
    });
  });
  
  // Filter by threshold and convert to array
  const absentees = Object.values(absenteeMap)
    .filter(data => data.absentCount >= parseInt(threshold))
    .sort((a, b) => b.absentCount - a.absentCount);
  
  res.status(200).json({
    success: true,
    count: absentees.length,
    data: absentees,
  });
});