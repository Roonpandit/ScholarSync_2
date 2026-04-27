import express from 'express';
const router = express.Router();
import { protect, authorize } from 'scholarsync-backend-common';
import { ROUTES } from '../../constants/route-constants.js';

import reportController from '../controller/report-controller.js';

router.get(ROUTES.STUDENT_DETAILS, protect, authorize('admin', 'teacher'), (req, res, next) => reportController.getStudentDetailsWithAttendance(req, res, next));
router.get(ROUTES.ATTENDANCE_DETAILS, protect, authorize('admin', 'teacher'), (req, res, next) => reportController.getAttendanceDetails(req, res, next));
router.get(ROUTES.ATTENDANCE_STATS, protect, authorize('admin', 'teacher'), (req, res, next) => reportController.getAttendanceStats(req, res, next));
router.get(ROUTES.LEAVE_STATS, protect, authorize('admin'), (req, res, next) => reportController.getLeaveStats(req, res, next));

export default router;
