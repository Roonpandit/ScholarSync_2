export interface Lecture {
	id: string;
	name: string;
	lectureId: string;
	isDefault: boolean;
	description?: string;
	isActive: boolean;
}

export interface CreateLectureRequest {
	name: string;
	description?: string;
}

export interface UpdateLectureRequest {
	name?: string;
	description?: string;
	isActive?: boolean;
}

export interface ManageLecturesRequest {
	action: 'assign' | 'unassign';
	lectureIds: string[];
	studentIds: string[];
}
