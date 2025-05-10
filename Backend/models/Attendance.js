const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      type: String,
      required: [true, 'Please upload a photo'],
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
      default: Date.now,
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