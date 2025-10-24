const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
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
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher ID is required']
    },

    // Leave Details
    leaveType: {
      type: String,
      enum: ['sick', 'other'],
      required: [true, 'Leave type is required']
    },
    fromDate: {
      type: Date,
      required: [true, 'From date is required']
    },
    toDate: {
      type: Date,
      required: [true, 'To date is required'],
      validate: {
        validator: function(value) {
          return value >= this.fromDate;
        },
        message: 'To date must be greater than or equal to from date'
      }
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters long'],
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },

    // Status Management
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'closed'],
      default: 'pending',
      required: true
    },

    // Rejection Flow
    teacherRemark: {
      type: String,
      trim: true,
      maxlength: [500, 'Teacher remark cannot exceed 500 characters'],
      required: function() {
        return this.status === 'rejected';
      }
    },
    studentRemark: {
      type: String,
      trim: true,
      maxlength: [500, 'Student remark cannot exceed 500 characters']
    },
    rejectedAt: {
      type: Date
    },
    rejectExpiresAt: {
      type: Date
    },

    // Resend Tracking
    resendCount: {
      type: Number,
      default: 0,
      max: [1, 'Cannot resend more than once']
    },
    isResent: {
      type: Boolean,
      default: false
    },
    parentRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveRequest'
    },

    // Approval
    approvedAt: {
      type: Date
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },

    // Cancellation (only for approved leaves)
    cancelledAt: {
      type: Date
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancel reason cannot exceed 500 characters'],
      required: function() {
        return this.status === 'cancelled';
      }
    },
    isCancelled: {
      type: Boolean,
      default: false
    },

    // Timestamps
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
leaveRequestSchema.index({ studentId: 1, status: 1 });
leaveRequestSchema.index({ teacherId: 1, status: 1 });
leaveRequestSchema.index({ batchId: 1, fromDate: 1, toDate: 1 });
leaveRequestSchema.index({ status: 1, rejectExpiresAt: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1 });

// Validate date constraints based on leave type
leaveRequestSchema.pre('validate', function(next) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const fromDate = new Date(this.fromDate);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(this.toDate);
  toDate.setHours(0, 0, 0, 0);

  // Cannot apply leave for past dates
  if (fromDate < now) {
    return next(new Error('Cannot apply leave for past dates'));
  }

  // fromDate must be within 30 days from today
  const maxFutureDate = new Date(now);
  maxFutureDate.setDate(maxFutureDate.getDate() + 30);

  if (fromDate > maxFutureDate) {
    return next(new Error('Cannot apply leave more than 30 days in advance'));
  }

  // Sick leave validations
  if (this.leaveType === 'sick') {
    const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    if (daysDiff > 2) {
      return next(new Error('Sick leave cannot exceed 2 days'));
    }
  }

  // Other leave validations
  if (this.leaveType === 'other') {
    const minAdvanceDate = new Date(now);
    minAdvanceDate.setDate(minAdvanceDate.getDate() + 3);

    if (fromDate < minAdvanceDate) {
      return next(new Error('Other leave must be applied at least 3 days in advance'));
    }
  }

  next();
});

// Method to check if request can be resent
leaveRequestSchema.methods.canResend = function() {
  if (this.status !== 'rejected') return false;
  if (this.resendCount >= 1) return false;
  if (!this.rejectExpiresAt) return false;

  const now = new Date();
  return now <= this.rejectExpiresAt;
};

// Method to check if request can be deleted
leaveRequestSchema.methods.canDelete = function() {
  return this.status === 'pending';
};

// Method to check if request can be cancelled
leaveRequestSchema.methods.canCancel = function() {
  return this.status === 'approved' && !this.isCancelled;
};

// Static method to auto-close expired rejected requests
leaveRequestSchema.statics.autoCloseExpiredRejections = async function() {
  try {
    const now = new Date();
    const result = await this.updateMany(
      {
        status: 'rejected',
        rejectExpiresAt: { $lt: now }
      },
      {
        $set: { status: 'closed' }
      }
    );
    return result;
  } catch (error) {
    console.error('Error auto-closing expired rejections:', error);
    throw error;
  }
};

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
