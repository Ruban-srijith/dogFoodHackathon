import { scoreRepository, SubmissionScoreAggregate, EnrichedScore } from '../repositories/score.repository';
import { judgeAssignmentRepository } from '../repositories/judgeAssignment.repository';
import { rubricRepository } from '../repositories/rubric.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { auditService } from './audit.service';
import { Score } from '../models';

export class ScoreService {
  async submitScore(data: {
    judge_id: string;
    submission_id: string;
    criterion_id: string;
    points: number;
    feedback?: string | null;
  }): Promise<Score> {
    // 1. Verify judge assignment exists for this exact judge and submission (Rule 16: Judging Isolation)
    const assignment = await judgeAssignmentRepository.findByJudgeAndSubmission(data.judge_id, data.submission_id);
    if (!assignment) {
      throw new ForbiddenError('You are not authorized to score this submission because you are not assigned to it.');
    }

    // 2. Fetch submission and event rubric
    const submission = await submissionRepository.findById(data.submission_id);
    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    const rubric = await rubricRepository.findByEventId(submission.event_id);
    if (!rubric) {
      throw new NotFoundError('No evaluation rubric configured for this event');
    }

    // 3. Find the criterion and validate max points
    const criterion = rubric.criteria.find((c) => c.id === data.criterion_id);
    if (!criterion) {
      throw new BadRequestError('Invalid rubric criterion specified for this event');
    }

    if (data.points > Number(criterion.max_points)) {
      throw new BadRequestError(`Points (${data.points}) cannot exceed maximum allowed (${criterion.max_points}) for criterion "${criterion.name}"`);
    }

    // 4. Upsert score
    const score = await scoreRepository.upsertScore({
      assignment_id: assignment.id,
      judge_id: data.judge_id,
      submission_id: data.submission_id,
      criterion_id: data.criterion_id,
      points: data.points,
      feedback: data.feedback,
    });

    // 5. Check if all criteria are now scored to update assignment status
    const allJudgeScores = await scoreRepository.findByJudgeAndSubmission(data.judge_id, data.submission_id);
    if (allJudgeScores.length >= rubric.criteria.length) {
      await judgeAssignmentRepository.updateStatus(assignment.id, 'completed');
    } else {
      await judgeAssignmentRepository.updateStatus(assignment.id, 'in_progress');
    }

    // 6. Record audit log
    await auditService.log({
      user_id: data.judge_id,
      action: 'SCORE_CREATED',
      entity_type: 'score',
      entity_id: score.id,
      details: {
        submissionId: data.submission_id,
        criterionId: data.criterion_id,
        points: data.points,
      },
    });

    return score;
  }

  async getJudgeScoresForSubmission(judgeId: string, submissionId: string): Promise<EnrichedScore[]> {
    return await scoreRepository.findByJudgeAndSubmission(judgeId, submissionId);
  }

  async getAggregateResultsForEvent(eventId: string): Promise<SubmissionScoreAggregate[]> {
    return await scoreRepository.getAggregateScoresForEvent(eventId);
  }
}

export const scoreService = new ScoreService();
