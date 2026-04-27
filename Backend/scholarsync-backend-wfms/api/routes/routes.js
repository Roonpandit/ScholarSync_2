import express from 'express';
const router = express.Router();
import multer from 'multer';
import { protect, authorize } from 'scholarsync-backend-common';
import { ROUTES } from '../../constants/route-constants.js';

import attendanceController from '../controller/attendance-controller.js';
import leaveController from '../controller/leave-controller.js';
import lectureController from '../controller/lecture-controller.js';

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new Error('Not an image!'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ========== ATTENDANCE SLOTS ==========
router.post(ROUTES.ATTENDANCE_SLOTS, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.createAttendanceSlot(req, res, next));
router.get(ROUTES.ATTENDANCE_SLOTS, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.getAllAttendanceSlots(req, res, next));
router.put(ROUTES.ATTENDANCE_SLOT_CLOSE, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.closeAttendanceSlot(req, res, next));
router.delete(ROUTES.ATTENDANCE_SLOT_BY_ID, protect, authorize('admin'), (req, res, next) => attendanceController.deleteAttendanceSlot(req, res, next));

// ========== STUDENT ATTENDANCE ==========
router.get(ROUTES.STUDENT_ATT_SLOTS, protect, authorize('student'), (req, res, next) => attendanceController.getActiveAttendanceSlots(req, res, next));
router.post(ROUTES.STUDENT_ATTENDANCE, protect, authorize('student'), upload.single('photo'), (req, res, next) => attendanceController.markStudentAttendance(req, res, next));
router.get(ROUTES.STUDENT_ATTENDANCE, protect, authorize('student'), (req, res, next) => attendanceController.getAttendanceHistory(req, res, next));
router.get(ROUTES.STUDENT_ATT_COUNTS, protect, (req, res, next) => attendanceController.getStudentAttendanceCounts(req, res, next));

// ========== ADMIN/TEACHER ATTENDANCE ==========
router.get(ROUTES.ATTENDANCE, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.getAttendance(req, res, next));
router.post(ROUTES.ATTENDANCE_MARK, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.markAttendance(req, res, next));
router.get(ROUTES.ATTENDANCE_ABSENT, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.getAbsentStudents(req, res, next));
router.get(ROUTES.ATTENDANCE_DETAILS, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.getAttendanceDetails(req, res, next));
router.post(ROUTES.ATTENDANCE_MARK_ABSENT, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.markAttendanceAsAbsent(req, res, next));
router.post(ROUTES.ATTENDANCE_STATUS, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.updateAttendanceStatus(req, res, next));
router.get(ROUTES.ATTENDANCE_STATS, protect, authorize('admin', 'teacher'), (req, res, next) => attendanceController.getAttendanceStats(req, res, next));

// ========== LEAVE - STUDENT ==========
router.post(ROUTES.LEAVE_APPLY, protect, authorize('student'), (req, res, next) => leaveController.applyLeave(req, res, next));
router.get(ROUTES.LEAVE_MY_REQUESTS, protect, authorize('student'), (req, res, next) => leaveController.getMyLeaveRequests(req, res, next));
router.get(ROUTES.LEAVE_CHECK_SLOT, protect, (req, res, next) => leaveController.checkLeaveForSlot(req, res, next));
router.get(ROUTES.LEAVE_DETAILS_BY_ID, protect, (req, res, next) => leaveController.getLeaveDetailsForAttendance(req, res, next));
router.get(ROUTES.LEAVE_BY_ID, protect, (req, res, next) => leaveController.getLeaveRequestDetails(req, res, next));
router.delete(ROUTES.LEAVE_BY_ID, protect, authorize('student'), (req, res, next) => leaveController.deleteLeaveRequest(req, res, next));

// ========== LEAVE - MANAGE (approve/reject/resend/cancel) ==========
router.post(ROUTES.LEAVE_MANAGE, protect, (req, res, next) => leaveController.manageLeaveRequest(req, res, next));

// ========== LEAVE - TEACHER/ADMIN LIST ==========
router.get(ROUTES.LEAVE_LIST, protect, authorize('admin', 'teacher'), (req, res, next) => leaveController.getLeaveRequests(req, res, next));

// ========== LECTURES ==========
router.get(ROUTES.LECTURES, protect, (req, res, next) => lectureController.getAllLectures(req, res, next));
router.get(ROUTES.LECTURE_BY_ID, protect, authorize('admin'), (req, res, next) => lectureController.getLectureById(req, res, next));
router.get(ROUTES.LECTURE_STUDENTS, protect, authorize('admin'), (req, res, next) => lectureController.getStudentsByLecture(req, res, next));
router.get(ROUTES.LECTURE_TEACHER, protect, authorize('student'), (req, res, next) => lectureController.getTeacherForLecture(req, res, next));
router.post(ROUTES.LECTURES, protect, authorize('admin'), (req, res, next) => lectureController.createLecture(req, res, next));
router.put(ROUTES.LECTURE_BY_ID, protect, authorize('admin'), (req, res, next) => lectureController.updateLecture(req, res, next));
router.delete(ROUTES.LECTURE_BY_ID, protect, authorize('admin'), (req, res, next) => lectureController.deleteLecture(req, res, next));

export default router;
