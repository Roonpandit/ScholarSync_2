const mongoose = require('mongoose');

const ipSettingsSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('IPSettings', ipSettingsSchema);
