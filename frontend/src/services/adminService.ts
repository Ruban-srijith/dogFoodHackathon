import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { AuditLog, User, UserRole } from '../types';

export interface PlatformStats {
  totalUsers: number;
  totalEvents: number;
  totalTeams: number;
  totalSubmissions: number;
  totalVotes: number;
  totalScores: number;
}

export const adminService = {
  getAuditLogs: async (page: number = 1, limit: number = 50): Promise<AuditLog[]> => {
    return await apiClient.get<AuditLog[]>(`${ENDPOINTS.AUDIT_LOGS}?page=${page}&limit=${limit}`);
  },

  getStats: async (): Promise<PlatformStats> => {
    return await apiClient.get<PlatformStats>(ENDPOINTS.PLATFORM_STATS);
  },

  getUsers: async (role?: UserRole): Promise<User[]> => {
    const url = role ? `${ENDPOINTS.USERS}?role=${role}` : ENDPOINTS.USERS;
    return await apiClient.get<User[]>(url);
  },

  updateUserRole: async (userId: string, role: UserRole): Promise<User> => {
    return await apiClient.patch<User>(ENDPOINTS.USER_ROLE(userId), { role });
  },

  createUser: async (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    role?: UserRole;
  }): Promise<User> => {
    return await apiClient.post<User>(ENDPOINTS.USERS, userData);
  },
};
