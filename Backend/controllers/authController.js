const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Admin = require('../models/Admin');

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

// @desc    Login user or admin
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

  // Check for user
  let user = await User.findOne({ email }).select('+password');
  let role = 'student';

  // If no student found, check for admin
  if (!user) {
    user = await Admin.findOne({ email }).select('+password');
    role = 'admin';

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentCode: role === 'student' ? user.studentCode : undefined,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  let user;

  if (req.user.role === 'student') {
    user = await User.findById(req.user._id);
  } else {
    user = await Admin.findById(req.user._id);
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentCode: user.role === 'student' ? user.studentCode : undefined,
    },
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