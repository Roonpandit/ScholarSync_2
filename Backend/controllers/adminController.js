const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

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

  // Check if slot already exists for this date and shift
  const existingSlot = await AttendanceSlot.findOne({
    date: new Date(date).setHours(0, 0, 0, 0),
    shift,
  });

  if (existingSlot) {
    return res.status(400).json({
      success: false,
      message: `Attendance slot for ${shift} shift on this date already exists`,
    });
  }

  // Create attendance slot
  const attendanceSlot = await AttendanceSlot.create({
    shift,
    date: new Date(date).setHours(0, 0, 0, 0),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
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
  
  let query = {};
  
  if (date) {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    
    query.date = queryDate;
  }

  const attendanceSlots = await AttendanceSlot.find(query)
    .sort({ date: -1, shift: 1 })
    .populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: attendanceSlots.length,
    data: attendanceSlots,
  });
});

// @desc    Close attendance slot
// @route   PUT /api/admin/attendance-slots/:id/close
// @access  Private/Admin
exports.closeAttendanceSlot = asyncHandler(async (req, res) => {
  const slot = await AttendanceSlot.findById(req.params.id);

  if (!slot) {
    return res.status(404).json({
      success: false,
      message: 'Attendance slot not found',
    });
  }

  if (!slot.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Attendance slot is already closed',
    });
  }

  slot.isActive = false;
  await slot.save();

  res.status(200).json({
    success: true,
    data: slot,
  });
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

  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);
  
  let query = { date: queryDate };
  
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