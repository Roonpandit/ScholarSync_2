import Joi from 'joi';
import { getErrorMessage } from 'scholarsync-backend-common';

const uuid = Joi.string()
	.guid({ version: ['uuidv4'] })
	.messages({
		'string.guid': getErrorMessage('2007', {}, 'id'),
	});

const dateFilterSchema = Joi.object({
	year: Joi.number()
		.integer()
		.min(2000)
		.max(2100)
		.optional()
		.messages({
			'number.base': getErrorMessage('2004', { fieldName: 'year' }, 'year'),
		}),
	month: Joi.number()
		.integer()
		.min(1)
		.max(12)
		.optional()
		.messages({
			'number.base': getErrorMessage('2004', { fieldName: 'month' }, 'month'),
		}),
	date: Joi.string()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'date' }, 'date'),
		}),
	startDate: Joi.string()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'startDate' }, 'startDate'),
		}),
	endDate: Joi.string()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'endDate' }, 'endDate'),
		}),
});

const attendanceDetailsSchema = Joi.object({
	studentId: uuid
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentId' }, 'studentId'),
			'string.empty': getErrorMessage('2001', { fieldName: 'studentId' }, 'studentId'),
		}),
	month: Joi.number()
		.integer()
		.min(1)
		.max(12)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'month' }, 'month'),
			'number.base': getErrorMessage('2004', { fieldName: 'month' }, 'month'),
		}),
	year: Joi.number()
		.integer()
		.min(2000)
		.max(2100)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'year' }, 'year'),
			'number.base': getErrorMessage('2004', { fieldName: 'year' }, 'year'),
		}),
});

const attendanceStatsSchema = Joi.object({
	month: Joi.number()
		.integer()
		.min(1)
		.max(12)
		.optional()
		.messages({
			'number.base': getErrorMessage('2004', { fieldName: 'month' }, 'month'),
		}),
	year: Joi.number()
		.integer()
		.min(2000)
		.max(2100)
		.optional()
		.messages({
			'number.base': getErrorMessage('2004', { fieldName: 'year' }, 'year'),
		}),
	startDate: Joi.string()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'startDate' }, 'startDate'),
		}),
	endDate: Joi.string()
		.optional()
		.messages({
			'string.base': getErrorMessage('2004', { fieldName: 'endDate' }, 'endDate'),
		}),
	minAbsences: Joi.number()
		.integer()
		.min(0)
		.optional()
		.messages({
			'number.base': getErrorMessage('2004', { fieldName: 'minAbsences' }, 'minAbsences'),
		}),
}).or('month', 'startDate')
	.with('month', 'year')
	.with('startDate', 'endDate')
	.messages({
		'object.missing': 'Either month+year or startDate+endDate parameters are required',
		'object.with': 'Both month and year are required together, or both startDate and endDate',
	});

export {
	dateFilterSchema,
	attendanceDetailsSchema,
	attendanceStatsSchema,
};
