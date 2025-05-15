const mongoose = require('mongoose');

// Helper to ensure dates are stored in UTC
const toUTCDate = (date) => {
  if (!date) return date;
  return new Date(date.toISOString());
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
      set: toUTCDate
    },
    startTime: {
      type: Date,
      required: [true, 'Please add a start time'],
      set: toUTCDate
    },
    endTime: {
      type: Date,
      required: [true, 'Please add an end time'],
      set: toUTCDate
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
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
attendanceSlotSchema.index({ date: 1, shift: 1 });
attendanceSlotSchema.index({ isActive: 1 });

module.exports = mongoose.model('AttendanceSlot', attendanceSlotSchema);