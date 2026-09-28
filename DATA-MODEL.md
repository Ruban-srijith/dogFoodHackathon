# DOGFOOD — Data Model Specification

Complete Mongoose collections, field definitions, relationships, and CSV export endpoints.

---

## 1. MongoDB Collections & Fields

### 1. `users`
* `_id` (`ObjectId`, PK): Unique user ID.
* `username` (`String`, required, unique): Alphanumeric username.
* `email` (`String`, required, unique): User email.
* `password_hash` (`String`, required): Salted bcrypt hash (stripped by `toJSON`/`toObject`).
* `role` (`String`, enum: `['ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT', 'VISITOR']`, default: `'PARTICIPANT'`).
* `full_name` (`String`, required): Display name.
* `bio` (`String`): Biography.
* `avatar_url` (`String`): Profile image URL.
* `created_at` (`Date`, default: `Date.now`).

### 2. `events`
* `_id` (`ObjectId`, PK): Unique event ID.
* `title` (`String`, required): Hackathon title.
* `slug` (`String`, required, unique): URL slug.
* `description` (`String`, required): Event overview.
* `start_date` (`Date`, required): Event start timestamp.
* `end_date` (`Date`, required): Event end timestamp (`start_date < end_date`).
* `submission_deadline` (`Date`, required): Hard deadline for submission & team changes.
* `status` (`String`, enum: `['draft', 'published', 'ongoing', 'voting', 'judging', 'closed']`, default: `'ongoing'`).
* `location` (`String`, default: `'Global / Decentralized'`).
* `created_by` (`ObjectId`, ref: `'User'`): Organizer who created event.
* `created_at` (`Date`, default: `Date.now`).

### 3. `tracks`
* `_id` (`ObjectId`, PK): Unique track ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Parent event.
* `name` (`String`, required): Track name.
* `description` (`String`): Track details.
* `prize_pool` (`String`): Prize bounty description.

### 4. `prizes`
* `_id` (`ObjectId`, PK): Unique prize ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Parent event.
* `title` (`String`, required): Award title.
* `award_amount` (`String`, required): Prize amount or award item.
* `description` (`String`): Criteria.

### 5. `teams`
* `_id` (`ObjectId`, PK): Unique team ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Associated event.
* `name` (`String`, required): Team name.
* `slug` (`String`, required): Slugified name.
* `description` (`String`): Team description.
* `leader_id` (`ObjectId`, ref: `'User'`, required): Team captain.
* `invite_code` (`String`, required, unique): 8-character secret invite token.
* `members` ([`ObjectId`], ref: `'User'`): Member user IDs (**capped at 4 members**).
* `created_at` (`Date`, default: `Date.now`).

### 6. `submissions`
* `_id` (`ObjectId`, PK): Unique submission ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Associated event.
* `team_id` (`ObjectId`, ref: `'Team'`, required): Owner team.
* `track_id` (`ObjectId`, ref: `'Track'`, required): Selected track.
* `title` (`String`, required): Project title.
* `tagline` (`String`): Short pitch.
* `description` (`String`, required): Project description.
* `repo_url` (`String`): Source code repository.
* `demo_url` (`String`): Demonstration / deployment link.
* `tech_stack` ([`String`]): Technologies used.
* `status` (`String`, enum: `['draft', 'submitted']`, default: `'draft'`).
* `submitted_at` (`Date`, default: `Date.now`).
* `updated_at` (`Date`, default: `Date.now`).

### 7. `judgeinvites`
* `_id` (`ObjectId`, PK): Unique invite ID.
* `event_id` (`ObjectId`, ref: `'Event'`): Optional linked event.
* `email` (`String`): Targeted recipient email.
* `invite_code` (`String`, required, unique): Unique invitation code.
* `invited_by` (`ObjectId`, ref: `'User'`, required): Inviting organizer.
* `status` (`String`, enum: `['pending', 'accepted', 'expired']`, default: `'pending'`).
* `accepted_by` (`ObjectId`, ref: `'User'`): User who redeemed invite.
* `created_at` (`Date`, default: `Date.now`).

### 8. `judgeassignments`
* `_id` (`ObjectId`, PK): Unique assignment ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Associated event.
* `submission_id` (`ObjectId`, ref: `'Submission'`, required): Project to evaluate.
* `judge_id` (`ObjectId`, ref: `'User'`, required): Assigned judge.
* `assigned_by` (`ObjectId`, ref: `'User'`): Organizer who created assignment.
* `status` (`String`, enum: `['assigned', 'in_progress', 'completed']`, default: `'assigned'`).
* `created_at` (`Date`, default: `Date.now`).
* *Index*: `{ submission_id: 1, judge_id: 1 }` (unique constraint).

