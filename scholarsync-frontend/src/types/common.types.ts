export interface ApiResponse<T = unknown> {
	status: number;
	message?: string;
	code?: string;
	data?: T;
	fieldName?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
	count?: number;
	total?: number;
}
