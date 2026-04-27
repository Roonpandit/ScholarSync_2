import Joi from 'joi';
import { getErrorMessage } from 'scholarsync-backend-common';

const welcomeEmailSchema = Joi.object({
	name: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.empty': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
		}),
	email: Joi.string()
		.email()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
			'string.empty': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
	role: Joi.string()
		.valid('student', 'teacher')
		.default('student')
		.messages({
			'any.only': getErrorMessage('2006', { fieldName: 'role', values: 'student, teacher' }, 'role'),
		}),
	studentCode: Joi.string()
		.trim()
		.when('role', {
			is: 'student',
			then: Joi.required(),
			otherwise: Joi.optional(),
		})
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentCode' }, 'studentCode'),
			'string.empty': getErrorMessage('2001', { fieldName: 'studentCode' }, 'studentCode'),
		}),
	teacherCode: Joi.string()
		.trim()
		.when('role', {
			is: 'teacher',
			then: Joi.required(),
			otherwise: Joi.optional(),
		})
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'teacherCode' }, 'teacherCode'),
			'string.empty': getErrorMessage('2001', { fieldName: 'teacherCode' }, 'teacherCode'),
		}),
	phone: Joi.string()
		.optional()
		.allow('', null)
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'phone' }, 'phone'),
		}),
});

const passwordResetEmailSchema = Joi.object({
	email: Joi.string()
		.email()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
			'string.empty': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
	name: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.empty': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
		}),
	resetToken: Joi.string()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'resetToken' }, 'resetToken'),
			'string.empty': getErrorMessage('2001', { fieldName: 'resetToken' }, 'resetToken'),
		}),
});

const passwordResetConfirmationSchema = Joi.object({
	email: Joi.string()
		.email()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
			'string.empty': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
	name: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.empty': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
		}),
});

const absentNotificationSchema = Joi.object({
	studentName: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentName' }, 'studentName'),
			'string.empty': getErrorMessage('2001', { fieldName: 'studentName' }, 'studentName'),
		}),
	studentEmail: Joi.string()
		.email()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'studentEmail' }, 'studentEmail'),
			'any.required': getErrorMessage('2001', { fieldName: 'studentEmail' }, 'studentEmail'),
			'string.empty': getErrorMessage('2001', { fieldName: 'studentEmail' }, 'studentEmail'),
		}),
	lectureName: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'lectureName' }, 'lectureName'),
			'string.empty': getErrorMessage('2001', { fieldName: 'lectureName' }, 'lectureName'),
		}),
	date: Joi.string()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'date' }, 'date'),
			'string.empty': getErrorMessage('2001', { fieldName: 'date' }, 'date'),
		}),
	shift: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'shift' }, 'shift'),
			'string.empty': getErrorMessage('2001', { fieldName: 'shift' }, 'shift'),
		}),
	slotTime: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'slotTime' }, 'slotTime'),
			'string.empty': getErrorMessage('2001', { fieldName: 'slotTime' }, 'slotTime'),
		}),
	markedAt: Joi.string()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'markedAt' }, 'markedAt'),
			'string.empty': getErrorMessage('2001', { fieldName: 'markedAt' }, 'markedAt'),
		}),
	location: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'location' }, 'location'),
			'string.empty': getErrorMessage('2001', { fieldName: 'location' }, 'location'),
		}),
	photoUrl: Joi.string()
		.optional()
		.allow('', null),
	remark: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'remark' }, 'remark'),
			'string.empty': getErrorMessage('2001', { fieldName: 'remark' }, 'remark'),
		}),
	updatedByName: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'updatedByName' }, 'updatedByName'),
			'string.empty': getErrorMessage('2001', { fieldName: 'updatedByName' }, 'updatedByName'),
		}),
	updatedByRole: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'updatedByRole' }, 'updatedByRole'),
			'string.empty': getErrorMessage('2001', { fieldName: 'updatedByRole' }, 'updatedByRole'),
		}),
});

const feedbackEmailsSchema = Joi.object({
	feedbackLink: Joi.string()
		.uri()
		.required()
		.messages({
			'string.uri': getErrorMessage('2002', { fieldName: 'feedbackLink' }, 'feedbackLink'),
			'any.required': getErrorMessage('2001', { fieldName: 'feedbackLink' }, 'feedbackLink'),
			'string.empty': getErrorMessage('2001', { fieldName: 'feedbackLink' }, 'feedbackLink'),
		}),
	studentIds: Joi.array()
		.items(Joi.string().required())
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentIds' }, 'studentIds'),
			'array.min': getErrorMessage('2009', { fieldName: 'studentIds', limit: '1' }, 'studentIds'),
			'array.base': getErrorMessage('2008', { fieldName: 'studentIds' }, 'studentIds'),
		}),
});

export {
	welcomeEmailSchema,
	passwordResetEmailSchema,
	passwordResetConfirmationSchema,
	absentNotificationSchema,
	feedbackEmailsSchema,
};
