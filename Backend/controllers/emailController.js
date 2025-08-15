const User = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Check if email exists in any of the user collections
 * @param   {string} email - The email to check
 * @returns {Promise<{exists: boolean, userType: string|null}>} - Object containing existence status and user type if found
 */
const checkEmailExists = async (email) => {
  // Check in Student collection
  const student = await User.findOne({ email });
  if (student) {
    return { exists: true, userType: 'student' };
  }

  // Check in Teacher collection
  const teacher = await Teacher.findOne({ email });
  if (teacher) {
    return { exists: true, userType: 'teacher' };
  }

  // Check in Admin collection
  const admin = await Admin.findOne({ email });
  if (admin) {
    return { exists: true, userType: 'admin' };
  }

  return { exists: false, userType: null };
};

/**
 * @desc    Middleware to check if email exists in any user collection
 * @route   GET /api/check-email
 * @access  Public
 */
exports.checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const { exists, userType } = await checkEmailExists(email);
  
  res.status(200).json({
    success: true,
    exists,
    userType: exists ? userType : null
  });
});

/**
 * @desc    Middleware to validate email uniqueness across all user collections
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next middleware function
 */
exports.validateEmailUniqueness = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(); // Skip if no email provided (should be handled by required validation)
  }

  const { exists, userType } = await checkEmailExists(email);
  
  if (exists) {
    return res.status(400).json({
      success: false,
      message: `This email is already registered. Please use a different email.`,
    });
  }

  next();
});

module.exports = {
  checkEmailExists,
  ...exports
};
