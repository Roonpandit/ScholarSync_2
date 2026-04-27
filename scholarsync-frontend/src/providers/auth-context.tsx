import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { post, get, put } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import { ROUTE_CONSTANTS } from '@/constants/routeConstants';
import { setTokens, clearTokens, getAccessToken } from '@/services/api.tsx';
import type { User, LoginRequest, LoginResponse, UpdatePasswordRequest } from '@/types/auth.types';
import type { ApiResponse } from '@/types/common.types';

interface AuthContextType {
	user: User | null;
	token: string | null;
	loading: boolean;
	login: (data: LoginRequest) => Promise<boolean>;
	logout: () => void;
	updatePassword: (data: UpdatePasswordRequest) => Promise<ApiResponse>;
	fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider');
	return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const navigate = useNavigate();
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(getAccessToken());
	const [loading, setLoading] = useState(true);

	const fetchMe = async (): Promise<void> => {
		try {
			const res = await get<ApiResponse<User>>(API_ENDPOINTS.ME);
			if (res?.status === 200 && res.data) {
				setUser(res.data);
			} else {
				setUser(null);
				setToken(null);
				clearTokens();
			}
		} catch {
			setUser(null);
			setToken(null);
			clearTokens();
		}
	};

	// Initial auth check on load
	useEffect(() => {
		const currentToken = getAccessToken();
		if (currentToken) {
			fetchMe().finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, []);

	const login = async (data: LoginRequest): Promise<boolean> => {
		try {
			const res = await post<ApiResponse<LoginResponse>>(API_ENDPOINTS.AUTH.LOGIN, data);

			if (res?.status === 200 && res.data?.result) {
				setTokens(res.data.result.accessToken, res.data.result.refreshToken);
				setToken(res.data.result.accessToken);
				await fetchMe();
				toast.success(res.message);
				return true;
			}

			toast.error(res?.message);
			return false;
		} catch {
			toast.error('Something went wrong!');
			return false;
		}
	};

	const logout = (): void => {
		setUser(null);
		setToken(null);
		clearTokens();
		toast.info('You have been logged out');
		navigate(ROUTE_CONSTANTS.LOGIN);
	};

	const updatePassword = async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
		return put<ApiResponse>(API_ENDPOINTS.UPDATE_PASSWORD, data);
	};

	return (
		<AuthContext.Provider value={{ user, token, loading, login, logout, updatePassword, fetchMe }}>
			{children}
		</AuthContext.Provider>
	);
};
