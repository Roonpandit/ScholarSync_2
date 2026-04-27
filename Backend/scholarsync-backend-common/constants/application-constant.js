export const USER_ROLE = {
	SUPERADMIN: 'superadmin',
	ADMIN: 'admin',
	TEACHER: 'teacher',
	STUDENT: 'student',
};

export const ACTIVITY_TYPE = {
	LOGIN_SUCCESS: 'login_success',
	LOGIN_FAILED: 'login_failed',
	PASSWORD_RESET_REQUEST: 'password_reset_request',
	PASSWORD_RESET_COMPLETE: 'password_reset_complete',
	PASSWORD_CHANGE: 'password_change',
	USER_BLOCKED: 'user_blocked',
	USER_UNBLOCKED: 'user_unblocked',
	SESSION_CREATED: 'session_created',
};

export const USER_STATUS = {
	ACTIVE: 'Active',
	DISABLED: 'Disabled',
};

export const ACTION_TYPE = {
	UPDATE_DATA: 'updateData',
	CHANGE_STATUS: 'changeStatus',
	CREATED: 'created',
};
