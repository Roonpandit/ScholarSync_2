const express = require('express');
const {
  checkLeaveForSlot,
  getLeaveDetailsForAttendance
} = require('../controllers/leaveController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Helper routes for attendance integration
router.get('/check-slot', checkLeaveForSlot);
router.get('/details/:leaveRequestId', getLeaveDetailsForAttendance);

module.exports = router;
