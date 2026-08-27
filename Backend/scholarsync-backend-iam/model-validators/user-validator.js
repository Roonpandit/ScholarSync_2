import Joi from 'joi';
import { getErrorMessage, REGEX_PATTERNS } from 'scholarsync-backend-common';

const objectId = Joi.string()
	.pattern(REGEX_PATTERNS.UUID)
	.messages({
		'string.pattern.base': getErrorMessage('2007', {}, 'id'),
	});

const updateUserSchema = Joi.object({
	name: Joi.string()
		.trim()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'name' }, 'name'),
		}),
	email: Joi.string()
		.email()
		.optional()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
		}),
	studentCode: Joi.string()
		.trim()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'studentCode' }, 'studentCode'),
		}),
	teacherCode: Joi.string()
		.trim()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'teacherCode' }, 'teacherCode'),
		}),
	phone: Joi.string()
		.pattern(REGEX_PATTERNS.MOBILE)
		.optional()
		.messages({
			'string.pattern.base': getErrorMessage('2005', { fieldName: 'phone' }, 'phone'),
		}),
	lectures: Joi.array()
		.items(objectId)
		.min(1)
		.optional()
		.messages({
			'array.min': getErrorMessage('2009', { fieldName: 'lectures', limit: '1' }, 'lectures'),
			'array.base': getErrorMessage('2008', { fieldName: 'lectures' }, 'lectures'),
		}),
}).min(1)
	.messages({
		'object.min': getErrorMessage('2012', {}, 'body'),
	});

const queryLectureIdSchema = Joi.object({
	lectureId: objectId.optional(),
});

export {
	updateUserSchema,
	queryLectureIdSchema,
};
