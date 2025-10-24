const express = require('express');
const {
  // Student Management
  createStudent,
  createStudentsBulk,
  getAllStudents,
  getStudentsByClass,
  updateStudent,
  getStudentDetailsWithAttendance,
  getStudentAttendanceCounts,
  addBatchesToStudent,

  // Attendance Management
  createAttendanceSlot,
  getAllAttendanceSlots,
  closeAttendanceSlot,
  getAttendanceByDate,
  getAttendanceBySlot,
  markAttendance,
  getAttendanceStats,
  getAbsentStudents,
  getAttendanceDetails,
  markAttendanceAsAbsent,

  // Approve/Reject Attendance
  approveAttendance,
  rejectAttendance,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes in this router
router.use(protect);
router.use(authorize('admin', 'teacher'));

// ========== STUDENT MANAGEMENT ==========
router.route('/students')
  .post(createStudent)
  .get(getAllStudents);

// Bulk student creation route
router.post('/students/bulk', createStudentsBulk);

// Get students by class ID
router.get('/students/class', getStudentsByClass);

// Update student details
router.put('/students/:id', updateStudent);

// Add batches to student
router.post('/students/:id/add-batches', addBatchesToStudent);

// Get student details with attendance history
router.get('/students/:id/details', getStudentDetailsWithAttendance);

// Get student attendance counts with optional filters
router.get('/students/:id/attendance-counts', getStudentAttendanceCounts);

// Attendance slot management routes
router.route('/attendance-slots')
  .post(createAttendanceSlot)
  .get((req, res, next) => {
    //console.log('GET /api/admin/attendance-slots called with query:', req.query);
    //console.log('Headers:', req.headers);
    next();
  }, getAllAttendanceSlots);

// Attendance stats route
router.get('/attendance/stats', (req, res, next) => {
  //console.log('GET /api/admin/attendance/stats called with query:', req.query);
  //console.log('Headers:', req.headers);
  next();
}, getAttendanceStats);

router.put('/attendance-slots/:id/close', closeAttendanceSlot);

// Attendance records routes
router.get('/attendance', (req, res) => {
  // Route to appropriate handler based on query params
  if (req.query.slotId) {
    return getAttendanceBySlot(req, res);
  }
  return getAttendanceByDate(req, res);
});
router.post('/attendance/mark', markAttendance);
router.get('/attendance/absent', getAbsentStudents);
router.get('/attendance/details', getAttendanceDetails);
router.post('/attendance/:id/mark-absent', markAttendanceAsAbsent);
router.post('/attendance/:id/approve', approveAttendance);
router.post('/attendance/:id/reject', rejectAttendance);

module.exports = router;