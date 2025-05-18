const mongoose = require('mongoose');

// Helper to convert IST time to UTC
const toUTCDate = (date) => {
  if (!date) return null;
  
  // If it's a string, try to parse it
  if (typeof date === 'string') {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      // Convert to UTC by subtracting IST offset
      return new Date(d.getTime() - (5.5 * 60 * 60 * 1000));
    }
    return null;
  }
  
  // If it's already a Date object
  if (date instanceof Date) {
    if (!isNaN(date.getTime())) {
      // Convert to UTC by subtracting IST offset
      return new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
    }
    return null;
  }
  
  return null;
};

// Helper to convert UTC to IST
const toISTDate = (date) => {
  if (!date) return null;
  
  // If it's already a Date object
  if (date instanceof Date) {
    if (!isNaN(date.getTime())) {
      // Convert to IST by adding IST offset
      return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    }
    return null;
  }
  
  return null;
};

const attendanceSlotSchema = new mongoose.Schema(
  {
    shift: {
      type: String,
      required: [true, 'Please add a shift'],
      enum: ['morning', 'afternoon', 'evening'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
      validate: {
        validator: function(value) {
          if (!value) return false;
          if (!(value instanceof Date)) return false;
          if (isNaN(value.getTime())) return false;
          return true;
        },
        message: 'Invalid date format. Please provide a valid date string or Date object'
      },
      set: function(value) {
        try {
          const utcDate = toUTCDate(value);
          if (!utcDate) throw new Error('Invalid date value');
          return utcDate;
        } catch (error) {
          console.error('Error converting date:', error);
          throw new Error('Invalid date value: ' + error.message);
        }
      },
      get: toISTDate
    },
    startTime: {
      type: Date,
      required: [true, 'Please add a start time'],
      validate: {
        validator: function(value) {
          if (!value) return false;
          if (!(value instanceof Date)) return false;
          if (isNaN(value.getTime())) return false;
          return true;
        },
        message: 'Invalid start time format. Please provide a valid time string or Date object'
      },
      set: function(value) {
        const utcDate = toUTCDate(value);
        if (!utcDate) throw new Error('Invalid start time value');
        return utcDate;
      },
      get: toISTDate
    },
    endTime: {
      type: Date,
      required: [true, 'Please add an end time'],
      validate: {
        validator: function(value) {
          if (!value) return false;
          if (!(value instanceof Date)) return false;
          if (isNaN(value.getTime())) return false;
          return true;
        },
        message: 'Invalid end time format. Please provide a valid time string or Date object'
      },
      set: function(value) {
        const utcDate = toUTCDate(value);
        if (!utcDate) throw new Error('Invalid end time value');
        return utcDate;
      },
      get: toISTDate
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    notified: {
      type: Boolean,
      default: false
    },
    notificationSentAt: {
      type: Date
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
attendanceSlotSchema.index({ date: 1, shift: 1 });
attendanceSlotSchema.index({ isActive: 1 });

module.exports = mongoose.model('AttendanceSlot', attendanceSlotSchema);