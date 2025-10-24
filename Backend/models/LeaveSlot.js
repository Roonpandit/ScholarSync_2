const mongoose = require('mongoose');

const leaveSlotSchema = new mongoose.Schema(
  {
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveRequest',
      required: [true, 'Leave request ID is required']
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch ID is required']
    },
    attendanceSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSlot',
      required: [true, 'Attendance slot ID is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    status: {
      type: String,
      enum: ['blocked', 'on_leave', 'cancelled'],
      default: 'blocked',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
leaveSlotSchema.index({ studentId: 1, batchId: 1, date: 1 });
leaveSlotSchema.index({ attendanceSlotId: 1, studentId: 1 }, { unique: true });
leaveSlotSchema.index({ leaveRequestId: 1 });
leaveSlotSchema.index({ status: 1 });

// Static method to check if student has leave for a specific slot
leaveSlotSchema.statics.hasLeaveForSlot = async function(studentId, attendanceSlotId) {
  try {
    const leaveSlot = await this.findOne({
      studentId,
      attendanceSlotId,
      status: { $in: ['blocked', 'on_leave'] }
    });
    return leaveSlot !== null;
  } catch (error) {
    console.error('Error checking leave slot:', error);
    return false;
  }
};

// Static method to create leave slots for a date range
leaveSlotSchema.statics.createSlotsForLeave = async function(leaveRequestId, studentId, batchId, fromDate, toDate) {
  try {
    const AttendanceSlot = mongoose.model('AttendanceSlot');

    // Find all attendance slots in the date range for the batch
    const slots = await AttendanceSlot.find({
      batch: batchId,
      date: {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      },
      isActive: true
    });

    if (slots.length === 0) {
      return [];
    }

    // Create leave slots for each attendance slot
    const leaveSlots = slots.map(slot => ({
      leaveRequestId,
      studentId,
      batchId,
      attendanceSlotId: slot._id,
      date: slot.date,
      status: 'blocked'
    }));

    // Insert all leave slots
    const createdSlots = await this.insertMany(leaveSlots, { ordered: false });
    return createdSlots;
  } catch (error) {
    // Ignore duplicate key errors (slot already blocked)
    if (error.code === 11000) {
      console.log('Some slots already blocked for this student');
      return [];
    }
    console.error('Error creating leave slots:', error);
    throw error;
  }
};

// Static method to update leave slot status when request is approved
leaveSlotSchema.statics.approveLeaveSlots = async function(leaveRequestId) {
  try {
    const result = await this.updateMany(
      { leaveRequestId, status: 'blocked' },
      { $set: { status: 'on_leave' } }
    );
    return result;
  } catch (error) {
    console.error('Error approving leave slots:', error);
    throw error;
  }
};

// Static method to cancel future leave slots when leave is cancelled
leaveSlotSchema.statics.cancelFutureSlots = async function(leaveRequestId) {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await this.updateMany(
      {
        leaveRequestId,
        date: { $gte: now },
        status: 'on_leave'
      },
      { $set: { status: 'cancelled' } }
    );
    return result;
  } catch (error) {
    console.error('Error cancelling future leave slots:', error);
    throw error;
  }
};

// Static method to delete leave slots when request is deleted/rejected
leaveSlotSchema.statics.deleteLeaveSlots = async function(leaveRequestId) {
  try {
    const result = await this.deleteMany({ leaveRequestId });
    return result;
  } catch (error) {
    console.error('Error deleting leave slots:', error);
    throw error;
  }
};

module.exports = mongoose.model('LeaveSlot', leaveSlotSchema);
