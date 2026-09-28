import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Comment } from '../types';

export const commentService = {
  getComments: async (submissionId: string): Promise<Comment[]> => {
    return await apiClient.get<Comment[]>(ENDPOINTS.COMMENTS_BY_SUBMISSION(submissionId));
  },

  createComment: async (submissionId: string, content: string, is_internal: boolean = false): Promise<Comment> => {
    return await apiClient.post<Comment>(ENDPOINTS.COMMENTS_BY_SUBMISSION(submissionId), {
      content,
      is_internal,
    });
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.DELETE_COMMENT(commentId));
  },
};
