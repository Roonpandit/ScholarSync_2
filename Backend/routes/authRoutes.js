const express = require('express');
const {
  registerStudent,
  login,
  getMe,
  seedAdmin,
  updatePassword
} = require('../controllers/authController');
const {
  forgotPassword,
  resetPassword
} = require('../controllers/passwordController');
const { checkEmailExists } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/seed-admin', seedAdmin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/check-email', checkEmailExists);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.post('/register', protect, authorize('admin'), registerStudent);

module.exports = router;