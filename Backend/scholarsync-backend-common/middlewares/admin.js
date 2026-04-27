import asyncHandler from 'express-async-handler';

// Middleware to verify admin role
const verifyAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
});

export default verifyAdmin;
