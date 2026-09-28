import { judgeAssignmentRepository, EnrichedJudgeAssignment } from '../repositories/judgeAssignment.repository';
import { submissionRepository, EnrichedSubmission } from '../repositories/submission.repository';
import { rubricRepository } from '../repositories/rubric.repository';
import { scoreRepository, EnrichedScore } from '../repositories/score.repository';
import { userRepository } from '../repositories/user.repository';
import { eventRepository } from '../repositories/event.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { auditService } from './audit.service';
import { JudgeAssignment, UserRole } from '../models';

export interface JudgeSubmissionDetail {
  assignment: JudgeAssignment;
  submission: EnrichedSubmission;
  rubric: any;
  existingScores: EnrichedScore[];
}

export class JudgeService {
  async getAssignmentsForJudge(judgeId: string, eventId?: string): Promise<EnrichedJudgeAssignment[]> {
    return await judgeAssignmentRepository.listAssignmentsForJudge(judgeId, eventId);
  }

  async getJudgeSubmissionDetail(judgeUserId: string, submissionId: string): Promise<JudgeSubmissionDetail> {
    // 1. Verify judge assignment exists for this exact authenticated judge (Rule 16: Judging Isolation)
    const assignment = await judgeAssignmentRepository.findByJudgeAndSubmission(judgeUserId, submissionId);
    if (!assignment) {
      throw new ForbiddenError('Access denied: You are not assigned to evaluate this submission.');
    }

    // 2. Fetch submission
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError('Assigned submission not found.');
    }

    // 3. Fetch rubric for this event
    const rubric = await rubricRepository.findByEventId(submission.event_id);

    // 4. Fetch existing scores by this judge
    const existingScores = await scoreRepository.findByJudgeAndSubmission(judgeUserId, submissionId);

    return {
      assignment,
      submission,
      rubric,
      existingScores,
    };
  }

  async assignJudge(data: {
    event_id: string;
    judge_id: string;
    submission_id: string;
    assignerUserId: string;
  }): Promise<JudgeAssignment> {
    const judgeUser = await userRepository.findById(data.judge_id);
    if (!judgeUser || !['JUDGE', 'ORGANIZER', 'ADMIN'].includes(judgeUser.role)) {
      throw new ForbiddenError('Target user must have the JUDGE, ORGANIZER, or ADMIN role');
    }

    const submission = await submissionRepository.findById(data.submission_id);
    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    const existing = await judgeAssignmentRepository.findByJudgeAndSubmission(data.judge_id, data.submission_id);
    if (existing) {
      throw new ConflictError('Judge is already assigned to this submission');
    }

    const assignment = await judgeAssignmentRepository.create(data);

    await auditService.log({
      user_id: data.assignerUserId,
      action: 'JUDGE_ASSIGNED',
      entity_type: 'judge_assignment',
      entity_id: assignment.id,
      details: { judgeId: data.judge_id, submissionId: data.submission_id },
    });

    return assignment;
  }

  async removeAssignment(assignmentId: string, operatorUserId: string): Promise<void> {
    const assignment = await judgeAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundError('Judge assignment not found');
    }

    await judgeAssignmentRepository.delete(assignmentId);

    await auditService.log({
      user_id: operatorUserId,
      action: 'JUDGE_UNASSIGNED',
      entity_type: 'judge_assignment',
      entity_id: assignmentId,
      details: { judgeId: assignment.judge_id, submissionId: assignment.submission_id },
    });
  }

  async listAssignmentsForEvent(eventId: string): Promise<EnrichedJudgeAssignment[]> {
    return await judgeAssignmentRepository.listAssignmentsForEvent(eventId);
  }
}

export const judgeService = new JudgeService();
