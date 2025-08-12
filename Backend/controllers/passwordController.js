const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../services/reset_password_mail');

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    const emailResult = await sendPasswordResetEmail(user.email, user.name, resetToken);
    
    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: `Password reset link has been sent to ${user.email}`,
      });
    } else {
      throw new Error(emailResult.error || 'Failed to send password reset email');
    }
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent',
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Validate password format
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*(),.?":{}|<>)',
    });
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  try {
    // Check if new password is same as current password
    const isSamePassword = await user.matchPassword(password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password',
      });
    }
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return res.status(400).json({
      success: false,
      message: 'Error validating password. Please try again.',
    });
  }

  // Set new password (hashing is handled by the pre-save hook in the User model)
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  try {
    // Save the user (validations and password hashing will be handled by the pre-save hook)
    await user.save({ validateBeforeSave: true });
    
    // Send password reset confirmation email
    await sendPasswordResetConfirmation(user.email, user.name);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (err) {
    console.error('Error in password reset confirmation:', err);
    // Still return success since password was reset, just the email failed
    res.status(200).json({
      success: true,
      message: 'Password reset successful, but could not send confirmation email',
    });
  }
});
