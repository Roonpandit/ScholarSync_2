export type Shift = 'morning' | 'afternoon' | 'evening';
export type SlotStatus = 'upcoming' | 'active' | 'closed';
export type AttendanceStatus = 'pending' | 'awaiting_approval' | 'present' | 'absent' | 'on_leave';

export interface AttendanceSlot {
	id: string;
	shift: Shift;
	date: string;
	startTime: string;
	endTime: string;
	status: SlotStatus;
	isActive: boolean;
	lecture: string;
	emailSent: boolean;
	notified: boolean;
}

export interface AttendanceRecord {
	id: string;
	student: string;
	slot: string;
	lecture: string;
	date: string;
	shift: Shift;
	status: AttendanceStatus;
	photo?: {
		url: string;
		public_id: string;
		format?: string;
		width?: number;
		height?: number;
	};
	location?: {
		type: string;
		coordinates: number[];
		address?: string;
	};
	markedAt: string;
	studentCode: string;
	studentName: string;
	studentEmail: string;
	remark?: string;
	statusUpdatedBy?: string;
	statusUpdatedAt?: string;
}

export interface CreateSlotRequest {
	shift: Shift;
	date: string;
	startTime: string;
	endTime: string;
	lectures: string[];
}

export interface MarkAttendanceRequest {
	slotId: string;
	photo: File;
	latitude: number;
	longitude: number;
	address?: string;
}

export interface AttendanceStatusAction {
	action: 'approve' | 'reject';
	remark?: string;
}

export interface AttendanceStats {
	totalSlots: number;
	pendingSlots: number;
	awaitingSlots: number;
	present: number;
	absent: number;
	attendancePercentage: number;
}
