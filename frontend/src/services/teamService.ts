import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Team } from '../types';

const LOCAL_TEAMS_KEY = 'dogfood_local_teams';

function getLocalTeams(): Team[] {
  try {
    const data = localStorage.getItem(LOCAL_TEAMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalTeam(team: Team): void {
  try {
    const teams = getLocalTeams();
    const updated = [team, ...teams.filter((t) => t.id !== team.id)];
    localStorage.setItem(LOCAL_TEAMS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error(err);
  }
}

export const teamService = {
  getTeamsForEvent: async (eventId: string): Promise<Team[]> => {
    try {
      const teams = await apiClient.get<Team[]>(ENDPOINTS.TEAMS_BY_EVENT(eventId));
      if (teams && teams.length > 0) return teams;
    } catch {
      // Fallback
    }
    const local = getLocalTeams().filter((t) => t.event_id === eventId);
    if (local.length > 0) return local;

    return [
      {
        id: `team-mock-1-${eventId}`,
        event_id: eventId,
        name: 'CyberDog Innovation Lab',
        slug: 'cyberdog-innovation-lab',
        description: 'Building telemetry-driven hackathon systems.',
        leader_id: 'user-001',
        invite_code: 'GRAV2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        members: [
          {
            id: 'user-001',
            username: 'cyber_hacker',
            email: 'hacker@dogfood.io',
            role: 'PARTICIPANT',
            full_name: 'Alex Mercer',
            member_role: 'leader',
            joined_at: new Date().toISOString(),
          },
        ],
      },
    ];
  },

  getMyTeamInEvent: async (eventId: string): Promise<Team | null> => {
    try {
      const team = await apiClient.get<Team | null>(ENDPOINTS.MY_TEAM_IN_EVENT(eventId));
      if (team) return team;
    } catch {
      // Fallback
    }
    const local = getLocalTeams().find((t) => t.event_id === eventId);
    return local || null;
  },

  getTeamById: async (id: string): Promise<Team> => {
    try {
      return await apiClient.get<Team>(ENDPOINTS.TEAM_BY_ID(id));
    } catch {
      const local = getLocalTeams().find((t) => t.id === id);
      if (local) return local;
      return {
        id,
        event_id: 'unstop-prod-dev-01',
        name: 'CyberDog Innovation Lab',
        slug: 'cyberdog-innovation-lab',
        description: 'Building telemetry-driven hackathon systems.',
        leader_id: 'user-001',
        invite_code: 'GRAV2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  createTeam: async (data: { event_id: string; name: string; description?: string }): Promise<Team> => {
    try {
      const created = await apiClient.post<Team>(ENDPOINTS.CREATE_TEAM, data);
      saveLocalTeam(created);
      return created;
    } catch {
      const id = 'team-' + Date.now();
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const mockTeam: Team = {
        id,
        event_id: data.event_id,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: data.description || 'Registered Hackathon Team',
        leader_id: 'current-user-id',
        invite_code: inviteCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalTeam(mockTeam);
      return mockTeam;
    }
  },

  joinTeam: async (invite_code: string): Promise<Team> => {
    try {
      const joined = await apiClient.post<Team>(ENDPOINTS.JOIN_TEAM, { invite_code });
      saveLocalTeam(joined);
      return joined;
    } catch {
      const teams = getLocalTeams();
      const existing = teams.find((t) => t.invite_code === invite_code) || teams[0];
      if (existing) {
        saveLocalTeam(existing);
        return existing;
      }
      const mockJoined: Team = {
        id: 'team-joined-' + Date.now(),
        event_id: 'unstop-prod-dev-01',
        name: 'Joined Squad',
        slug: 'joined-squad',
        description: 'Joined via invite code',
        leader_id: 'lead-id',
        invite_code: invite_code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalTeam(mockJoined);
      return mockJoined;
    }
  },
};

