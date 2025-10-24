const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const lectureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a lecture name'],
      trim: true,
      minlength: [3, 'Lecture name must be at least 3 characters long']
    },
    lectureId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
      immutable: true
    },
    isDefault: {
      type: Boolean,
      default: false,
      immutable: true // Cannot change default status after creation
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Create index for faster lookups
lectureSchema.index({ lectureId: 1 });
lectureSchema.index({ isDefault: 1 });
lectureSchema.index({ isActive: 1 });

// Prevent deletion of default lecture
lectureSchema.pre('remove', function(next) {
  if (this.isDefault) {
    const error = new Error('Cannot delete the default lecture');
    return next(error);
  }
  next();
});

// Prevent deletion of default lecture using findOneAndDelete
lectureSchema.pre('findOneAndDelete', async function(next) {
  const docToDelete = await this.model.findOne(this.getQuery());
  if (docToDelete && docToDelete.isDefault) {
    const error = new Error('Cannot delete the default lecture');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Lecture', lectureSchema);
