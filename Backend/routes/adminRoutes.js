const express = require('express');
const {
  createStudent,
  getAllStudents,
  createAttendanceSlot,
  getAllAttendanceSlots,
  closeAttendanceSlot,
  getAttendanceByDate,
  getAttendanceStats,
  getAbsentStudents
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes in this router
router.use(protect);
router.use(authorize('admin'));

// Student management routes
router.route('/students')
  .post(createStudent)
  .get(getAllStudents);

// Attendance slot management routes
router.route('/attendance-slots')
  .post(createAttendanceSlot)
  .get(getAllAttendanceSlots);

router.put('/attendance-slots/:id/close', closeAttendanceSlot);

// Attendance records routes
router.get('/attendance', getAttendanceByDate);
router.get('/attendance/stats', getAttendanceStats);
router.get('/attendance/absent', getAbsentStudents);

module.exports = router;