import { STATUS_CODE, sendResponse } from 'scholarsync-backend-common';
import {
	welcomeEmailSchema,
	passwordResetEmailSchema,
	passwordResetConfirmationSchema,
	absentNotificationSchema,
	feedbackEmailsSchema,
} from '../../model-validators/notification-validator.js';
import emailService from '../service/email-service.js';

const sendWelcomeEmail = async (data) => {
	const { error } = welcomeEmailSchema.validate(data);
	if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'sendWelcomeEmail');

	const result = await emailService.sendWelcomeEmail(data);
	if (!result.success) {
		console.error('Welcome email failed:', result.error);
		return sendResponse(STATUS_CODE.INTERNALERROR, { message: result.error || 'Failed to send welcome email' }, 'sendWelcomeEmail');
	}

	return sendResponse(STATUS_CODE.SUCCESS, { code: '5701' }, 'sendWelcomeEmail');
};

const sendPasswordResetEmail = async (data) => {
	const { error } = passwordResetEmailSchema.validate(data);
	if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'sendPasswordResetEmail');

	const { email, name, resetToken } = data;
	const result = await emailService.sendPasswordResetEmail(email, name, resetToken);
	if (!result.success) {
		return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1702' }, 'sendPasswordResetEmail');
	}

	return sendResponse(STATUS_CODE.SUCCESS, { code: '5702' }, 'sendPasswordResetEmail');
};

const sendPasswordResetConfirmation = async (data) => {
	const { error } = passwordResetConfirmationSchema.validate(data);
	if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'sendPasswordResetConfirmation');

	const { email, name } = data;
	const result = await emailService.sendPasswordResetConfirmation(email, name);
	if (!result.success) {
		return sendResponse(STATUS_CODE.INTERNALERROR, { code: '1703' }, 'sendPasswordResetConfirmation');
	}

	return sendResponse(STATUS_CODE.SUCCESS, { code: '5703' }, 'sendPasswordResetConfirmation');
};

const sendAbsentNotification = async (data) => {
	const { error } = absentNotificationSchema.validate(data);
	if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'sendAbsentNotification');

	const result = await emailService.sendAbsentNotification(data);
	return sendResponse(STATUS_CODE.SUCCESS, { code: '5704', result: { messageId: result.messageId } }, 'sendAbsentNotification');
};

const sendFeedbackEmails = async (data) => {
	const { error } = feedbackEmailsSchema.validate(data);
	if (error) return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error.message }, 'sendFeedbackEmails');

	const { feedbackLink, studentIds } = data;
	const result = await emailService.sendFeedbackEmails(feedbackLink, studentIds);
	return sendResponse(STATUS_CODE.SUCCESS, { code: '5705', result: { count: result.count } }, 'sendFeedbackEmails');
};

export default {
	sendWelcomeEmail,
	sendPasswordResetEmail,
	sendPasswordResetConfirmation,
	sendAbsentNotification,
	sendFeedbackEmails,
};
