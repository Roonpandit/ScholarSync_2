import Joi from 'joi';
import { getErrorMessage } from 'scholarsync-backend-common';
import { LECTURE_ACTIONS } from '../constants/application-constants.js';

const objectId = Joi.string()
	.regex(/^[0-9a-fA-F]{24}$/)
	.messages({
		'string.pattern.base': getErrorMessage('2007', {}, 'id'),
	});

const manageLecturesSchema = Joi.object({
	action: Joi.string()
		.valid(...Object.values(LECTURE_ACTIONS))
		.required()
		.messages({
			'any.only': getErrorMessage('2006', { fieldName: 'action', values: Object.values(LECTURE_ACTIONS).join(', ') }, 'action'),
			'any.required': getErrorMessage('2001', { fieldName: 'action' }, 'action'),
		}),
	lectureIds: Joi.array()
		.items(objectId)
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'lectureIds' }, 'lectureIds'),
			'array.min': getErrorMessage('2009', { fieldName: 'lectureIds', limit: '1' }, 'lectureIds'),
			'array.base': getErrorMessage('2008', { fieldName: 'lectureIds' }, 'lectureIds'),
		}),
	studentIds: Joi.array()
		.items(objectId)
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentIds' }, 'studentIds'),
			'array.min': getErrorMessage('2009', { fieldName: 'studentIds', limit: '1' }, 'studentIds'),
			'array.base': getErrorMessage('2008', { fieldName: 'studentIds' }, 'studentIds'),
		}),
});

export { manageLecturesSchema };
