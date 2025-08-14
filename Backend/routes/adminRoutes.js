const express = require('express');
const {
  // Student Management
  createStudent,
  createStudentsBulk,
  getAllStudents,
  getStudentsByClass,
  updateStudent,
  deleteStudent,
  getStudentDetailsWithAttendance,
  
  // Attendance Management
  createAttendanceSlot,
  getAllAttendanceSlots,
  closeAttendanceSlot,
  deleteAttendanceSlot,
  getAttendanceByDate,
  getAttendanceBySlot,
  markAttendance,
  getAttendanceStats,
  getAbsentStudents,
  getAttendanceDetails,
  
  // Teacher Management
  registerTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  
  // Other admin operations
  // ...
} = require('../controllers/adminController');

const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes in this router
router.use(protect);

// All routes in this file are admin-only
router.use(authorize('admin'));

// ========== TEACHER MANAGEMENT ==========
router.route('/teachers')
  .post(registerTeacher)     // Create teacher
  .get(getTeachers);         // Get all teachers

router.route('/teachers/:id')
  .get(getTeacher)           // Get single teacher
  .put(updateTeacher)        // Update teacher
  .delete(deleteTeacher);    // Delete teacher

// ========== STUDENT MANAGEMENT ==========
router.route('/students')
  .post(createStudent)       // Create student
  .get(getAllStudents);      // Get all students

// Bulk student creation
router.post('/students/bulk', createStudentsBulk);

// Get students by class
router.get('/students/class', getStudentsByClass);

// Update/Delete student
router.route('/students/:id')
  .put(updateStudent)        // Update student
  .delete(deleteStudent);    // Delete student

// Get student details with attendance
router.get('/students/:id/details', getStudentDetailsWithAttendance);

// ========== ATTENDANCE MANAGEMENT ==========
// Attendance slots
router.route('/attendance-slots')
  .post(createAttendanceSlot)    // Create slot
  .get(getAllAttendanceSlots);   // Get all slots

// Close/Delete slot
router.put('/attendance-slots/:id/close', closeAttendanceSlot);
router.delete('/attendance-slots/:id', deleteAttendanceSlot);

// Attendance records
router.get('/attendance', getAttendanceByDate);
router.get('/attendance/slot/:slotId', getAttendanceBySlot);
router.post('/attendance/mark', markAttendance);

// Attendance reports
router.get('/attendance/stats', getAttendanceStats);
router.get('/attendance/absent', getAbsentStudents);
router.get('/attendance/details', getAttendanceDetails);

// Get students by class ID
router.get('/students/class', getStudentsByClass);

// Update student details
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Get student details with attendance history
router.get('/students/:id/details', getStudentDetailsWithAttendance);

// Attendance slot management routes
router.route('/attendance-slots')
  .post(createAttendanceSlot) // Both admin and teacher can create slots
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

router.put('/attendance-slots/:id/close', closeAttendanceSlot); // Both admin and teacher can close slots
router.delete('/attendance-slots/:id', deleteAttendanceSlot); // Only admin can delete slots

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

module.exports = router;