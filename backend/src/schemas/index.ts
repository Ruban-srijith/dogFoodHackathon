import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and dashes'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    full_name: z.string().min(2).max(100),
    role: z.enum(['VISITOR', 'PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN']).optional(),
    bio: z.string().max(500).optional(),
    avatar_url: z.string().url().optional().or(z.literal('')),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
});

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().min(10),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    submission_deadline: z.string().datetime(),
    status: z.enum(['draft', 'published', 'ongoing', 'voting', 'judging', 'closed']).optional(),
    banner_url: z.string().url().optional().or(z.literal('')),
    location: z.string().max(255).optional(),
  }).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date']
  }).refine((data) => new Date(data.submission_deadline) <= new Date(data.end_date), {
    message: 'Submission deadline must be before or equal to end date',
    path: ['submission_deadline']
  })
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().min(10).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    submission_deadline: z.string().datetime().optional(),
    status: z.enum(['draft', 'published', 'ongoing', 'voting', 'judging', 'closed']).optional(),
    banner_url: z.string().url().optional().or(z.literal('')),
    location: z.string().max(255).optional(),
  })
});

export const createTrackSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    prize_pool: z.string().max(100).optional(),
  })
});

export const createTeamSchema = z.object({
  body: z.object({
    event_id: z.string().uuid(),
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
  })
});

export const joinTeamSchema = z.object({
  body: z.object({
    invite_code: z.string().min(6).max(32),
  })
});

export const createSubmissionSchema = z.object({
  body: z.object({
    event_id: z.string().uuid(),
    team_id: z.string().uuid(),
    track_id: z.string().uuid().optional().nullable(),
    title: z.string().min(3).max(200),
    tagline: z.string().min(5).max(255),
    description: z.string().min(20),
    repo_url: z.string().url('Must be a valid repository URL'),
    demo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    tech_stack: z.array(z.string()).default([]),
    status: z.enum(['draft', 'submitted']).default('draft'),
  })
});

export const updateSubmissionSchema = z.object({
  body: z.object({
    track_id: z.string().uuid().optional().nullable(),
    title: z.string().min(3).max(200).optional(),
    tagline: z.string().min(5).max(255).optional(),
    description: z.string().min(20).optional(),
    repo_url: z.string().url('Must be a valid repository URL').optional(),
    demo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    tech_stack: z.array(z.string()).optional(),
    status: z.enum(['draft', 'submitted']).optional(),
  })
});

export const createRubricSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    max_score: z.number().positive().default(100),
  })
});

export const createCriterionSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    weight: z.number().positive().default(1.0),
    max_points: z.number().positive().default(10),
  })
});

export const assignJudgeSchema = z.object({
  body: z.object({
    judge_id: z.string().uuid('Judge ID must be a valid UUID'),
    submission_id: z.string().uuid('Submission ID must be a valid UUID'),
  })
});

export const submitScoreSchema = z.object({
  body: z.object({
    criterion_id: z.string().uuid('Criterion ID must be a valid UUID'),
    points: z.number().min(0, 'Points cannot be negative'),
    feedback: z.string().max(2000).optional(),
  })
});

export const castVoteSchema = z.object({
  body: z.object({
    event_id: z.string().uuid(),
    submission_id: z.string().uuid(),
  })
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
    is_internal: z.boolean().default(false),
  })
});

export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid UUID parameter'),
  })
});
