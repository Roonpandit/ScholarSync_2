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
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
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
    status: {
      type: String,
      enum: ['pending', 'awaiting_approval', 'present', 'absent'],
      default: 'pending',
      required: true
    },
    photo: {
      url: {
        type: String,
        required: function() {
          return this.status === 'present';
        }
      },
      public_id: {
        type: String,
        required: function() {
          return this.status === 'present';
        }
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
        required: function() {
          return this.status === 'present';
        }
      },
      address: String,
    },
    markedAt: {
      type: Date,
      default: Date.now
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
    },
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    remark: {
      type: String,
      required: false,
      maxlength: 1000,
    },
    statusUpdatedAt: {
      type: Date,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
attendanceSchema.index({ student: 1, slot: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ slot: 1 });
attendanceSchema.index({ batch: 1 });
attendanceSchema.index({ studentCode: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ slot: 1, status: 1 });
attendanceSchema.index({ statusUpdatedBy: 1 });

// Add a 2dsphere index for geospatial queries
attendanceSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Attendance', attendanceSchema);