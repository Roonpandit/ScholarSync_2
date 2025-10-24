const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a batch name'],
      trim: true,
      minlength: [3, 'Batch name must be at least 3 characters long']
    },
    batchId: {
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
batchSchema.index({ batchId: 1 });
batchSchema.index({ isDefault: 1 });
batchSchema.index({ isActive: 1 });

// Prevent deletion of default batch
batchSchema.pre('remove', function(next) {
  if (this.isDefault) {
    const error = new Error('Cannot delete the default batch');
    return next(error);
  }
  next();
});

// Prevent deletion of default batch using findOneAndDelete
batchSchema.pre('findOneAndDelete', async function(next) {
  const docToDelete = await this.model.findOne(this.getQuery());
  if (docToDelete && docToDelete.isDefault) {
    const error = new Error('Cannot delete the default batch');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Batch', batchSchema);
