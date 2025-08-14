const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/Student');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is still in the database
    let user = await User.findById(decoded.id);
    
    if (!user) {
      // Try to find admin
      user = await Admin.findById(decoded.id);
      
      if (!user) {
        // Try to find teacher
        user = await Teacher.findById(decoded.id);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // If route is for admin/teacher only, check role
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    
    // Check for delete operations by teachers
    if (req.user.role === 'teacher' && req.method === 'DELETE') {
      return res.status(403).json({
        success: false,
        message: 'Teachers are not authorized to perform delete operations',
      });
    }
    
    next();
  };
};

// Middleware to restrict route to admin only
exports.restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only administrators are allowed to perform this action',
    });
  }
  next();
};