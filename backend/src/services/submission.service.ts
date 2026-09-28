import { submissionRepository, EnrichedSubmission } from '../repositories/submission.repository';
import { teamRepository } from '../repositories/team.repository';
import { eventRepository } from '../repositories/event.repository';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/errors';
import { auditService } from './audit.service';
import { Submission, SubmissionStatus, UserRole } from '../models';

export class SubmissionService {
  async getSubmissionById(id: string, currentUser?: { userId: string; role: UserRole }): Promise<EnrichedSubmission> {
    const submission = await submissionRepository.findById(id);
    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    // If draft, only team members, organizers, or admins can view it
    if (submission.status === 'draft') {
      if (!currentUser) {
        throw new ForbiddenError('This submission is in draft mode');
      }
      const isPrivileged = ['ORGANIZER', 'ADMIN'].includes(currentUser.role);
      const isMember = await submissionRepository.isMemberOfSubmissionTeam(currentUser.userId, id);
      if (!isPrivileged && !isMember) {
        throw new ForbiddenError('You do not have access to view this draft submission');
      }
    }

    return submission;
  }

  async listGallerySubmissions(eventId: string): Promise<EnrichedSubmission[]> {
    return await submissionRepository.listByEvent(eventId, true);
  }

  async listEventSubmissions(eventId: string, currentUser?: { userId: string; role: UserRole }): Promise<EnrichedSubmission[]> {
    const isPrivileged = currentUser && ['ORGANIZER', 'ADMIN'].includes(currentUser.role);
    return await submissionRepository.listByEvent(eventId, !isPrivileged);
  }

  async createSubmission(data: {
    event_id: string;
    team_id: string;
    track_id?: string | null;
    title: string;
    tagline: string;
    description: string;
    repo_url: string;
    demo_url?: string | null;
    video_url?: string | null;
    tech_stack?: string[];
    status?: SubmissionStatus;
    userId: string;
    userRole: UserRole;
  }): Promise<Submission> {
    const event = await eventRepository.findById(data.event_id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const team = await teamRepository.findById(data.team_id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Verify team belongs to event
    if (team.event_id !== data.event_id) {
      throw new BadRequestError('Team does not belong to the specified event');
    }

    // Verify user is team member or leader (unless admin)
    const members = await teamRepository.getMembers(team.id);
    const isMember = members.some((m) => m.id === data.userId);
    if (!isMember && data.userRole !== 'ADMIN') {
      throw new ForbiddenError('Only team members can create a submission for this team');
    }

    // Check if team already has a submission
    const existing = await submissionRepository.findByTeamId(team.id);
    if (existing) {
      throw new ConflictError('A submission already exists for this team. Please update the existing submission.');
    }

    const submission = await submissionRepository.create({
      event_id: data.event_id,
      team_id: data.team_id,
      track_id: data.track_id,
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      repo_url: data.repo_url,
      demo_url: data.demo_url,
      video_url: data.video_url,
      tech_stack: data.tech_stack,
      status: data.status || 'draft',
    });

    await auditService.log({
      user_id: data.userId,
      action: data.status === 'submitted' ? 'SUBMISSION_SUBMITTED' : 'SUBMISSION_CREATED',
      entity_type: 'submission',
      entity_id: submission.id,
      details: { title: submission.title, teamId: team.id },
    });

    return submission;
  }

  async updateSubmission(
    id: string,
    data: Partial<Submission>,
    userId: string,
    userRole: UserRole
  ): Promise<Submission> {
    const existing = await submissionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Submission not found');
    }

    // Server-side authorization check (Rule 8 & 28)
    const isMember = await submissionRepository.isMemberOfSubmissionTeam(userId, id);
    const isPrivileged = ['ORGANIZER', 'ADMIN'].includes(userRole);
    if (!isMember && !isPrivileged) {
      throw new ForbiddenError('You do not have permission to modify this submission');
    }

    const updated = await submissionRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Failed to update submission');
    }

    const action = data.status === 'submitted' && existing.status !== 'submitted'
      ? 'SUBMISSION_SUBMITTED'
      : 'SUBMISSION_UPDATED';

    await auditService.log({
      user_id: userId,
      action,
      entity_type: 'submission',
      entity_id: id,
      details: { title: updated.title, status: updated.status },
    });

    return updated;
  }
}

export const submissionService = new SubmissionService();
