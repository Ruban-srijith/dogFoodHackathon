import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Score } from '../types';

export interface EventResultsItem {
  submission_id: string;
  submission_title: string;
  team_name: string;
  track_name?: string | null;
  avg_score: number;
  total_judges_scored: number;
}

export const scoreService = {
  submitScore: async (submissionId: string, data: { criterion_id: string; points: number; feedback?: string }): Promise<Score> => {
    return await apiClient.post<Score>(ENDPOINTS.SUBMIT_SCORE(submissionId), data);
  },

  getMyScores: async (submissionId: string): Promise<Score[]> => {
    return await apiClient.get<Score[]>(ENDPOINTS.MY_SCORES(submissionId));
  },

  getEventResults: async (eventId: string): Promise<EventResultsItem[]> => {
    return await apiClient.get<EventResultsItem[]>(ENDPOINTS.EVENT_RESULTS(eventId));
  },
};
