import Joi from 'joi';
import { getErrorMessage } from 'scholarsync-backend-common';

const objectId = Joi.string()
	.regex(/^[0-9a-fA-F]{24}$/)
	.messages({
		'string.pattern.base': getErrorMessage('2007', {}, 'id'),
	});

const loginSchema = Joi.object({
	email: Joi.string()
		.email()
		.lowercase()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
			'string.empty': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
	password: Joi.string()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'password' }, 'password'),
			'string.empty': getErrorMessage('2001', { fieldName: 'password' }, 'password'),
		}),
});

const forgotPasswordSchema = Joi.object({
	email: Joi.string()
		.email()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
			'string.empty': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
});

const resetPasswordBodySchema = Joi.object({
	password: Joi.string()
		.min(8)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'password' }, 'password'),
			'string.empty': getErrorMessage('2001', { fieldName: 'password' }, 'password'),
			'string.min': getErrorMessage('2003', { fieldName: 'password', limit: '8' }, 'password'),
		}),
});

const updatePasswordSchema = Joi.object({
	currentPassword: Joi.string()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'currentPassword' }, 'currentPassword'),
			'string.empty': getErrorMessage('2001', { fieldName: 'currentPassword' }, 'currentPassword'),
		}),
	newPassword: Joi.string()
		.min(8)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'newPassword' }, 'newPassword'),
			'string.empty': getErrorMessage('2001', { fieldName: 'newPassword' }, 'newPassword'),
			'string.min': getErrorMessage('2003', { fieldName: 'newPassword', limit: '8' }, 'newPassword'),
		}),
});

const registerStudentSchema = Joi.object({
	role: Joi.string()
		.valid('student')
		.required()
		.messages({
			'any.only': getErrorMessage('2006', { fieldName: 'role', values: 'student, teacher' }, 'role'),
			'any.required': getErrorMessage('2001', { fieldName: 'role' }, 'role'),
		}),
	name: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.empty': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
		}),
	email: Joi.string()
		.email()
		.lowercase()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
	studentCode: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentCode' }, 'studentCode'),
			'string.empty': getErrorMessage('2001', { fieldName: 'studentCode' }, 'studentCode'),
		}),
	password: Joi.string()
		.min(8)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'password' }, 'password'),
			'string.min': getErrorMessage('2003', { fieldName: 'password', limit: '8' }, 'password'),
		}),
	phone: Joi.string()
		.pattern(/^\d{10}$/)
		.optional()
		.messages({
			'string.pattern.base': getErrorMessage('2005', { fieldName: 'phone' }, 'phone'),
		}),
	lectures: Joi.array()
		.items(objectId)
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'lectures' }, 'lectures'),
			'array.min': getErrorMessage('2009', { fieldName: 'lectures', limit: '1' }, 'lectures'),
			'array.base': getErrorMessage('2008', { fieldName: 'lectures' }, 'lectures'),
		}),
});

const registerTeacherSchema = Joi.object({
	role: Joi.string()
		.valid('teacher')
		.required()
		.messages({
			'any.only': getErrorMessage('2006', { fieldName: 'role', values: 'student, teacher' }, 'role'),
			'any.required': getErrorMessage('2001', { fieldName: 'role' }, 'role'),
		}),
	name: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.empty': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
		}),
	email: Joi.string()
		.email()
		.lowercase()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
	teacherCode: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'teacherCode' }, 'teacherCode'),
			'string.empty': getErrorMessage('2001', { fieldName: 'teacherCode' }, 'teacherCode'),
		}),
	password: Joi.string()
		.min(8)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'password' }, 'password'),
			'string.min': getErrorMessage('2003', { fieldName: 'password', limit: '8' }, 'password'),
		}),
	phone: Joi.string()
		.pattern(/^\d{10}$/)
		.optional()
		.messages({
			'string.pattern.base': getErrorMessage('2005', { fieldName: 'phone' }, 'phone'),
		}),
	lectures: Joi.array()
		.items(objectId)
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'lectures' }, 'lectures'),
			'array.min': getErrorMessage('2009', { fieldName: 'lectures', limit: '1' }, 'lectures'),
			'array.base': getErrorMessage('2008', { fieldName: 'lectures' }, 'lectures'),
		}),
});

const registerSchema = Joi.alternatives().try(registerStudentSchema, registerTeacherSchema);

const bulkRegisterItemSchema = Joi.object({
	name: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.empty': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
		}),
	email: Joi.string()
		.email()
		.lowercase()
		.required()
		.messages({
			'string.email': getErrorMessage('2002', { fieldName: 'email' }, 'email'),
			'any.required': getErrorMessage('2001', { fieldName: 'email' }, 'email'),
		}),
	studentCode: Joi.string()
		.trim()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentCode' }, 'studentCode'),
			'string.empty': getErrorMessage('2001', { fieldName: 'studentCode' }, 'studentCode'),
		}),
	password: Joi.string()
		.min(8)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'password' }, 'password'),
			'string.min': getErrorMessage('2003', { fieldName: 'password', limit: '8' }, 'password'),
		}),
	phone: Joi.string()
		.pattern(/^\d{10}$/)
		.optional()
		.messages({
			'string.pattern.base': getErrorMessage('2005', { fieldName: 'phone' }, 'phone'),
		}),
	lectures: Joi.array()
		.items(objectId)
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'lectures' }, 'lectures'),
			'array.min': getErrorMessage('2009', { fieldName: 'lectures', limit: '1' }, 'lectures'),
		}),
});

const bulkRegisterSchema = Joi.array()
	.items(bulkRegisterItemSchema)
	.min(1)
	.messages({
		'array.min': getErrorMessage('2009', { fieldName: 'students', limit: '1' }, 'students'),
		'array.base': getErrorMessage('2008', { fieldName: 'students' }, 'students'),
	});

const refreshTokenSchema = Joi.object({
	refreshToken: Joi.string()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'refreshToken' }, 'refreshToken'),
			'string.empty': getErrorMessage('2001', { fieldName: 'refreshToken' }, 'refreshToken'),
		}),
});

export {
	loginSchema,
	forgotPasswordSchema,
	resetPasswordBodySchema,
	updatePasswordSchema,
	registerSchema,
	bulkRegisterSchema,
	refreshTokenSchema,
};
