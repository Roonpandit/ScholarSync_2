const express = require('express');
const {
  getActiveAttendanceSlots,
  markAttendance,
  getAttendanceHistory,
  getAbsenceHistory,
  uploadAttendancePhoto,
  getStudentsByClass,
  checkEmailExists
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes in this router
router.use(protect);

// Public routes (no authentication required)
router.get('/check-email', checkEmailExists);

// Apply student authorization to all routes except getStudentsByClass
router.use((req, res, next) => {
  // Skip authorization for getStudentsByClass
  if (req.path === '/class') {
    return next();
  }
  authorize('student')(req, res, next);
});

// Attendance related routes
router.get('/attendance-slots', getActiveAttendanceSlots);
router.post('/attendance', uploadAttendancePhoto, markAttendance);
router.get('/attendance', getAttendanceHistory);
router.get('/absences', getAbsenceHistory);

// Get students by class ID (accessible to both admin and students)
router.get('/class', getStudentsByClass);

module.exports = router;