const express = require('express');
const {
  createLecture,
  getAllLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
  getDefaultLecture,
  getStudentsByLecture,
  assignLecturesToStudents,
  unassignLecturesFromStudents,
  getNonDefaultLectures,
  getTeacherForLecture
} = require('../controllers/lectureController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin-only routes for lecture data
router.get('/', authorize('admin'), getAllLectures);
router.get('/default/info', authorize('admin'), getDefaultLecture);

// Student routes for leave management (must be before /:id routes)
router.get('/non-default', authorize('student'), getNonDefaultLectures);

router.get('/:id', authorize('admin'), getLectureById);
router.get('/:id/students', authorize('admin'), getStudentsByLecture);
router.get('/:lectureId/teacher', authorize('student'), getTeacherForLecture);

// Lecture-Student assignment (Admin only - teachers cannot assign/unassign lectures)
router.post('/assign', authorize('admin'), assignLecturesToStudents);
router.post('/unassign', authorize('admin'), unassignLecturesFromStudents);

// Admin-only routes
router.post('/', authorize('admin'), createLecture);
router.put('/:id', authorize('admin'), updateLecture);
router.delete('/:id', authorize('admin'), deleteLecture);

module.exports = router;
