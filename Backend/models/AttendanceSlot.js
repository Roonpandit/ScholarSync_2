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
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: [true, 'Please specify a lecture for this slot']
    },
    emailSent: {
      type: Boolean,
      default: false
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
attendanceSlotSchema.index({ lecture: 1 });
attendanceSlotSchema.index({ lecture: 1, status: 1 });

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
  try {
    const slots = await this.find();
    const updatePromises = slots.map(slot => {
      const newStatus = slot.calculateStatus();
      if (slot.status !== newStatus) {
        return this.findByIdAndUpdate(
          slot._id,
          { status: newStatus },
          { new: true }
        ).catch(error => {
          console.error(`Error updating slot ${slot._id}:`, error.message);
          return null; // Skip this slot if there's an error
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error in updateAllStatuses:', error);
  }
};

module.exports = AttendanceSlot;