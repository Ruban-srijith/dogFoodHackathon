import { voteRepository, VoteLeaderboardItem } from '../repositories/vote.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { eventRepository } from '../repositories/event.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { auditService } from './audit.service';
import { Vote } from '../models';

export class VoteService {
  async castVote(data: {
    event_id: string;
    submission_id: string;
    user_id: string;
  }): Promise<{ vote: Vote; currentCount: number }> {
    const event = await eventRepository.findById(data.event_id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const submission = await submissionRepository.findById(data.submission_id);
    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    if (submission.event_id !== data.event_id) {
      throw new BadRequestError('Submission does not belong to this event');
    }

    if (submission.status !== 'submitted') {
      throw new BadRequestError('Cannot vote for a draft project');
    }

    const existingVote = await voteRepository.findByUserAndEvent(data.user_id, data.event_id);
    if (existingVote) {
      throw new ConflictError('You have already cast your vote in this event. Each participant can only vote once per hackathon.');
    }

    const vote = await voteRepository.create(data);
    const currentCount = await voteRepository.countBySubmission(data.submission_id);

    await auditService.log({
      user_id: data.user_id,
      action: 'VOTE_CREATED',
      entity_type: 'vote',
      entity_id: vote.id,
      details: { eventId: data.event_id, submissionId: data.submission_id },
    });

    return { vote, currentCount };
  }

  async getLeaderboard(eventId: string): Promise<VoteLeaderboardItem[]> {
    return await voteRepository.getLeaderboard(eventId);
  }

  async getUserVoteForEvent(userId: string, eventId: string): Promise<Vote | null> {
    return await voteRepository.findByUserAndEvent(userId, eventId);
  }
}

export const voteService = new VoteService();
