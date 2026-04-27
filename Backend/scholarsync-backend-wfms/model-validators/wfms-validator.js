import Joi from 'joi';
import { getErrorMessage } from 'scholarsync-backend-common';

const uuid = Joi.string()
	.guid({ version: ['uuidv4'] })
	.messages({
		'string.guid': getErrorMessage('2007', {}, 'id'),
	});

// ========================
// ATTENDANCE SLOT SCHEMAS
// ========================

const createAttendanceSlotSchema = Joi.object({
	shift: Joi.string()
		.valid('morning', 'afternoon', 'evening')
		.required()
		.messages({
			'any.only': getErrorMessage('2006', { fieldName: 'shift', values: 'morning, afternoon, evening' }, 'shift'),
			'any.required': getErrorMessage('2001', { fieldName: 'shift' }, 'shift'),
		}),
	date: Joi.date()
		.iso()
		.required()
		.messages({
			'date.format': getErrorMessage('2002', { fieldName: 'date' }, 'date'),
			'any.required': getErrorMessage('2001', { fieldName: 'date' }, 'date'),
		}),
	startTime: Joi.date()
		.iso()
		.required()
		.messages({
			'date.format': getErrorMessage('2002', { fieldName: 'startTime' }, 'startTime'),
			'any.required': getErrorMessage('2001', { fieldName: 'startTime' }, 'startTime'),
		}),
	endTime: Joi.date()
		.iso()
		.required()
		.messages({
			'date.format': getErrorMessage('2002', { fieldName: 'endTime' }, 'endTime'),
			'any.required': getErrorMessage('2001', { fieldName: 'endTime' }, 'endTime'),
		}),
	lectures: Joi.array()
		.items(uuid)
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'lectures' }, 'lectures'),
			'array.min': getErrorMessage('2009', { fieldName: 'lectures', limit: '1' }, 'lectures'),
			'array.base': getErrorMessage('2008', { fieldName: 'lectures' }, 'lectures'),
		}),
});

// ========================
// LEAVE SCHEMAS
// ========================

const leaveRequestItemSchema = Joi.object({
	lectureId: uuid.required().messages({
		'any.required': getErrorMessage('2001', { fieldName: 'lectureId' }, 'lectureId'),
	}),
	teacherId: uuid.required().messages({
		'any.required': getErrorMessage('2001', { fieldName: 'teacherId' }, 'teacherId'),
	}),
});

const applyLeaveSchema = Joi.object({
	leaveRequests: Joi.array()
		.items(leaveRequestItemSchema)
		.min(1)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'leaveRequests' }, 'leaveRequests'),
			'array.min': getErrorMessage('2009', { fieldName: 'leaveRequests', limit: '1' }, 'leaveRequests'),
			'array.base': getErrorMessage('2008', { fieldName: 'leaveRequests' }, 'leaveRequests'),
		}),
	leaveType: Joi.string()
		.valid('sick', 'other')
		.required()
		.messages({
			'any.only': getErrorMessage('2006', { fieldName: 'leaveType', values: 'sick, other' }, 'leaveType'),
			'any.required': getErrorMessage('2001', { fieldName: 'leaveType' }, 'leaveType'),
		}),
	fromDate: Joi.date()
		.iso()
		.required()
		.messages({
			'date.format': getErrorMessage('2002', { fieldName: 'fromDate' }, 'fromDate'),
			'any.required': getErrorMessage('2001', { fieldName: 'fromDate' }, 'fromDate'),
		}),
	toDate: Joi.date()
		.iso()
		.min(Joi.ref('fromDate'))
		.required()
		.messages({
			'date.format': getErrorMessage('2002', { fieldName: 'toDate' }, 'toDate'),
			'any.required': getErrorMessage('2001', { fieldName: 'toDate' }, 'toDate'),
			'date.min': 'toDate must be on or after fromDate',
		}),
	reason: Joi.string()
		.min(10)
		.max(500)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'reason' }, 'reason'),
			'string.min': getErrorMessage('2003', { fieldName: 'reason', limit: '10' }, 'reason'),
			'string.max': getErrorMessage('2004', { fieldName: 'reason', limit: '500' }, 'reason'),
		}),
});

const rejectLeaveSchema = Joi.object({
	teacherRemark: Joi.string()
		.min(1)
		.max(500)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'teacherRemark' }, 'teacherRemark'),
			'string.empty': getErrorMessage('2001', { fieldName: 'teacherRemark' }, 'teacherRemark'),
		}),
});

const resendLeaveSchema = Joi.object({
	studentRemark: Joi.string()
		.min(1)
		.max(500)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'studentRemark' }, 'studentRemark'),
			'string.empty': getErrorMessage('2001', { fieldName: 'studentRemark' }, 'studentRemark'),
		}),
});

const cancelLeaveSchema = Joi.object({
	cancelReason: Joi.string()
		.min(1)
		.max(500)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'cancelReason' }, 'cancelReason'),
			'string.empty': getErrorMessage('2001', { fieldName: 'cancelReason' }, 'cancelReason'),
		}),
});

// ========================
// LECTURE SCHEMAS
// ========================

const createLectureSchema = Joi.object({
	name: Joi.string()
		.trim()
		.min(3)
		.max(255)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.empty': getErrorMessage('2001', { fieldName: 'name' }, 'name'),
			'string.min': getErrorMessage('2003', { fieldName: 'name', limit: '3' }, 'name'),
		}),
	description: Joi.string()
		.allow('')
		.max(1000)
		.optional(),
});

const updateLectureSchema = Joi.object({
	name: Joi.string()
		.trim()
		.min(3)
		.max(255)
		.optional()
		.messages({
			'string.min': getErrorMessage('2003', { fieldName: 'name', limit: '3' }, 'name'),
		}),
	description: Joi.string()
		.allow('')
		.max(1000)
		.optional(),
	isActive: Joi.boolean()
		.optional(),
});

// ========================
// ATTENDANCE MARK SCHEMAS
// ========================

const markAttendanceSchema = Joi.object({
	slotId: uuid.required().messages({
		'any.required': getErrorMessage('2001', { fieldName: 'slotId' }, 'slotId'),
	}),
	studentId: uuid.required().messages({
		'any.required': getErrorMessage('2001', { fieldName: 'studentId' }, 'studentId'),
	}),
	isPresent: Joi.boolean()
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'isPresent' }, 'isPresent'),
		}),
	timestamp: Joi.date()
		.iso()
		.optional(),
});

const markAbsentSchema = Joi.object({
	remark: Joi.string()
		.min(1)
		.max(1000)
		.required()
		.messages({
			'any.required': getErrorMessage('2001', { fieldName: 'remark' }, 'remark'),
			'string.empty': getErrorMessage('2001', { fieldName: 'remark' }, 'remark'),
			'string.max': getErrorMessage('2004', { fieldName: 'remark', limit: '1000' }, 'remark'),
		}),
});

export {
	createAttendanceSlotSchema,
	applyLeaveSchema,
	rejectLeaveSchema,
	resendLeaveSchema,
	cancelLeaveSchema,
	createLectureSchema,
	updateLectureSchema,
	markAttendanceSchema,
	markAbsentSchema,
};
