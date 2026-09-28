import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Team } from '../types';

export const teamService = {
  getTeamsForEvent: async (eventId: string): Promise<Team[]> => {
    return await apiClient.get<Team[]>(ENDPOINTS.TEAMS_BY_EVENT(eventId));
  },

  getMyTeamInEvent: async (eventId: string): Promise<Team | null> => {
    return await apiClient.get<Team | null>(ENDPOINTS.MY_TEAM_IN_EVENT(eventId));
  },

  getTeamById: async (id: string): Promise<Team> => {
    return await apiClient.get<Team>(ENDPOINTS.TEAM_BY_ID(id));
  },

  createTeam: async (data: { event_id: string; name: string; description?: string }): Promise<Team> => {
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
};
