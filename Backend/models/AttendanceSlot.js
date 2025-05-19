const mongoose = require('mongoose');

const attendanceSlotSchema = new mongoose.Schema(
  {
    shift: {
      type: String,
      required: [true, 'Please add a shift'],
      enum: ['morning', 'afternoon', 'evening'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date']
    },
    startTime: {
      type: Date,
      required: [true, 'Please add a start time']
    },
    endTime: {
      type: Date,
      required: [true, 'Please add an end time']
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'closed'],
      default: 'upcoming'
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    notified: {
      type: Boolean,
      default: false
    },
    notificationSentAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
attendanceSlotSchema.index({ date: 1, shift: 1 });
attendanceSlotSchema.index({ isActive: 1 });

attendanceSlotSchema.methods.calculateStatus = function() {
  const now = new Date();
  const startTime = this.startTime;
  const endTime = this.endTime;

  if (now < startTime) {
    return 'upcoming';
  } else if (now < endTime) {
    return 'active';
  } else {
    return 'closed';
  }
};

// Add a helper method to get times
attendanceSlotSchema.methods.getTimes = function() {
  return {
    startTime: this.startTime,
    endTime: this.endTime
  };
};

attendanceSlotSchema.pre('save', function(next) {
  this.status = this.calculateStatus();
  next();
});

const AttendanceSlot = mongoose.model('AttendanceSlot', attendanceSlotSchema);

// Add a static method to update status for all slots
AttendanceSlot.updateAllStatuses = async function() {
  const slots = await this.find();
  for (const slot of slots) {
    slot.status = slot.calculateStatus();
    await slot.save();
  }
};

module.exports = AttendanceSlot;