### 9. `rubriccriteria`
* `_id` (`ObjectId`, PK): Unique criterion ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Associated event.
* `name` (`String`, required): Criterion name.
* `description` (`String`, default: `''`): Evaluation guidelines.
* `weight` (`Number`, default: `1.0`): Multiplier for weighted total.
* `min_score` (`Number`, default: `0`): Minimum score allowed.
* `max_score` (`Number`, default: `10`): Maximum score allowed.
* `created_at` (`Date`, default: `Date.now`).

### 10. `evaluationscores`
* `_id` (`ObjectId`, PK): Unique score ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Associated event.
* `submission_id` (`ObjectId`, ref: `'Submission'`, required): Evaluated project.
* `judge_id` (`ObjectId`, ref: `'User'`, required): Evaluating judge.
* `criteria_scores`: Array of objects:
  * `criterion_id` (`ObjectId`, ref: `'RubricCriterion'`, required)
  * `name` (`String`)
  * `score` (`Number`, required)
  * `weight` (`Number`, default: `1.0`)
* `comment` (`String`, default: `''`): Qualitative feedback.
* `weighted_total` (`Number`, default: `0`): Server-calculated weighted score.
* `status` (`String`, enum: `['draft', 'submitted']`, default: `'draft'`).
* `created_at` (`Date`, default: `Date.now`).
* `updated_at` (`Date`, default: `Date.now`).
* `submitted_at` (`Date`): Timestamp when finalized.
* *Index*: `{ submission_id: 1, judge_id: 1 }` (unique constraint).

### 11. `votes`
* `_id` (`ObjectId`, PK): Unique vote ID.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Associated event.
* `submission_id` (`ObjectId`, ref: `'Submission'`, required): Voted project.
* `user_id` (`ObjectId`, ref: `'User'`, required): Voting user.
* `created_at` (`Date`, default: `Date.now`).
* *Index*: `{ event_id: 1, user_id: 1 }` (unique constraint: 1 vote per user per event).

### 12. `comments`
* `_id` (`ObjectId`, PK): Unique comment ID.
* `submission_id` (`ObjectId`, ref: `'Submission'`, required): Associated project.
* `author_id` (`ObjectId`, ref: `'User'`, required): Comment author.
* `content` (`String`, required): Text content.
* `is_internal` (`Boolean`, default: `false`): If true, visible only to judges and organizers.
* `created_at` (`Date`, default: `Date.now`).

---

## 2. CSV Export Endpoints & Data Paths

All exports require authenticated `ORGANIZER` or `ADMIN` roles. Routes are available under `GET /api/export/:resource`, `GET /api/v1/export/:resource`, and `GET /api/export?type=:resource`.

| Resource | Endpoint | CSV Column Headers |
| :--- | :--- | :--- |
| **Participants** | `GET /api/export/participants` | `Participant ID,Username,Full Name,Email,Role,Team Name,Team ID,Registered At` |
| **Teams** | `GET /api/export/teams` | `Team ID,Team Name,Slug,Leader Username,Leader Email,Member Count,Members,Invite Code,Created At` |
| **Submissions** | `GET /api/export/submissions` | `Submission ID,Title,Tagline,Team Name,Track,Status,Repo URL,Demo URL,Tech Stack,Submitted At` |
| **Assignments** | `GET /api/export/assignments` | `Assignment ID,Judge ID,Judge Name,Judge Email,Submission ID,Project Title,Team Name,Assignment Status,Evaluation Status,Assigned At` |
| **Raw Scores** | `GET /api/export/raw_scores` | `Score ID,Submission ID,Project Title,Team Name,Track,Judge ID,Judge Name,Judge Email,Weighted Total,Status,Comment,Criteria Breakdown,Submitted At` |
| **Normalized Scores** | `GET /api/export/normalized_scores` | `Submission ID,Project Title,Track,Team Name,Judge ID,Judge Name,Judge Email,Raw Score,Judge Mean,Judge StdDev,Z-Score,Rescaled Score (0-100)` |
| **Final Results** | `GET /api/export/final_results` | `Normalized Rank,Raw Rank,Rank Shift,Project Title,Team Name,Track,Normalized Score (0-100),Raw Average Score,Judge Count,Submission Status,Repo URL,Demo URL` |

*Note: An optional `?event_id=<id>` query parameter filters the export to a specific event.*
