export const ROUTE_CONSTANTS = {
	// Public
	HOME: '/home',
	LOGIN: '/login',
	RESET_PASSWORD: '/reset-password/:token',
	DOCUMENTATION: '/documentation',
	DOCUMENTATION_TEACHERS: '/documentation/teachers',
	DOCUMENTATION_STUDENTS: '/documentation/students',

	// Admin/Teacher shared
	DASHBOARD: '/dashboard',
	STUDENTS: '/students',
	STUDENT_DETAILS: '/students/:id',
	ATTENDANCE_SLOTS: '/attendance-slots',
	ATTENDANCE_STATS: '/attendance/stats',
	LEAVE_MANAGEMENT: '/leave-management',
	REVIEWS: '/reviews',

	// Admin only
	TEACHERS: '/teachers',
	TEACHER_DETAILS: '/teachers/:id',
	LECTURE_MANAGEMENT: '/lecture-management',
	BULK_UPLOAD: '/bulk-upload',
	IP_MANAGEMENT: '/ip-management',

	// Student
	STUDENT_DASHBOARD: '/student/dashboard',
	STUDENT_MARK_ATTENDANCE: '/student/mark-attendance',
	STUDENT_ATTENDANCE: '/student/attendance',
	STUDENT_LEAVE: '/student/leave',

	// Profile
	PROFILE: '/profile',

	// 404
	NOT_FOUND: '*',
};

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
