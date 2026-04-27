import type { AxiosRequestConfig } from 'axios';
import axios from './api.tsx';

interface SendParams {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	path: string;
	data?: unknown;
	params?: Record<string, unknown>;
	signal?: AbortSignal | null;
	headers?: Record<string, string>;
}

export const send = async <T = unknown>({ method, path, data = null, params, signal = null, headers }: SendParams): Promise<T> => {
	try {
		const axiosConfig: AxiosRequestConfig = {
			method,
			url: path,
			signal: signal || undefined,
			headers,
			params,
		};

		if (data !== null && data !== undefined) {
			axiosConfig.data = data;
		}

		const response = await axios(axiosConfig);
		return response as T;
	} catch (error: unknown) {
		return (error as { response?: T })?.response || ({ message: 'An unknown error occurred' } as T);
	}
};

export function get<T = unknown>(path: string, params?: Record<string, unknown>, signal?: AbortSignal | null): Promise<T> {
	return send<T>({ method: 'GET', path, params, signal });
}

export function post<T = unknown>(path: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
	return send<T>({ method: 'POST', path, data, headers });
}

export function put<T = unknown>(path: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
	return send<T>({ method: 'PUT', path, data, headers });
}

export function del<T = unknown>(path: string, data?: unknown): Promise<T> {
	return send<T>({ method: 'DELETE', path, data });
}
