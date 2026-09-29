export type UserRole = 'VISITOR' | 'PARTICIPANT' | 'JUDGE' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'voting' | 'judging' | 'closed';

export interface Event {
  id: string;
  title: string;
  name?: string;
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
  participation_type?: 'individual' | 'team' | 'both';
  min_team_size?: number;
  max_team_size?: number;
  tracks?: Track[];
  rubric?: RubricWithCriteria;
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
  members?: TeamMemberWithUser[];
}

export interface TeamMemberWithUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string | null;
  member_role: 'leader' | 'member';
  joined_at: string;
}

export type SubmissionStatus = 'draft' | 'submitted';

export interface Submission {
  id: string;
  event_id: string;
  team_id: any;
  track_id?: any;
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
  team_name?: string;
  leader_id?: string;
  track_name?: string | null;
  vote_count?: number;
  comments_count?: number;
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

export interface RubricWithCriteria {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  max_score: number;
  criteria: RubricCriterion[];
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
  submission_title?: string;
  submission_tagline?: string;
  submission_repo_url?: string;
  submission_demo_url?: string | null;
  submission_video_url?: string | null;
  submission_description?: string;
  team_name?: string;
  judge_name?: string;
  judge_email?: string;
  scored_criteria_count?: number;
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
  criterion_name?: string;
  max_points?: number;
  weight?: number;
}

export interface VoteLeaderboardItem {
  submission_id: string;
  submission_title: string;
  team_name: string;
  track_name?: string | null;
  vote_count: number;
}

export interface Comment {
  id: string;
  submission_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_role: string;
  author_avatar?: string | null;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
}
