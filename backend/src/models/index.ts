export type UserRole = 'VISITOR' | 'PARTICIPANT' | 'JUDGE' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'voting' | 'judging' | 'closed';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  status: EventStatus;
  banner_url?: string | null;
  location?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  prize_pool?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  description?: string | null;
  leader_id: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
}

export type SubmissionStatus = 'draft' | 'submitted';

export interface Submission {
  id: string;
  event_id: string;
  team_id: string;
  track_id?: string | null;
  title: string;
  tagline: string;
  description: string;
  repo_url: string;
  demo_url?: string | null;
  video_url?: string | null;
  tech_stack: string[];
  status: SubmissionStatus;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rubric {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  max_score: number;
  created_at: string;
  updated_at: string;
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  name: string;
  description?: string | null;
  weight: number;
  max_points: number;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';

export interface JudgeAssignment {
  id: string;
  event_id: string;
  judge_id: string;
  submission_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  assignment_id: string;
  judge_id: string;
  submission_id: string;
  criterion_id: string;
  points: number;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  event_id: string;
  user_id: string;
  submission_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  submission_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_ROLE_UPDATED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_STATUS_CHANGED'
  | 'TEAM_CREATED'
  | 'TEAM_JOINED'
  | 'SUBMISSION_CREATED'
  | 'SUBMISSION_UPDATED'
  | 'SUBMISSION_SUBMITTED'
  | 'JUDGE_ASSIGNED'
  | 'JUDGE_UNASSIGNED'
  | 'SCORE_CREATED'
  | 'SCORE_UPDATED'
  | 'VOTE_CREATED'
  | 'VOTE_REJECTED'
  | 'RESULTS_PUBLISHED';

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}
