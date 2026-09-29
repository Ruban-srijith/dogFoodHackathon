import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Team } from '../types';

export const teamService = {
  getTeamsForEvent: async (eventId: string): Promise<Team[]> => {
    try {
      const data = await apiClient.get<Team[]>(ENDPOINTS.TEAMS_BY_EVENT(eventId));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getMyTeamInEvent: async (eventId: string): Promise<Team | null> => {
    try {
      return await apiClient.get<Team | null>(ENDPOINTS.MY_TEAM_IN_EVENT(eventId));
    } catch {
      return null;
    }
  },

  getTeamById: async (id: string): Promise<Team> => {
    return await apiClient.get<Team>(ENDPOINTS.TEAM_BY_ID(id));
  },

  createTeam: async (data: { event_id: string; name: string; description?: string; is_individual?: boolean }): Promise<Team> => {
    return await apiClient.post<Team>(ENDPOINTS.CREATE_TEAM, data);
  },

  joinTeam: async (invite_code: string): Promise<Team> => {
    return await apiClient.post<Team>(ENDPOINTS.JOIN_TEAM, { invite_code });
  },

  getMyTeams: async (): Promise<Team[]> => {
    try {
      const data = await apiClient.get<any>('/api/v1/teams/my');
      return Array.isArray(data) ? data : (data?.teams || data?.data || []);
    } catch {
      return [];
    }
  },

  deleteTeam: async (id: string): Promise<{ success: boolean; message: string }> => {
    return await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/teams/${id}`);
  },
};
