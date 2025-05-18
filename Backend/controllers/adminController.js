const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const { convertToIST, getStartOfDayIST, getEndOfDayIST, getCurrentDateIST, isDateBefore, isSameDate } = require('../services/timeUtils');

// @desc    Get student details with attendance history
// @route   GET /api/admin/students/:id/details
// @access  Private/Admin
exports.getStudentDetailsWithAttendance = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }

    // Get student details with all fields
    const student = await User.findById(id).lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get all attendance slots for the student's time period (from their join date)
    const attendanceSlots = await AttendanceSlot.find({
      date: {
        $gte: convertToIST(new Date(student.createdAt)), // Only count slots from when the student joined
        $lte: getCurrentDateIST()
      }
    }).lean();

    // Calculate total possible attendance slots
    const totalSlots = attendanceSlots.length;

    // Get attendance records for the student within their time period
    const attendanceRecords = await Attendance.find({ 
      student: id,
      date: {
        $gte: convertToIST(new Date(student.createdAt)),
        $lte: getCurrentDateIST()
      }
    })
      .populate('slot', 'shift startTime endTime date')
      .sort({ date: -1 })
      .lean();

    // Calculate attendance statistics
    const attendanceStats = {
      total: totalSlots,
      present: attendanceRecords.length, // All records are present since we're filtering by date
      absent: totalSlots - attendanceRecords.length
    };

    // Format attendance records to include full date information
    const formattedAttendance = attendanceRecords.map(record => ({
      ...record,
      date: convertToIST(record.date).toISOString(),
      slot: {
        ...record.slot,
        date: convertToIST(record.slot.date).toISOString()
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        student,
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
      
      const startOfDay = getStartOfDayIST(parsedDate);
      const endOfDay = getEndOfDayIST(parsedDate);
      
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
// @access  Private/Admin
exports.updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, studentCode, phone } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid student ID',
    });
  }

  // Validate request body - at least one field must be provided
  const updateFields = { name, email, studentCode, phone };
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
    if (email) {
      updateObject.email = email;
      // Check if email is already used by another student
      const existingStudent = await User.findOne({ email });
      if (existingStudent && existingStudent._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another student',
        });
      }
    }
    if (studentCode) {
      updateObject.studentCode = studentCode;
      // Check if studentCode is already used by another student
      const existingStudent = await User.findOne({ studentCode });
      if (existingStudent && existingStudent._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'Student code is already in use by another student',
        });
      }
    }
    if (phone) updateObject.phone = phone;

    // Update student details
    const updatedStudent = await User.findByIdAndUpdate(
      id,
      updateObject,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: {
        _id: updatedStudent._id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        studentCode: updatedStudent.studentCode,
        phone: updatedStudent.phone,
      },
    });
  } catch (error) {
    console.error('Error updating student:', error);
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

    // Get attendance records for the student in the specified month, considering join date
    const attendanceRecords = await Attendance.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: {
            $gte: new Date(student.createdAt),
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
  const { name, email, studentCode, password, phone } = req.body;

  // Validation
  if (!name || !email || !studentCode || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Validate phone number if provided
  if (phone && !/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit phone number'
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
    phone,
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
    console.log('Fetching attendance stats for:', req.query);
    
    const { month, year, minAbsences, startDate: startDateParam, endDate: endDateParam } = req.query;

    let dateFilter = {};
    let startDate, endDate; // ✅ Declare here

    if (startDateParam && endDateParam) {
      startDate = convertToIST(new Date(startDateParam));
      endDate = convertToIST(new Date(endDateParam));
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide valid dates in YYYY-MM-DD format'
        });
      }
      
      dateFilter.date = {
        $gte: startDate,
        $lte: endDate
      };
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
      
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either month+year or startDate+endDate parameters are required'
      });
    }

    const parsedMinAbsences = parseInt(minAbsences) || 0;

    console.log('Using date range:', startDate.toISOString(), 'to', endDate.toISOString());
    
    // ... rest of the code remains the same ...


    // Get all students
    const allStudents = await User.find({ role: 'student' }).select('_id name email studentCode createdAt');
    
    // Get all attendance slots within the date range
    const slots = await AttendanceSlot.find(dateFilter);
    console.log(`Found ${slots.length} attendance slots`);
    
    // Get all attendance records within the date range
    const attendanceRecords = await Attendance.find(dateFilter)
      .populate('student', 'name email studentCode');
    console.log(`Found ${attendanceRecords.length} attendance records`);
    
    // Create a mapping of student attendance
    const studentAttendance = new Map();
    
    // Initialize the map with student data
    allStudents.forEach(student => {
      const studentJoinDate = new Date(student.createdAt);
      studentAttendance.set(student._id.toString(), {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentCode: student.studentCode
        },
        joinDate: studentJoinDate,
        present: 0,
        absent: 0,
        attendanceDates: [],
        absentDates: []
      });
    });
    
    // Process attendance records (mark presents)
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
    
    // Calculate attendance for each student
    studentAttendance.forEach((data, studentId) => {
      // Count total possible slots for this student
      const totalSlots = slots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate >= data.joinDate;
      }).length;

      // Count present slots for this student
      const presentSlots = attendanceRecords.filter(record => 
        record.student._id.toString() === studentId
      ).length;

      // Calculate absences
      data.present = presentSlots;
      data.absent = totalSlots - presentSlots;

      // Update the map with the correct counts
      studentAttendance.set(studentId, data);
    });
    
    // Filter students with absences >= minAbsences
    const studentsWithAbsences = Array.from(studentAttendance.values())
      .filter(data => data.absent >= parsedMinAbsences)
      .sort((a, b) => b.absent - a.absent);
    
    // Prepare statistics
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

      // Validate the created dates
      if (isNaN(startOfMonth.getTime()) || isNaN(endOfMonth.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range generated'
        });
      }
      
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
    // If no date parameters provided, get data for the current month
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
    // Get all students - INCLUDE createdAt in the selection
    const allStudents = await User.find({ role: 'student' }).select('_id name email studentCode createdAt');
    
    // Create a mapping of student absences
    const absenteeMap = {};
    
    // Initialize the map with student join dates
    allStudents.forEach(student => {
      const studentJoinDate = student.createdAt ? new Date(student.createdAt) : null;
      absenteeMap[student._id] = {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentCode: student.studentCode
        },
        joinDate: studentJoinDate,
        absentCount: 0,
        absentDates: []
      };
    });
    
    // Get all attendance slots within the date range
    const slots = await AttendanceSlot.find(dateFilter);
    
    // Get all attendance records within the date range
    const attendanceRecords = await Attendance.find(dateFilter);
    
    // Calculate absences for each student
    slots.forEach(slot => {
      const slotDate = slot.date.toISOString().split('T')[0];
      const slotShift = slot.shift;
      
      allStudents.forEach(student => {
        const studentId = student._id.toString();
        // Get student join date, defaulting to the earliest possible date if it's not available
        const studentJoinDate = student.createdAt ? new Date(student.createdAt) : new Date(0);
        const slotDateObj = new Date(slotDate);
        
        // Only count absence if slot date is after student's join date
        if (slotDateObj >= studentJoinDate) {
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
    
    // Filter by threshold and convert to array
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