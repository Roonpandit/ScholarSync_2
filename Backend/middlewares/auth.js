const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/Student');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const AllowedIP = require('../models/AllowedIP');
const IPSettings = require('../models/IPSettings');

// Helper function to get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
};

// Helper function to check if IP is allowed for students
const checkIPRestriction = async (user, req) => {
  // Only apply IP restriction to students
  if (user.role !== 'student') {
    return { allowed: true };
  }

  // Check if IP restriction is enabled
  const ipSettings = await IPSettings.findOne();

  // If IP restriction is disabled, allow access
  if (!ipSettings || !ipSettings.isEnabled) {
    return { allowed: true };
  }

  // Get all allowed IPs
  const allowedIPs = await AllowedIP.find();

  // If no IPs configured, allow access
  if (allowedIPs.length === 0) {
    return { allowed: true };
  }

  // Get client IP and normalize it
  const clientIP = getClientIP(req);
  const normalizedClientIP = clientIP === '::1' ? '127.0.0.1' : clientIP.replace(/^::ffff:/, '');

  // Check if client IP is in allowed list
  const isAllowed = allowedIPs.some(allowed => allowed.ipAddress === normalizedClientIP);

  return {
    allowed: isAllowed,
    clientIP: normalizedClientIP
  };
};

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

    // IP RESTRICTION CHECK - For students only
    if (user.role === 'student') {
      // If token has sessionIP, verify it matches current IP
      if (decoded.sessionIP) {
        const currentIP = getClientIP(req);
        const normalizedCurrentIP = currentIP === '::1' ? '127.0.0.1' : currentIP.replace(/^::ffff:/, '');

        // If IP has changed, force logout
        if (decoded.sessionIP !== normalizedCurrentIP) {
          return res.status(401).json({
            success: false,
            message: 'Session expired. Your IP address has changed. Please login again.',
            reason: 'IP_CHANGE_DETECTED',
            requiresLogin: true
          });
        }
      } else {
        // Token doesn't have sessionIP (older token or IP restriction was disabled during login)
        // Still check current IP against allowed list
        const ipCheck = await checkIPRestriction(user, req);

        if (!ipCheck.allowed) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not authorized to access from outside your institute.',
            reason: 'IP_RESTRICTION_VIOLATION',
            requiresLogin: true
          });
        }
      }
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
        message: `${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} is not authorized to access this route`,
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