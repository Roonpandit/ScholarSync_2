const mongoose = require('mongoose');

const allowedIPSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: [true, 'Please add an IP address'],
      unique: true,
      trim: true,
      validate: {
        validator: function(ip) {
          // Validates IPv4 format (basic validation)
          return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
        },
        message: 'Please enter a valid IPv4 address (e.g., 192.168.1.1)'
      }
    },
    locationName: {
      type: String,
      required: [true, 'Please add a location name'],
      trim: true,
      minlength: [10, 'Location name must be at least 10 characters long']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Create index for faster lookups
allowedIPSchema.index({ ipAddress: 1 });

module.exports = mongoose.model('AllowedIP', allowedIPSchema);
