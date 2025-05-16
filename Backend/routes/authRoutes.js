const express = require('express');
const {
  registerStudent,
  login,
  getMe,
  seedAdmin,
  updatePassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/seed-admin', seedAdmin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.post('/register', protect, authorize('admin'), registerStudent);

module.exports = router;