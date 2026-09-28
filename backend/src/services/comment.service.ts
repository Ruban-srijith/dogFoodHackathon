import { commentRepository, EnrichedComment } from '../repositories/comment.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { UserRole } from '../models';

export class CommentService {
  async listComments(submissionId: string, currentUser?: { userId: string; role: UserRole }): Promise<EnrichedComment[]> {
    const isPrivileged = currentUser && ['JUDGE', 'ORGANIZER', 'ADMIN'].includes(currentUser.role);
    return await commentRepository.listBySubmission(submissionId, Boolean(isPrivileged));
  }

  async createComment(data: {
    submission_id: string;
    user_id: string;
    user_role: UserRole;
    content: string;
    is_internal?: boolean;
  }): Promise<EnrichedComment> {
    const submission = await submissionRepository.findById(data.submission_id);
    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    if (data.is_internal) {
      if (!['JUDGE', 'ORGANIZER', 'ADMIN'].includes(data.user_role)) {
        throw new ForbiddenError('Only judges and organizers can post internal evaluation notes');
      }
    }

    return await commentRepository.create({
      submission_id: data.submission_id,
      user_id: data.user_id,
      content: data.content,
      is_internal: data.is_internal || false,
    });
  }

  async deleteComment(commentId: string, userId: string, userRole: UserRole): Promise<void> {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    const isAuthor = comment.user_id === userId;
    const isPrivileged = ['ORGANIZER', 'ADMIN'].includes(userRole);
    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await commentRepository.delete(commentId);
  }
}

export const commentService = new CommentService();
