const mongoose = require('mongoose');
const { getCurrentDateIST } = require('../services/timeUtils');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      required: true
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSlot',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    shift: {
      type: String,
      required: true,
      enum: ['morning', 'afternoon', 'evening'],
    },
    photo: {
      url: {
        type: String,
        required: [true, 'Photo URL is required'],
      },
      public_id: {
        type: String,
        required: [true, 'Photo public ID is required'],
      },
      format: String,
      width: Number,
      height: Number
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Please provide location coordinates'],
      },
      address: String,
    },
    markedAt: {
      type: Date,
      default: function() {
        return getCurrentDateIST();
      }
    },
    studentCode: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
attendanceSchema.index({ student: 1, date: 1, shift: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ slot: 1 });
attendanceSchema.index({ studentCode: 1 });

// Add a 2dsphere index for geospatial queries
attendanceSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Attendance', attendanceSchema);