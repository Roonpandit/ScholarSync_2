import express from 'express';
const router = express.Router();
import { protect, authorize } from 'scholarsync-backend-common';
import { ROUTES } from '../../constants/route-constants.js';

import notificationController from '../controller/notification-controller.js';

// Internal service-to-service routes (no auth - called by other backend services)
router.post(ROUTES.WELCOME_EMAIL, (req, res, next) => notificationController.sendWelcomeEmail(req, res, next));
router.post(ROUTES.PASSWORD_RESET_EMAIL, (req, res, next) => notificationController.sendPasswordResetEmail(req, res, next));
router.post(ROUTES.PASSWORD_RESET_CONFIRMATION, (req, res, next) => notificationController.sendPasswordResetConfirmation(req, res, next));
router.post(ROUTES.ABSENT_NOTIFICATION, (req, res, next) => notificationController.sendAbsentNotification(req, res, next));

// User-facing route (requires auth)
router.post(ROUTES.FEEDBACK_EMAILS, protect, authorize('admin', 'teacher'), (req, res, next) => notificationController.sendFeedbackEmails(req, res, next));

export default router;
