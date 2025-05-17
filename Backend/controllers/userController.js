const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

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
  const now = new Date();
  
  // Get current time in UTC
  const nowUTC = new Date();

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
          $lte: new Date(nowUTC.getTime() + (12 * 60 * 60 * 1000)) // Next 12 hours
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
        startTime: new Date(slot.startTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
        endTime: new Date(slot.endTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
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
  
  // Calculate absences and pending status
  const attendanceStatus = [];
  
  slots.forEach(slot => {
    const isPresent = attendanceRecords.some(record => 
      record.slot.toString() === slot._id.toString()
    );
    
    if (!isPresent) {
      const now = new Date();
      const slotEndTime = new Date(slot.endTime);
      
      // If slot is upcoming or active, mark as pending
      if (slot.status === 'upcoming' || slot.status === 'active') {
        attendanceStatus.push({
          date: slot.date,
          shift: slot.shift,
          status: 'pending',
          slotStartTime: slot.startTime,
          slotEndTime: slot.endTime
        });
      } else {
        // If slot is expired and not marked, mark as absent
        attendanceStatus.push({
          date: slot.date,
          shift: slot.shift,
          status: 'absent',
          slotStartTime: slot.startTime,
          slotEndTime: slot.endTime
        });
      }
    }
  });
  
  res.status(200).json({
    success: true,
    count: absences.length,
    data: absences,
  });
});