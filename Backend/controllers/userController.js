const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { convertToIST, getCurrentDateIST, isDateBefore, isSameDate, addDays, convertToUTC } = require('../services/timeUtils');

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

// @desc    Get students by class ID
// @route   GET /api/students/class?classId=:classId
// @access  Private/Student,Admin
exports.getStudentsByClass = asyncHandler(async (req, res) => {
  try {
    const { classId } = req.query;
    
    console.log('Received request for class ID:', classId);
    
    if (!classId) {
      console.error('No class ID provided');
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
      });
    }

    console.log('Searching for students in class:', classId);
    
    // Find all students in the specified class
    const students = await User.find({ 
      class: classId,
      role: 'student'
    }).select('_id name email rollNumber photo');

    console.log(`Found ${students.length} students in class ${classId}`);

    // Format the response to match the expected structure
    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name || 'Unknown Student',
      email: student.email || '',
      rollNumber: student.rollNumber || '',
      photo: student.photo?.url || null
    }));

    console.log('Formatted students:', formattedStudents);

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

// @desc    Get available attendance slots for today
// @route   GET /api/students/attendance-slots
// @access  Private/Student
exports.getActiveAttendanceSlots = asyncHandler(async (req, res) => {
  // Get current time in IST
  const nowIST = getCurrentDateIST();
  const nowUTC = convertToUTC(nowIST);

  // Get all active slots that are either:
  // 1. Currently active (startTime <= now <= endTime), OR
  // 2. Upcoming (startTime > now)
  const activeSlots = await AttendanceSlot.find({
    isActive: true,
    $or: [
      {
        // Currently active slots
        startTime: { $lte: nowUTC },
        endTime: { $gte: nowUTC }
      },
      {
        // Upcoming slots (within the next 12 hours)
        startTime: { 
          $gt: nowUTC,
          $lte: addDays(nowUTC, 0.5) // Next 12 hours
        }
      }
    ]
  }).sort({ startTime: 1 }); // Sort by start time ascending

  // Filter out slots where student has already marked attendance
  const filteredSlots = await Promise.all(
    activeSlots.map(async (slot) => {
      const hasMarked = await Attendance.findOne({
        student: req.user._id,
        slot: slot._id,
        date: slot.date,
        shift: slot.shift
      });
      
      return hasMarked ? null : slot;
    })
  );

  // Remove null values (slots where student has marked attendance)
  const availableSlots = filteredSlots.filter(Boolean);

    // Convert times to IST for display
    const slotsWithISTTimes = availableSlots.map(slot => {
      return {
        ...slot.toObject(),
        startTime: convertToIST(new Date(slot.startTime)).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
        endTime: convertToIST(new Date(slot.endTime)).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      };
    });

    res.status(200).json({
      success: true,
      count: slotsWithISTTimes.length,
      data: slotsWithISTTimes
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

  // Upload photo to Cloudinary
  const cloudinaryResult = await uploadToCloudinary(req.file);
  
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
  
  // Get current time in IST
  const nowIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  // Create attendance record with IST timestamp
  const attendance = new Attendance({
    student: req.user._id,
    slot: slotId,
    date: slot.date,
    shift: slot.shift,
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
    markedAt: new Date(nowIST),
    studentCode: req.user.studentCode,
    studentName: req.user.name,
    studentEmail: req.user.email
  });
  
  await attendance.save();
  
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
  
  // If specific dates are provided
  if (startDate && endDate) {
    const start = convertToIST(new Date(startDate));
    const end = convertToIST(new Date(endDate));
    
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
    // Parse and validate month and year
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month or year'
      });
    }
    
    // Use parsed numbers for date calculations
    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    // Validate dates are valid
    if (isNaN(startOfMonth) || isNaN(endOfMonth)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range'
      });
    }
    
    const joinDate = new Date(req.user.createdAt);
    const effectiveStartDate = new Date(Math.max(startOfMonth.getTime(), joinDate.getTime()));
    
    // Get all slots for the selected month and year
    const slots = await AttendanceSlot.find({
      date: {
        $gte: effectiveStartDate,
        $lte: endOfMonth
      }
    });
    
    // Get all attendance records for the student within the selected month and year
    const attendanceRecords = await Attendance.find({
      student: req.user._id,
      date: {
        $gte: effectiveStartDate,
        $lte: endOfMonth
      }
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
      totalSlots: slots.length
    });
  } catch (error) {
    console.error('Error in getAbsenceHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
