// IAM Service - /api/iam/v1
const IAM = '/iam/v1';

// WFMS Service - /api/wfms/v1
const WFMS = '/wfms/v1';

// Notification Service - /api/notification/v1
const NOTIFICATION = '/notification/v1';

// Report Service - /api/report/v1
const REPORT = '/report/v1';

export const API_ENDPOINTS = {
	// ========== IAM: Auth (Public) ==========
	AUTH: {
		LOGIN: `${IAM}/auth/login`,
		SEED_ADMIN: `${IAM}/auth/seed-admin`,
		FORGOT_PASSWORD: `${IAM}/auth/forgot-password`,
		RESET_PASSWORD: (token: string) => `${IAM}/auth/reset-password/${token}`,
		REFRESH_TOKEN: `${IAM}/auth/refresh-token`,
	},

	// ========== IAM: Auth (Protected) ==========
	ME: `${IAM}/auth/me`,
	UPDATE_PASSWORD: `${IAM}/auth/update-password`,
	REGISTER: `${IAM}/auth/register`,
	BULK_REGISTER: `${IAM}/auth/bulk/register`,

	// ========== IAM: User Management ==========
	USERS: {
		GET: (id: string) => `${IAM}/users/${id}`,
		UPDATE: (id: string) => `${IAM}/users/${id}`,
		DELETE: (id: string) => `${IAM}/users/${id}`,
	},

	// ========== IAM: List ==========
	TEACHERS: `${IAM}/teachers`,
	STUDENTS: `${IAM}/students`,

	// ========== IAM: Lectures ==========
	LECTURES_MANAGE: `${IAM}/lectures/manage`,

	// ========== IAM: IP Management ==========
	IP: {
		MANAGE: `${IAM}/ip/manage`,
		DELETE: (id: string) => `${IAM}/ip/${id}`,
		STATUS: `${IAM}/ip/status`,
	},

	// ========== WFMS: Attendance Slots ==========
	ATTENDANCE_SLOTS: {
		CREATE: `${WFMS}/attendance-slots`,
		LIST: `${WFMS}/attendance-slots`,
		CLOSE: (id: string) => `${WFMS}/attendance-slots/${id}/close`,
		DELETE: (id: string) => `${WFMS}/attendance-slots/${id}`,
	},

	// ========== WFMS: Student Attendance ==========
	STUDENT_ATTENDANCE: {
		ACTIVE_SLOTS: `${WFMS}/student/attendance-slots`,
		MARK: `${WFMS}/student/attendance`,
		HISTORY: `${WFMS}/student/attendance`,
		COUNTS: `${WFMS}/student/attendance-counts`,
	},

	// ========== WFMS: Admin/Teacher Attendance ==========
	ATTENDANCE: {
		LIST: `${WFMS}/attendance`,
		MARK: `${WFMS}/attendance/mark`,
		ABSENT_LIST: `${WFMS}/attendance/absent`,
		DETAILS: `${WFMS}/attendance/details`,
		MARK_ABSENT: (id: string) => `${WFMS}/attendance/${id}/mark-absent`,
		STATUS: (id: string) => `${WFMS}/attendance/${id}/status`,
		STATS: `${WFMS}/attendance/stats`,
	},

	// ========== WFMS: Leave - Student ==========
	LEAVE: {
		APPLY: `${WFMS}/leave/apply`,
		MY_REQUESTS: `${WFMS}/leave/my-requests`,
		CHECK_SLOT: `${WFMS}/leave/check-slot`,
		DETAILS: (id: string) => `${WFMS}/leave/details/${id}`,
		GET: (id: string) => `${WFMS}/leave/${id}`,
		DELETE: (id: string) => `${WFMS}/leave/${id}`,
		MANAGE: (id: string) => `${WFMS}/leave/${id}/manage`,
		LIST: `${WFMS}/leave`,
	},

	// ========== WFMS: Lectures ==========
	LECTURES: {
		LIST: `${WFMS}/lectures`,
		GET: (id: string) => `${WFMS}/lectures/${id}`,
		STUDENTS: (id: string) => `${WFMS}/lectures/${id}/students`,
		TEACHER: (id: string) => `${WFMS}/lectures/${id}/teacher`,
		CREATE: `${WFMS}/lectures`,
		UPDATE: (id: string) => `${WFMS}/lectures/${id}`,
		DELETE: (id: string) => `${WFMS}/lectures/${id}`,
	},

	// ========== Notification ==========
	NOTIFICATION: {
		WELCOME_EMAIL: `${NOTIFICATION}/welcome-email`,
		PASSWORD_RESET_EMAIL: `${NOTIFICATION}/password-reset-email`,
		PASSWORD_RESET_CONFIRMATION: `${NOTIFICATION}/password-reset-confirmation`,
		ABSENT_NOTIFICATION: `${NOTIFICATION}/absent-notification`,
		FEEDBACK_EMAILS: `${NOTIFICATION}/feedback-emails`,
	},

	// ========== Report ==========
	REPORT: {
		STUDENT_DETAILS: (id: string) => `${REPORT}/students/${id}/details`,
		ATTENDANCE_DETAILS: `${REPORT}/attendance/details`,
		ATTENDANCE_STATS: `${REPORT}/attendance/stats`,
		LEAVE_STATS: `${REPORT}/leave/stats`,
	},
};
