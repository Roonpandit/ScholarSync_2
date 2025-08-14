const express = require('express');
const {
  // Student Management
  createStudent,
  createStudentsBulk,
  getAllStudents,
  getStudentsByClass,
  updateStudent,
  getStudentDetailsWithAttendance,
  
  // Attendance Management
  createAttendanceSlot,
  getAllAttendanceSlots,
  closeAttendanceSlot,
  getAttendanceByDate,
  getAttendanceBySlot,
  markAttendance,
  getAttendanceStats,
  getAbsentStudents,
  getAttendanceDetails
} = require('../controllers/adminController');

const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// Only teachers can access these routes
router.use(authorize('teacher'));

// ========== STUDENT MANAGEMENT ==========
// Create and view students
router.route('/students')
  .post(createStudent)       // Create student
  .get(getAllStudents);      // Get all students

// Bulk student creation
router.post('/students/bulk', createStudentsBulk);

// Get students by class
router.get('/students/class', getStudentsByClass);

// Update student (but not delete)
router.route('/students/:id')
  .put(updateStudent)        // Update student
  .get(getStudentDetailsWithAttendance);  // Get student details with attendance

// ========== ATTENDANCE MANAGEMENT ==========
// Attendance slots
router.route('/attendance-slots')
  .post(createAttendanceSlot)    // Create slot
  .get(getAllAttendanceSlots);   // Get all slots

// Close slot (but not delete)
router.put('/attendance-slots/:id/close', closeAttendanceSlot);

// Attendance records
router.get('/attendance', getAttendanceByDate);
router.get('/attendance/slot/:slotId', getAttendanceBySlot);
router.post('/attendance/mark', markAttendance);

// Attendance reports
router.get('/attendance/stats', getAttendanceStats);
router.get('/attendance/absent', getAbsentStudents);
router.get('/attendance/details', getAttendanceDetails);

module.exports = router;
