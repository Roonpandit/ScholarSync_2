import asyncHandler from 'express-async-handler';
import notificationBusiness from '../businessLogic/notification-business.js';

const sendWelcomeEmail = asyncHandler(async (req, res) => {
	const result = await notificationBusiness.sendWelcomeEmail(req.body);
	res.status(result.status).json(result);
});

const sendPasswordResetEmail = asyncHandler(async (req, res) => {
	const result = await notificationBusiness.sendPasswordResetEmail(req.body);
	res.status(result.status).json(result);
});

const sendPasswordResetConfirmation = asyncHandler(async (req, res) => {
	const result = await notificationBusiness.sendPasswordResetConfirmation(req.body);
	res.status(result.status).json(result);
});

const sendAbsentNotification = asyncHandler(async (req, res) => {
	const result = await notificationBusiness.sendAbsentNotification(req.body);
	res.status(result.status).json(result);
});

const sendFeedbackEmails = asyncHandler(async (req, res) => {
	const result = await notificationBusiness.sendFeedbackEmails(req.body);
	res.status(result.status).json(result);
});

export default {
	sendWelcomeEmail,
	sendPasswordResetEmail,
	sendPasswordResetConfirmation,
	sendAbsentNotification,
	sendFeedbackEmails,
};
