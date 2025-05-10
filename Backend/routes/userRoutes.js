const express = require('express');
const {
  getActiveAttendanceSlots,
  markAttendance,
  getAttendanceHistory,
  getAbsenceHistory,
  uploadAttendancePhoto
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes in this router
router.use(protect);
router.use(authorize('student'));

// Attendance related routes
router.get('/attendance-slots', getActiveAttendanceSlots);
router.post('/attendance', uploadAttendancePhoto, markAttendance);
router.get('/attendance', getAttendanceHistory);
router.get('/absences', getAbsenceHistory);

module.exports = router;