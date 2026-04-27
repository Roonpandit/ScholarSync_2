export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	phone?: string | null;
	studentCode?: string;
	teacherCode?: string;
	lectures?: string[];
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	result: {
		accessToken: string;
		refreshToken: string;
		mustChangePassword?: boolean;
	};
}

export interface RefreshTokenResponse {
	accessToken: string;
}

export interface RegisterStudentRequest {
	role: 'student';
	name: string;
	email: string;
	studentCode: string;
	password: string;
	phone?: string;
	lectures: string[];
}

export interface RegisterTeacherRequest {
	role: 'teacher';
	name: string;
	email: string;
	teacherCode: string;
	password: string;
	phone?: string;
	lectures: string[];
}

export type RegisterRequest = RegisterStudentRequest | RegisterTeacherRequest;

export interface UpdatePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	password: string;
}

export interface UpdateUserRequest {
	name?: string;
	email?: string;
	phone?: string;
	studentCode?: string;
	teacherCode?: string;
	lectures?: string[];
}
