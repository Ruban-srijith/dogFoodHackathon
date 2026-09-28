import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { JudgeAssignment, Submission, RubricWithCriteria, Score } from '../types';

export interface JudgeSubmissionDetailResponse {
  assignment: JudgeAssignment;
  submission: Submission;
  rubric: RubricWithCriteria;
  existingScores: Score[];
}

export const judgeService = {
  getMyAssignments: async (eventId?: string): Promise<JudgeAssignment[]> => {
    const url = eventId ? `${ENDPOINTS.JUDGE_ASSIGNMENTS}?eventId=${eventId}` : ENDPOINTS.JUDGE_ASSIGNMENTS;
    return await apiClient.get<JudgeAssignment[]>(url);
  },

  getSubmissionForJudging: async (submissionId: string): Promise<JudgeSubmissionDetailResponse> => {
    return await apiClient.get<JudgeSubmissionDetailResponse>(ENDPOINTS.JUDGE_SUBMISSION_DETAIL(submissionId));
  },

  getEventAssignments: async (eventId: string): Promise<JudgeAssignment[]> => {
    return await apiClient.get<JudgeAssignment[]>(ENDPOINTS.EVENT_ASSIGNMENTS(eventId));
  },

  assignJudge: async (data: { event_id: string; judge_id: string; submission_id: string }): Promise<JudgeAssignment> => {
    return await apiClient.post<JudgeAssignment>(ENDPOINTS.ASSIGN_JUDGE, data);
  },

  removeAssignment: async (assignmentId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.REMOVE_ASSIGNMENT(assignmentId));
  },
};
