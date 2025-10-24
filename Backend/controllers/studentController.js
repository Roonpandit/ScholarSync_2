const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const User = require('../models/Student');

// Helper to add days to a date
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Configure multer for memory storage
const storage = multer.memoryStorage();

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

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
exports.getAllStudents = asyncHandler(async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name email studentCode');
        res.status(200).json({ students });
    } catch (error) {
        throw new Error('Failed to fetch students');
    }
});

// @desc    Check if email exists
// @route   GET /api/users/check-email
// @access  Public
exports.checkEmailExists = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Use the existing checkEmailExists function from emailController
  const { checkEmailExists } = require('./emailController');
  const { exists, userType } = await checkEmailExists(email);
  
  res.status(200).json({
    success: true,
    exists,
    userType: exists ? userType : null
  });
});

// @desc    Get students by class ID
// @route   GET /api/students/class?classId=:classId
// @access  Private/Student,Admin
exports.getStudentsByClass = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.query;
    
    //console.log('Received request for class ID:', classId);
    
    if (!classId) {
      console.error('No class ID provided');
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
      });
    }

    //console.log('Searching for students in class:', classId);
    
    // Find all students in the specified class
    const students = await User.find({ 
      class: classId,
      role: 'student'
    }).select('_id name email rollNumber photo');

    //console.log(`Found ${students.length} students in class ${classId}`);

    // Format the response to match the expected structure
    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name || 'Unknown Student',
      email: student.email || '',
      rollNumber: student.rollNumber || '',
      photo: student.photo?.url || null
    }));

    //console.log('Formatted students:', formattedStudents);

    res.status(200).json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents
    });
  } catch (error) {
    console.error('Error in getStudentsByClass:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      params: req.params
    });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students',
      error: error.message
    });
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'image',
      quality: 'auto:best', // Automatically optimize quality while maintaining high standards
      fetch_format: 'auto', // Automatically choose the best format
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' }, // Limit maximum dimensions
        { quality: 'auto:best' }, // Ensure best quality
        { fetch_format: 'auto' } // Optimize format
      ]
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(file.buffer);
  });
};

// @desc    Get available attendance slots for student's batches
// @route   GET /api/students/attendance-slots
// @access  Private/Student
exports.getActiveAttendanceSlots = asyncHandler(async (req, res) => {
  // Get student with batches
  const student = await User.findById(req.user._id).select('batches');

  if (!student || !student.batches || student.batches.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }

  // Get all slots that are active or upcoming AND match student's batches
  const activeSlots = await AttendanceSlot.find({
    isActive: true,
    status: { $in: ['active', 'upcoming'] },
    batch: { $in: student.batches }
  })
  .populate('batch', 'name batchId')
  .sort({ startTime: 1 }); // Sort by start time ascending

  // Get student's attendance records (including pending status)
  const attendanceRecords = await Attendance.find({
    student: req.user._id,
    slot: { $in: activeSlots.map(s => s._id) }
  });

  // Create a map of slot IDs to attendance status
  const attendanceMap = new Map();
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.slot.toString(), record.status);
  });

  // Filter slots based on attendance status
  // Only show slots that are pending (student hasn't marked yet)
  const availableSlots = activeSlots.filter(slot => {
    const status = attendanceMap.get(slot._id.toString());
    return status === 'pending' || !status; // Show if pending or no record exists
  }).map(slot => ({
    ...slot.toObject(),
    attendanceStatus: attendanceMap.get(slot._id.toString()) || 'not_created'
  }));

  res.status(200).json({
    success: true,
    count: availableSlots.length,
    data: availableSlots
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

  // Check if student has leave applied for this slot
  const LeaveSlot = require('../models/LeaveSlot');
  const hasLeave = await LeaveSlot.hasLeaveForSlot(req.user._id, slotId);

  if (hasLeave) {
    return res.status(400).json({
      success: false,
      message: 'You have applied leave for this time. Please ask your teacher to approve/reject it or you can delete the request'
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
  const currentTime = new Date();
  if (currentTime < slot.startTime || currentTime > slot.endTime) {
    return res.status(400).json({
      success: false,
      message: 'Attendance can only be marked during the active time window',
    });
  }

  // Check if student has pending attendance for this slot
  const existingAttendance = await Attendance.findOne({
    student: req.user._id,
    slot: slotId
  });

  if (existingAttendance && existingAttendance.status === 'present') {
    return res.status(400).json({
      success: false,
      message: 'You have already marked your attendance for this slot',
    });
  }

  if (existingAttendance && existingAttendance.status === 'absent') {
    return res.status(400).json({
      success: false,
      message: 'This attendance slot has been closed and marked as absent',
    });
  }

  // Upload photo to Cloudinary AFTER all validations pass
  const cloudinaryResult = await uploadToCloudinary(req.file);

  // Get current time
  const markTime = new Date();

  // If attendance record exists (pending), update it
  if (existingAttendance) {
    existingAttendance.status = 'awaiting_approval';
    existingAttendance.photo = {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      format: cloudinaryResult.format,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    };
    existingAttendance.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address
    };
    existingAttendance.markedAt = markTime;

    await existingAttendance.save();

    return res.status(200).json({
      success: true,
      message: 'Attendance marked successfully. Waiting for teacher approval.',
      data: existingAttendance,
    });
  }

  // Create new attendance record if it doesn't exist (fallback)
  const attendance = new Attendance({
    student: req.user._id,
    slot: slotId,
    batch: slot.batch,
    date: slot.date,
    shift: slot.shift,
    status: 'awaiting_approval',
    photo: {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      format: cloudinaryResult.format,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    },
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
      address
    },
    markedAt: markTime,
    studentCode: req.user.studentCode,
    studentName: req.user.name,
    studentEmail: req.user.email
  });

  await attendance.save();

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully. Waiting for teacher approval.',
    data: attendance,
  });
});


