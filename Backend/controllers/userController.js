const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/attendance';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'attendance-' + uniqueSuffix + ext);
  }
});

// Set up file filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Initialize upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Handle file upload middleware
exports.uploadAttendancePhoto = upload.single('photo');

// @desc    Get available attendance slots for today
// @route   GET /api/students/attendance-slots
// @access  Private/Student
exports.getActiveAttendanceSlots = asyncHandler(async (req, res) => {
  // Get today's date and set time to beginning of day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find all active slots for today
  const activeSlots = await AttendanceSlot.find({
    date: today,
    isActive: true,
    startTime: { $lte: new Date() }, // Slot has started
    endTime: { $gte: new Date() }    // Slot has not ended
  });
  
  res.status(200).json({
    success: true,
    count: activeSlots.length,
    data: activeSlots,
  });
});

// @desc    Mark attendance
// @route   POST /api/students/attendance
// @access  Private/Student
exports.markAttendance = asyncHandler(async (req, res) => {
  const { slotId, latitude, longitude, address } = req.body;
  
  // Validate required fields
  if (!slotId || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Please provide slot ID and location data',
    });
  }
  
  // Check if photo was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a photo for attendance verification',
    });
  }
  
  // Find the attendance slot
  const slot = await AttendanceSlot.findById(slotId);
  
  if (!slot) {
    return res.status(404).json({
      success: false,
      message: 'Attendance slot not found',
    });
  }
  
  // Check if the slot is active
  if (!slot.isActive) {
    return res.status(400).json({
      success: false,
      message: 'This attendance slot is no longer active',
    });
  }
  
  // Check if the current time is within the slot timeframe
  const now = new Date();
  if (now < slot.startTime || now > slot.endTime) {
    return res.status(400).json({
      success: false,
      message: 'Attendance can only be marked during the active time window',
    });
  }
  
  // Check if student has already marked attendance for this slot
  const existingAttendance = await Attendance.findOne({
    student: req.user._id,
    slot: slotId,
    date: slot.date,
    shift: slot.shift
  });
  
  if (existingAttendance) {
    return res.status(400).json({
      success: false,
      message: 'You have already marked your attendance for this slot',
    });
  }
  
  // Create attendance record
  const attendance = await Attendance.create({
    student: req.user._id,
    slot: slotId,
    date: slot.date,
    shift: slot.shift,
    photo: req.file.path,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      address: address || 'Unknown location'
    },
    markedAt: now,
    studentCode: req.user.studentCode,
    studentName: req.user.name,
    studentEmail: req.user.email
  });
  
  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    data: attendance,
  });
});

// @desc    Get student's attendance history
// @route   GET /api/students/attendance
// @access  Private/Student
exports.getAttendanceHistory = asyncHandler(async (req, res) => {
  const { month, year, startDate, endDate } = req.query;
  
  let dateFilter = { student: req.user._id };
  
  // Apply date filters
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    dateFilter.date = {
      $gte: start,
      $lte: end
    };
  } else if (month && year) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    dateFilter.date = {
      $gte: startOfMonth,
      $lte: endOfMonth
    };
  }
  
  // Get attendance history
  const attendance = await Attendance.find(dateFilter)
    .populate('slot', 'shift date startTime endTime')
    .sort({ date: -1, 'slot.shift': 1 });
  
  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance,
  });
});

// @desc    Get student's absence history
// @route   GET /api/students/absences
// @access  Private/Student
exports.getAbsenceHistory = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
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
  
  // Get all slots within the date range
  const slots = await AttendanceSlot.find(dateFilter);
  
  // Get all attendance records for the student within the date range
  const attendanceRecords = await Attendance.find({
    ...dateFilter,
    student: req.user._id
  });
  
  // Calculate absences
  const absences = [];
  
  slots.forEach(slot => {
    const isPresent = attendanceRecords.some(record => 
      record.slot.toString() === slot._id.toString()
    );
    
    if (!isPresent) {
      absences.push({
        date: slot.date,
        shift: slot.shift,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime
      });
    }
  });
  
  res.status(200).json({
    success: true,
    count: absences.length,
    data: absences,
  });
});