import Joi from 'joi';
import { getErrorMessage } from 'scholarsync-backend-common';
import { IP_ACTIONS } from '../constants/application-constants.js';

const manageIPSchema = Joi.alternatives().try(
	Joi.object({
		action: Joi.string()
			.valid(IP_ACTIONS.ADD)
			.required()
			.messages({
				'any.only': getErrorMessage('2006', { fieldName: 'action', values: Object.values(IP_ACTIONS).join(', ') }, 'action'),
				'any.required': getErrorMessage('2001', { fieldName: 'action' }, 'action'),
			}),
		ipAddress: Joi.string()
			.ip()
			.required()
			.messages({
				'string.ip': getErrorMessage('2011', { fieldName: 'ipAddress' }, 'ipAddress'),
				'any.required': getErrorMessage('2001', { fieldName: 'ipAddress' }, 'ipAddress'),
			}),
		locationName: Joi.string()
			.trim()
			.min(10)
			.required()
			.messages({
				'any.required': getErrorMessage('2001', { fieldName: 'locationName' }, 'locationName'),
				'string.min': getErrorMessage('2013', { fieldName: 'locationName', limit: '10' }, 'locationName'),
				'string.empty': getErrorMessage('2001', { fieldName: 'locationName' }, 'locationName'),
			}),
		description: Joi.string()
			.trim()
			.optional(),
	}),
	Joi.object({
		action: Joi.string()
			.valid(IP_ACTIONS.TOGGLE)
			.required()
			.messages({
				'any.only': getErrorMessage('2006', { fieldName: 'action', values: Object.values(IP_ACTIONS).join(', ') }, 'action'),
				'any.required': getErrorMessage('2001', { fieldName: 'action' }, 'action'),
			}),
		isEnabled: Joi.boolean()
			.required()
			.messages({
				'boolean.base': getErrorMessage('2010', { fieldName: 'isEnabled' }, 'isEnabled'),
				'any.required': getErrorMessage('2001', { fieldName: 'isEnabled' }, 'isEnabled'),
			}),
	})
);

export { manageIPSchema };
