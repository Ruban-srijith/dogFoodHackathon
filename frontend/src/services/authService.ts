import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { User, UserRole } from '../types';
import { setStoredToken, removeStoredToken } from '../utils/storage';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const res = await apiClient.post<AuthResponse>(ENDPOINTS.LOGIN, { email, password });
    setStoredToken(res.token);
    return res.user;
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role?: UserRole;
  }): Promise<User> => {
    const res = await apiClient.post<AuthResponse>(ENDPOINTS.REGISTER, data);
    setStoredToken(res.token);
    return res.user;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
    } finally {
      removeStoredToken();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    return await apiClient.get<User>(ENDPOINTS.ME);
  },
};
