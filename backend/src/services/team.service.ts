import crypto from 'crypto';
import { teamRepository } from '../repositories/team.repository';
import { eventRepository } from '../repositories/event.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { auditService } from './audit.service';
import { Team, SafeUser } from '../models';

export interface TeamWithMembers extends Team {
  members: (SafeUser & { member_role: string; joined_at: string })[];
}

export class TeamService {
  async getTeamById(id: string): Promise<TeamWithMembers> {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    const members = await teamRepository.getMembers(id);
    return {
      ...team,
      members,
    };
  }

  async listTeamsForEvent(eventId: string): Promise<Team[]> {
    return await teamRepository.listByEvent(eventId);
  }

  async getUserTeamForEvent(userId: string, eventId: string): Promise<TeamWithMembers | null> {
    const team = await teamRepository.findUserTeamInEvent(userId, eventId);
    if (!team) return null;
    const members = await teamRepository.getMembers(team.id);
    return {
      ...team,
      members,
    };
  }

  async createTeam(data: {
    event_id: string;
    name: string;
    description?: string | null;
    leader_id: string;
  }): Promise<TeamWithMembers> {
    const event = await eventRepository.findById(data.event_id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if user is already in a team for this event
    const existingTeam = await teamRepository.findUserTeamInEvent(data.leader_id, data.event_id);
    if (existingTeam) {
      throw new ConflictError('You are already a member of a team in this hackathon');
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const team = await teamRepository.create({
      event_id: data.event_id,
      name: data.name,
      slug,
      description: data.description,
      leader_id: data.leader_id,
      invite_code: inviteCode,
    });

    await auditService.log({
      user_id: data.leader_id,
      action: 'TEAM_CREATED',
      entity_type: 'team',
      entity_id: team.id,
      details: { name: team.name, eventId: team.event_id },
    });

    const members = await teamRepository.getMembers(team.id);
    return {
      ...team,
      members,
    };
  }

  async joinTeam(inviteCode: string, userId: string): Promise<TeamWithMembers> {
    const team = await teamRepository.findByInviteCode(inviteCode.trim().toUpperCase());
    if (!team) {
      throw new NotFoundError('Invalid team invite code');
    }

    // Check if user is already in a team for this event
    const existingTeam = await teamRepository.findUserTeamInEvent(userId, team.event_id);
    if (existingTeam) {
      if (existingTeam.id === team.id) {
        throw new BadRequestError('You are already a member of this team');
      }
      throw new ConflictError('You are already a member of another team in this hackathon');
    }

    await teamRepository.addMember(team.id, userId, 'member');

    await auditService.log({
      user_id: userId,
      action: 'TEAM_JOINED',
      entity_type: 'team',
      entity_id: team.id,
      details: { teamName: team.name },
    });

    const members = await teamRepository.getMembers(team.id);
    return {
      ...team,
      members,
    };
  }
}

export const teamService = new TeamService();
