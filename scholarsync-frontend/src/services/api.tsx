import { baseURL, isLocalhost, SERVICE_PORTS } from '@/base';
import { API_ENDPOINTS } from './ApiEndPoints/apiEndpoints';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setTokens = (accessToken: string, refreshToken: string): void => {
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};
export const clearTokens = (): void => {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const AxiosInstance = axios.create({ baseURL });

// Request interceptor — attach token + route to correct port on localhost
AxiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = getAccessToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	// Localhost: route to correct service port based on URL path
	if (isLocalhost && config.url) {
		const serviceName = config.url.split('/')[1]; // e.g., 'iam', 'wfms', 'notification', 'report'
		const port = SERVICE_PORTS[serviceName];
		if (port) {
			config.baseURL = `${window.location.protocol}//${window.location.hostname}:${port}/api`;
		}
	}

	return config;
});

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token!);
		}
	});
	failedQueue = [];
};

AxiosInstance.interceptors.response.use(
	(response) => response.data,
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };
		const status = error.response?.status || 500;
		const errorCode = (error.response?.data as Record<string, unknown>)?.code;

		// Session expired (logged in from another device)
		if (status === 401 && errorCode === '1024') {
			clearTokens();
			window.location.href = '/login?session_expired=true';
			return Promise.reject(error);
		}

		// 401 — try refresh token
		if (status === 401 && !originalRequest._retry) {
			// Login returns 401 for wrong credentials — don't redirect, just return the error response
			if (originalRequest.url?.includes('/auth/login')) {
				return error?.response?.data ?? Promise.reject(error);
			}

			const refreshToken = getRefreshToken();

			originalRequest._retryCount = (originalRequest._retryCount || 0);
			if (originalRequest._retryCount >= 5) {
				clearTokens();
				window.location.href = '/login';
				return Promise.reject(error);
			}

			if (!refreshToken) {
				clearTokens();
				window.location.href = '/login';
				return Promise.reject(error);
			}

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then((token) => {
					originalRequest.headers.Authorization = `Bearer ${token}`;
					return AxiosInstance(originalRequest);
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Build refresh URL for correct port
				let refreshBaseURL = baseURL;
				if (isLocalhost) {
					refreshBaseURL = `${window.location.protocol}//${window.location.hostname}:${SERVICE_PORTS.iam}/api`;
				}

				const response = await axios.post(`${refreshBaseURL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
					refreshToken,
				});

				const newAccessToken = response.data?.data?.accessToken;
				if (newAccessToken) {
					localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
					originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
					processQueue(null, newAccessToken);
					originalRequest._retryCount! += 1;
					return AxiosInstance(originalRequest);
				}

				throw new Error('No access token in refresh response');
			} catch (refreshError) {
				processQueue(refreshError, null);
				clearTokens();
				window.location.href = '/login';
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// Non-401 errors — return response data
		return error?.response?.data ?? Promise.reject(error);
	}
);

export default AxiosInstance;
