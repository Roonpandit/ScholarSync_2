const asyncHandler = require('express-async-handler');
const User = require('../models/Student');
const Admin = require('../models/Admin');

// Password validation
const validatePassword = (password) => {
  const errors = [];
  
  // Check length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

// Password validation middleware
const validatePasswordMiddleware = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const errors = validatePassword(password);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password validation failed',
      errors: errors
    });
  }
  
  next();
});

// @desc    Register student (Only for Admin)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.registerStudent = asyncHandler(async (req, res) => {
  const { name, email, studentCode, password } = req.body;

  // Check if student already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { studentCode }] 
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Student with this email or student code already exists',
    });
  }

  // Create new student
  const user = await User.create({
    name,
    email,
    studentCode,
    password,
    role: 'student',
  });

  res.status(201).json({
    success: true,
    message: 'Student registered successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      studentCode: user.studentCode,
      role: user.role,
    },
  });
});

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate new password
  const validationErrors = validatePassword(newPassword);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password validation failed',
      errors: validationErrors
    });
  }

  // Get user
  const user = await User.findById(req.user._id).select('+password');

  // Check if current password is correct
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    // Keep the user's session active
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
      error: 'The current password you entered is incorrect. Please try again.'
    });
  }

  // Check if new password is the same as current password
  const isSamePassword = await user.matchPassword(newPassword);
  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      message: 'Password update failed',
      error: 'New password cannot be the same as the current password'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Login user, teacher or admin
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Check for user in Student collection
  let user = await User.findOne({ email }).select('+password');
  let role = 'student';

  // If not a student, check Teacher collection
  if (!user) {
    const Teacher = require('../models/Teacher');
    user = await Teacher.findOne({ email }).select('+password');
    role = 'teacher';
  }

  // If not a teacher, check Admin collection
  if (!user) {
    user = await Admin.findOne({ email }).select('+password');
    role = 'admin';

    // If no user found in any collection
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User does not exist with this email',
      });
    }
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'You have entered the wrong password',
    });
  }

  // Create token
  const token = user.getSignedJwtToken();

  // Prepare user data for response
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: role,
  };

  // Add role-specific fields
  if (role === 'student') {
    userData.studentCode = user.studentCode;
  } else if (role === 'teacher') {
    userData.teacherCode = user.teacherCode;
  }

  res.status(200).json({
    success: true,
    token,
    user: userData,
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  let user;
  const Teacher = require('../models/Teacher');

  if (req.user.role === 'student') {
    user = await User.findById(req.user._id);
  } else if (req.user.role === 'teacher') {
    user = await Teacher.findById(req.user._id);
  } else {
    user = await Admin.findById(req.user._id);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Prepare user data based on role
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || null,
  };

  // Add role-specific fields
  if (user.role === 'student') {
    userData.studentCode = user.studentCode;
  } else if (user.role === 'teacher') {
    userData.teacherCode = user.teacherCode;
  }

  res.status(200).json({
    success: true,
    data: userData
  });
});

// @desc    Seed admin accounts
// @route   POST /api/auth/seed-admin
// @access  Public (should be restricted in production)
exports.seedAdmin = asyncHandler(async (req, res) => {
  // Check if admin accounts already exist
  const admin1 = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  const admin2 = await Admin.findOne({ email: process.env.ADMIN2_EMAIL });

  if (admin1 && admin2) {
    return res.status(400).json({
      success: false,
      message: 'Both admin accounts already exist',
    });
  }

  let createdAdmins = [];

  // Create admin accounts based on what's missing
  if (!admin1) {
    const newAdmin1 = await Admin.create({
      name: 'Masai Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    });
    createdAdmins.push(newAdmin1);
  }

  if (!admin2) {
    const newAdmin2 = await Admin.create({
      name: 'Elevate Admin',
      email: process.env.ADMIN2_EMAIL,
      password: process.env.ADMIN2_PASSWORD,
      role: 'admin',
    });
    createdAdmins.push(newAdmin2);
  }

  res.status(201).json({
    success: true,
    message: 'Admin accounts created successfully',
    data: createdAdmins.map(admin => ({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    })),
  });
});