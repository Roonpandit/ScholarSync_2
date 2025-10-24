const asyncHandler = require('express-async-handler');
const Lecture = require('../models/Lecture');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new lecture
// @route   POST /api/admin/lectures
// @access  Private/Admin
exports.createLecture = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a lecture name'
      });
    }

    // Check if lecture name already exists
    const existingLecture = await Lecture.findOne({ name });
    if (existingLecture) {
      return res.status(400).json({
        success: false,
        message: 'A lecture with this name already exists'
      });
    }

    // Check if this is the first lecture being created
    const lectureCount = await Lecture.countDocuments();
    const isFirstLecture = lectureCount === 0;

    // Create new lecture
    const lecture = await Lecture.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      isDefault: isFirstLecture // First lecture created is the default lecture
    });

    const message = isFirstLecture
      ? 'Default lecture created successfully. This lecture cannot be deleted and all students must belong to it.'
      : 'Lecture created successfully';

    res.status(201).json({
      success: true,
      message: message,
      data: lecture
    });
  } catch (error) {
    console.error('Error creating lecture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating lecture',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get all lectures (Admin only - returns all lectures)
// @route   GET /api/admin/lectures
// @access  Private/Admin
exports.getAllLectures = asyncHandler(async (req, res) => {
  try {
    const query = { isActive: true };

    const lectures = await Lecture.find(query)
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, createdAt: -1 }); // Default lecture first

    res.status(200).json({
      success: true,
      count: lectures.length,
      data: lectures
    });
  } catch (error) {
    console.error('Error fetching lectures:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lectures',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single lecture by ID
// @route   GET /api/admin/lectures/:id
// @access  Private/Admin/Teacher
exports.getLectureById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID'
      });
    }

    const lecture = await Lecture.findById(id).populate('createdBy', 'name email');

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Get student count for this lecture
    const studentCount = await Student.countDocuments({ lectures: id });

    res.status(200).json({
      success: true,
      data: {
        ...lecture.toObject(),
        studentCount
      }
    });
  } catch (error) {
    console.error('Error fetching lecture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lecture',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update lecture
// @route   PUT /api/admin/lectures/:id
// @access  Private/Admin
exports.updateLecture = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID'
      });
    }

    const lecture = await Lecture.findById(id);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Update only allowed fields
    if (name && name !== lecture.name) {
      // Check if new name already exists
      const existingLecture = await Lecture.findOne({ name, _id: { $ne: id } });
      if (existingLecture) {
        return res.status(400).json({
          success: false,
          message: 'A lecture with this name already exists'
        });
      }
      lecture.name = name;
    }

    if (description !== undefined) {
      lecture.description = description;
    }

    // Allow toggling isActive only for non-default lectures
    if (isActive !== undefined && !lecture.isDefault) {
      lecture.isActive = isActive;
    }

    await lecture.save();

    res.status(200).json({
      success: true,
      message: 'Lecture updated successfully',
      data: lecture
    });
  } catch (error) {
    console.error('Error updating lecture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lecture',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete lecture
// @route   DELETE /api/admin/lectures/:id
// @access  Private/Admin
exports.deleteLecture = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID'
      });
    }

    const lecture = await Lecture.findById(id);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Prevent deletion of default lecture
    if (lecture.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete the default lecture. You can only rename it.'
      });
    }

    // Remove lecture from all students
    await Student.updateMany(
      { lectures: id },
      { $pull: { lectures: id } }
    );

    // Find all attendance slots for this lecture
    const slotsInLecture = await AttendanceSlot.find({ lecture: id }).select('_id');
    const slotIds = slotsInLecture.map(slot => slot._id);

    // Get all attendance records for these slots
    const attendanceRecords = await Attendance.find({ slot: { $in: slotIds } });

    // Delete photos from Cloudinary
    const photoDeletePromises = attendanceRecords.map(record => {
      if (record.photo && record.photo.public_id) {
        return cloudinary.uploader.destroy(record.photo.public_id);
      }
      return Promise.resolve();
    });

    await Promise.all(photoDeletePromises);

    // Delete all attendance records for these slots
    await Attendance.deleteMany({ slot: { $in: slotIds } });

    // Delete all attendance slots for this lecture
    await AttendanceSlot.deleteMany({ lecture: id });

    // Delete the lecture
    await Lecture.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully along with all related attendance data and photos'
    });
  } catch (error) {
    console.error('Error deleting lecture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting lecture',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get default lecture
// @route   GET /api/admin/lectures/default/info
// @access  Private/Admin/Teacher
exports.getDefaultLecture = asyncHandler(async (req, res) => {
  try {
    const defaultLecture = await Lecture.findOne({ isDefault: true });

    if (!defaultLecture) {
      return res.status(404).json({
        success: false,
        message: 'Default lecture not found. Please run the seeder to create it.'
      });
    }

    res.status(200).json({
      success: true,
      data: defaultLecture
    });
  } catch (error) {
    console.error('Error fetching default lecture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching default lecture',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get students in a specific lecture
// @route   GET /api/admin/lectures/:id/students
// @access  Private/Admin/Teacher
exports.getStudentsByLecture = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID'
      });
    }

    const lecture = await Lecture.findById(id);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Find all students in this lecture
    const students = await Student.find({ lectures: id })
      .select('name email studentCode phone createdAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      lecture: {
        _id: lecture._id,
        name: lecture.name,
        lectureId: lecture.lectureId
      },
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students by lecture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Assign lecture(s) to student(s) - Works from both lecture and student pages
// @route   POST /api/lectures/assign
// @access  Private/Admin/Teacher
exports.assignLecturesToStudents = asyncHandler(async (req, res) => {
  try {
    const { lectureIds, studentIds } = req.body;

    // Validate inputs
    if (!lectureIds || !Array.isArray(lectureIds) || lectureIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of lecture IDs'
      });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    // Validate all lecture IDs
    const lectures = await Lecture.find({ _id: { $in: lectureIds }, isActive: true });

    if (lectures.length !== lectureIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid or inactive lecture IDs provided'
      });
    }

    // Validate all student IDs
    const students = await Student.find({ _id: { $in: studentIds }, role: 'student' });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid student IDs provided'
      });
    }

    let totalAdded = 0;
    let alreadyAssigned = 0;

    // Add lectures to each student
    for (const student of students) {
      for (const lectureId of lectureIds) {
        if (!student.lectures.some(l => l.toString() === lectureId)) {
          student.lectures.push(lectureId);
          totalAdded++;
        } else {
          alreadyAssigned++;
        }
      }
      await student.save();
    }

    res.status(200).json({
      success: true,
      message: `Lectures assigned successfully`,
      data: {
        totalAdded,
        alreadyAssigned,
        studentsProcessed: students.length,
        lecturesProcessed: lectureIds.length
      }
    });
  } catch (error) {
    console.error('Error assigning lectures to students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning lectures',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Unassign lecture(s) from student(s) - Works from both lecture and student pages
// @route   POST /api/lectures/unassign
// @access  Private/Admin/Teacher
exports.unassignLecturesFromStudents = asyncHandler(async (req, res) => {
  try {
    const { lectureIds, studentIds } = req.body;

    // Validate inputs
    if (!lectureIds || !Array.isArray(lectureIds) || lectureIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of lecture IDs'
      });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    // Get the default lecture
    const defaultLecture = await Lecture.findOne({ isDefault: true });

    if (!defaultLecture) {
      return res.status(500).json({
        success: false,
        message: 'Default lecture not found'
      });
    }

    // Check if trying to remove default lecture
    if (lectureIds.includes(defaultLecture._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove students from the default lecture. All students must belong to the default lecture.'
      });
    }

    // Validate all lecture IDs
    const lectures = await Lecture.find({ _id: { $in: lectureIds } });

    if (lectures.length !== lectureIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid lecture IDs provided'
      });
    }

    // Validate all student IDs
    const students = await Student.find({ _id: { $in: studentIds }, role: 'student' });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid student IDs provided'
      });
    }

    let totalRemoved = 0;
    let notInLecture = 0;

    // Remove lectures from each student and clean up attendance data
    for (const student of students) {
      const originalLength = student.lectures.length;
      student.lectures = student.lectures.filter(
        lectureId => !lectureIds.includes(lectureId.toString())
      );
      const removed = originalLength - student.lectures.length;
      totalRemoved += removed;
      notInLecture += (lectureIds.length - removed);

      await student.save();

      // Delete attendance records and photos for this student in the removed lectures
      for (const lectureId of lectureIds) {
        // Find all attendance slots for this lecture
        const slotsInLecture = await AttendanceSlot.find({ lecture: lectureId }).select('_id');
        const slotIds = slotsInLecture.map(slot => slot._id);

        // Get attendance records for this student in these slots
        const attendanceRecords = await Attendance.find({
          student: student._id,
          slot: { $in: slotIds }
        });

        // Delete photos from Cloudinary
        const photoDeletePromises = attendanceRecords.map(record => {
          if (record.photo && record.photo.public_id) {
            return cloudinary.uploader.destroy(record.photo.public_id);
          }
          return Promise.resolve();
        });

        await Promise.all(photoDeletePromises);

        // Delete attendance records
        await Attendance.deleteMany({
          student: student._id,
          slot: { $in: slotIds }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Lectures unassigned successfully and related attendance data cleaned up`,
      data: {
        totalRemoved,
        notInLecture,
        studentsProcessed: students.length,
        lecturesProcessed: lectureIds.length
      }
    });
  } catch (error) {
    console.error('Error unassigning lectures from students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unassigning lectures',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get student's non-default lectures (for leave application)
// @route   GET /api/lectures/non-default
// @access  Private (Student)
exports.getNonDefaultLectures = asyncHandler(async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student with lectures
    const student = await Student.findById(studentId).populate({
      path: 'lectures',
      match: { isDefault: false, isActive: true }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student.lectures
    });
  } catch (error) {
    console.error('Error fetching non-default lectures:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lectures'
    });
  }
});

// @desc    Get teacher for a specific lecture
// @route   GET /api/lectures/:lectureId/teacher
// @access  Private (Student)
exports.getTeacherForLecture = asyncHandler(async (req, res) => {
  try {
    const { lectureId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID'
      });
    }

    // Find teacher assigned to this lecture
    const teacher = await Teacher.findOne({
      lectures: lectureId
    }).select('_id name teacherCode email');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'No teacher assigned to this lecture'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Error fetching teacher for lecture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher'
    });
  }
});
