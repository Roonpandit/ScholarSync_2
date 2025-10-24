const asyncHandler = require('express-async-handler');
const Batch = require('../models/Batch');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const AttendanceSlot = require('../models/AttendanceSlot');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new batch
// @route   POST /api/admin/batches
// @access  Private/Admin
exports.createBatch = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a batch name'
      });
    }

    // Check if batch name already exists
    const existingBatch = await Batch.findOne({ name });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'A batch with this name already exists'
      });
    }

    // Check if this is the first batch being created
    const batchCount = await Batch.countDocuments();
    const isFirstBatch = batchCount === 0;

    // Create new batch
    const batch = await Batch.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      isDefault: isFirstBatch // First batch created is the default batch
    });

    const message = isFirstBatch
      ? 'Default batch created successfully. This batch cannot be deleted and all students must belong to it.'
      : 'Batch created successfully';

    res.status(201).json({
      success: true,
      message: message,
      data: batch
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get all batches (Admin only - returns all batches)
// @route   GET /api/admin/batches
// @access  Private/Admin
exports.getAllBatches = asyncHandler(async (req, res) => {
  try {
    const query = { isActive: true };

    const batches = await Batch.find(query)
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, createdAt: -1 }); // Default batch first

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single batch by ID
// @route   GET /api/admin/batches/:id
// @access  Private/Admin/Teacher
exports.getBatchById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID'
      });
    }

    const batch = await Batch.findById(id).populate('createdBy', 'name email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Get student count for this batch
    const studentCount = await Student.countDocuments({ batches: id });

    res.status(200).json({
      success: true,
      data: {
        ...batch.toObject(),
        studentCount
      }
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update batch
// @route   PUT /api/admin/batches/:id
// @access  Private/Admin
exports.updateBatch = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID'
      });
    }

    const batch = await Batch.findById(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Update only allowed fields
    if (name && name !== batch.name) {
      // Check if new name already exists
      const existingBatch = await Batch.findOne({ name, _id: { $ne: id } });
      if (existingBatch) {
        return res.status(400).json({
          success: false,
          message: 'A batch with this name already exists'
        });
      }
      batch.name = name;
    }

    if (description !== undefined) {
      batch.description = description;
    }

    // Allow toggling isActive only for non-default batches
    if (isActive !== undefined && !batch.isDefault) {
      batch.isActive = isActive;
    }

    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete batch
// @route   DELETE /api/admin/batches/:id
// @access  Private/Admin
exports.deleteBatch = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID'
      });
    }

    const batch = await Batch.findById(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Prevent deletion of default batch
    if (batch.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete the default batch. You can only rename it.'
      });
    }

    // Remove batch from all students
    await Student.updateMany(
      { batches: id },
      { $pull: { batches: id } }
    );

    // Find all attendance slots for this batch
    const slotsInBatch = await AttendanceSlot.find({ batch: id }).select('_id');
    const slotIds = slotsInBatch.map(slot => slot._id);

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

    // Delete all attendance slots for this batch
    await AttendanceSlot.deleteMany({ batch: id });

    // Delete the batch
    await Batch.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully along with all related attendance data and photos'
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get default batch
// @route   GET /api/admin/batches/default/info
// @access  Private/Admin/Teacher
exports.getDefaultBatch = asyncHandler(async (req, res) => {
  try {
    const defaultBatch = await Batch.findOne({ isDefault: true });

    if (!defaultBatch) {
      return res.status(404).json({
        success: false,
        message: 'Default batch not found. Please run the seeder to create it.'
      });
    }

    res.status(200).json({
      success: true,
      data: defaultBatch
    });
  } catch (error) {
    console.error('Error fetching default batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching default batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get students in a specific batch
// @route   GET /api/admin/batches/:id/students
// @access  Private/Admin/Teacher
exports.getStudentsByBatch = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID'
      });
    }

    const batch = await Batch.findById(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Find all students in this batch
    const students = await Student.find({ batches: id })
      .select('name email studentCode phone createdAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      batch: {
        _id: batch._id,
        name: batch.name,
        batchId: batch.batchId
      },
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students by batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Assign batch(es) to student(s) - Works from both batch and student pages
// @route   POST /api/batches/assign
// @access  Private/Admin/Teacher
exports.assignBatchesToStudents = asyncHandler(async (req, res) => {
  try {
    const { batchIds, studentIds } = req.body;

    // Validate inputs
    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of batch IDs'
      });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    // Validate all batch IDs
    const batches = await Batch.find({ _id: { $in: batchIds }, isActive: true });

    if (batches.length !== batchIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid or inactive batch IDs provided'
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

    // Add batches to each student
    for (const student of students) {
      for (const batchId of batchIds) {
        if (!student.batches.some(b => b.toString() === batchId)) {
          student.batches.push(batchId);
          totalAdded++;
        } else {
          alreadyAssigned++;
        }
      }
      await student.save();
    }

    res.status(200).json({
      success: true,
      message: `Batches assigned successfully`,
      data: {
        totalAdded,
        alreadyAssigned,
        studentsProcessed: students.length,
        batchesProcessed: batchIds.length
      }
    });
  } catch (error) {
    console.error('Error assigning batches to students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Unassign batch(es) from student(s) - Works from both batch and student pages
// @route   POST /api/batches/unassign
// @access  Private/Admin/Teacher
exports.unassignBatchesFromStudents = asyncHandler(async (req, res) => {
  try {
    const { batchIds, studentIds } = req.body;

    // Validate inputs
    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of batch IDs'
      });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
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

    // Check if trying to remove default batch
    if (batchIds.includes(defaultBatch._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove students from the default batch. All students must belong to the default batch.'
      });
    }

    // Validate all batch IDs
    const batches = await Batch.find({ _id: { $in: batchIds } });

    if (batches.length !== batchIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid batch IDs provided'
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
    let notInBatch = 0;

    // Remove batches from each student and clean up attendance data
    for (const student of students) {
      const originalLength = student.batches.length;
      student.batches = student.batches.filter(
        batchId => !batchIds.includes(batchId.toString())
      );
      const removed = originalLength - student.batches.length;
      totalRemoved += removed;
      notInBatch += (batchIds.length - removed);

      await student.save();

      // Delete attendance records and photos for this student in the removed batches
      for (const batchId of batchIds) {
        // Find all attendance slots for this batch
        const slotsInBatch = await AttendanceSlot.find({ batch: batchId }).select('_id');
        const slotIds = slotsInBatch.map(slot => slot._id);

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
      message: `Batches unassigned successfully and related attendance data cleaned up`,
      data: {
        totalRemoved,
        notInBatch,
        studentsProcessed: students.length,
        batchesProcessed: batchIds.length
      }
    });
  } catch (error) {
    console.error('Error unassigning batches from students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unassigning batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get student's non-default batches (for leave application)
// @route   GET /api/batches/non-default
// @access  Private (Student)
exports.getNonDefaultBatches = asyncHandler(async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student with batches
    const student = await Student.findById(studentId).populate({
      path: 'batches',
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
      data: student.batches
    });
  } catch (error) {
    console.error('Error fetching non-default batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches'
    });
  }
});

// @desc    Get teacher for a specific batch
// @route   GET /api/batches/:batchId/teacher
// @access  Private (Student)
exports.getTeacherForBatch = asyncHandler(async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID'
      });
    }

    // Find teacher assigned to this batch
    const teacher = await Teacher.findOne({
      batches: batchId
    }).select('_id name teacherCode email');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'No teacher assigned to this batch'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Error fetching teacher for batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher'
    });
  }
});
