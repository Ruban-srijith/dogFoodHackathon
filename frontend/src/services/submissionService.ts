import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Submission } from '../types';

export const submissionService = {
  getGallery: async (eventId: string): Promise<Submission[]> => {
    return await apiClient.get<Submission[]>(ENDPOINTS.GALLERY(eventId));
  },

  getEventSubmissions: async (eventId: string): Promise<Submission[]> => {
    return await apiClient.get<Submission[]>(ENDPOINTS.SUBMISSIONS_BY_EVENT(eventId));
  },

  getSubmissionById: async (id: string): Promise<Submission> => {
    return await apiClient.get<Submission>(ENDPOINTS.SUBMISSION_BY_ID(id));
  },

  createSubmission: async (data: Partial<Submission>): Promise<Submission> => {
    return await apiClient.post<Submission>(ENDPOINTS.CREATE_SUBMISSION, data);
  },

  updateSubmission: async (id: string, data: Partial<Submission>): Promise<Submission> => {
    return await apiClient.patch<Submission>(ENDPOINTS.UPDATE_SUBMISSION(id), data);
  },
};
