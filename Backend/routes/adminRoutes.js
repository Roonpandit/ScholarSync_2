const express = require('express');
const {
  createStudent,
  getAllStudents,
  getStudentsByClass,
  createAttendanceSlot,
  getAllAttendanceSlots,
  closeAttendanceSlot,
  getAttendanceByDate,
  getAttendanceBySlot,
  markAttendance,
  getAttendanceStats,
  getAbsentStudents,
  getAttendanceDetails,
  deleteAttendanceSlot
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

// Get students by class ID
router.get('/students/class', getStudentsByClass);

// Attendance slot management routes
router.route('/attendance-slots')
  .post(createAttendanceSlot)
  .get((req, res, next) => {
    console.log('GET /api/admin/attendance-slots called with query:', req.query);
    console.log('Headers:', req.headers);
    next();
  }, getAllAttendanceSlots);

router.put('/attendance-slots/:id/close', closeAttendanceSlot);
router.delete('/attendance-slots/:id', deleteAttendanceSlot);

// Attendance records routes
router.get('/attendance', (req, res) => {
  // Route to appropriate handler based on query params
  if (req.query.slotId) {
    return getAttendanceBySlot(req, res);
  }
  return getAttendanceByDate(req, res);
});
router.post('/attendance/mark', markAttendance);
router.get('/attendance/stats', getAttendanceStats);
router.get('/attendance/absent', getAbsentStudents);
router.get('/attendance/details', getAttendanceDetails);

module.exports = router;