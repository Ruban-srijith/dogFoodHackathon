import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { VoteLeaderboardItem } from '../types';

export const voteService = {
  castVote: async (eventId: string, submissionId: string): Promise<{ vote: any; currentCount: number }> => {
    return await apiClient.post<{ vote: any; currentCount: number }>(ENDPOINTS.CAST_VOTE, {
      event_id: eventId,
      submission_id: submissionId,
    });
  },

  getLeaderboard: async (eventId: string): Promise<VoteLeaderboardItem[]> => {
    return await apiClient.get<VoteLeaderboardItem[]>(ENDPOINTS.VOTE_LEADERBOARD(eventId));
  },

  getMyVote: async (eventId: string): Promise<any> => {
    if (!eventId || eventId === 'undefined' || eventId === 'null' || eventId === 'all') {
      return null;
    }
    try {
      return await apiClient.get<any>(ENDPOINTS.MY_VOTE(eventId));
    } catch {
      return null;
    }
  },
};