// @desc    Get student's attendance history
// @route   GET /api/students/attendance
// @access  Private/Student
exports.getAttendanceHistory = asyncHandler(async (req, res) => {
  const { month, year, startDate, endDate } = req.query;
  
  let dateFilter = { student: req.user._id };
  
  // If specific dates are provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
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

  try {
    // Parse and validate input
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month or year'
      });
    }

    // Calculate the date range for the given month and year
    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const joinDate = new Date(req.user.createdAt);
    const effectiveStartDate = startOfMonth < joinDate ? joinDate : startOfMonth;

    // Get student with batches
    const student = await User.findById(req.user._id).select('batches');

    if (!student || !student.batches || student.batches.length === 0) {
      return res.status(200).json({
        success: true,
        absences: [],
        pending: [],
        totalAbsences: 0,
        totalPending: 0,
        totalClosedSlots: 0,
        totalActiveSlots: 0
      });
    }

    // Get all attendance slots within the date range, after join date, AND from student's batches
    const slots = await AttendanceSlot.find({
      date: {
        $gte: effectiveStartDate,
        $lte: endOfMonth
      },
      batch: { $in: student.batches }
    });

    // Get the student's attendance records for the same range
    const attendanceRecords = await Attendance.find({
      student: req.user._id,
      date: {
        $gte: effectiveStartDate,
        $lte: endOfMonth
      }
    });

    const absences = [];
    const pending = [];

    slots.forEach(slot => {
      const isPresent = attendanceRecords.some(record =>
        record.slot.toString() === slot._id.toString()
      );

      if (!isPresent) {
        const entry = {
          date: slot.date,
          shift: slot.shift,
          slotStartTime: slot.startTime,
          slotEndTime: slot.endTime
        };

        if (slot.status === 'closed') {
          absences.push(entry);
        } else if (slot.status === 'active') {
          pending.push(entry);
        }
      }
    });

    res.status(200).json({
      success: true,
      absences,
      pending,
      totalAbsences: absences.length,
      totalPending: pending.length,
      totalClosedSlots: slots.filter(slot => slot.status === 'closed').length,
      totalActiveSlots: slots.filter(slot => slot.status === 'active').length
    });
  } catch (error) {
    console.error('Error in getAbsenceHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
