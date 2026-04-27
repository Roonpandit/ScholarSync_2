export type LeaveType = 'sick' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'closed';
export type LeaveManageAction = 'approve' | 'reject' | 'resend' | 'cancel';

export interface LeaveRequest {
	id: string;
	studentId: string;
	lectureId: string;
	teacherId: string;
	leaveType: LeaveType;
	fromDate: string;
	toDate: string;
	reason: string;
	status: LeaveStatus;
	teacherRemark?: string;
	studentRemark?: string;
	rejectedAt?: string;
	rejectExpiresAt?: string;
	resendCount: number;
	isResent: boolean;
	approvedAt?: string;
	cancelledAt?: string;
	cancelReason?: string;
	isCancelled: boolean;
	appliedAt: string;
}

export interface ApplyLeaveRequest {
	lectureTeacherPairs: { lectureId: string; teacherId: string }[];
	leaveType: LeaveType;
	fromDate: string;
	toDate: string;
	reason: string;
}

export interface ManageLeaveRequest {
	action: LeaveManageAction;
	teacherRemark?: string;
	studentRemark?: string;
	cancelReason?: string;
}
