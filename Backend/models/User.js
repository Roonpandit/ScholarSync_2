const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    studentCode: {
      type: String,
      required: [true, 'Please add a student code'],
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone) {
          // Validate Indian phone number format
          return /^\d{10}$/.test(phone);
        },
        message: 'Please enter a valid 10-digit phone number'
      }
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 8,
      validate: {
        validator: function(password) {
          // Check for uppercase letters
          const hasUpperCase = /[A-Z]/.test(password);
          // Check for lowercase letters
          const hasLowerCase = /[a-z]/.test(password);
          // Check for numbers
          const hasNumber = /[0-9]/.test(password);
          // Check for special characters
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          
          // Password must be at least 8 characters and meet all criteria
          return (password.length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar);
        },
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*(),.?":{}|<>)'
      },
      select: false,
    },
    role: {
      type: String,
      enum: ['student'],
      default: 'student',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);