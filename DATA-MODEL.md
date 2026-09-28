# DOGFOOD — Data Model Specification

> **Mongoose collections, schema field definitions, relationship constraints, and CSV export endpoints.**

---

## 1. MongoDB Collections

### 1. `users`
* `_id` (`ObjectId`, PK): Unique user identifier.
* `username` (`String`, required, unique): Alphanumeric login handle.
* `email` (`String`, required, unique): User email address.
* `password_hash` (`String`, required): Bcrypt salted hash (automatically removed via `toJSON` transform).
* `role` (`String`, required, enum: `['ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT', 'VISITOR']`, default: `'PARTICIPANT'`).
* `full_name` (`String`, required): User display name.
* `bio` (`String`): User biography.
* `avatar_url` (`String`): Profile image path or URL.
* `created_at` (`Date`, default: `Date.now`).

### 2. `events`
* `_id` (`ObjectId`, PK): Unique event identifier.
* `title` (`String`, required): Hackathon competition title.
* `slug` (`String`, required, unique): URL slug.
* `description` (`String`, required): Event summary.
* `start_date` (`Date`, required): Event commencement.
* `end_date` (`Date`, required): Event conclusion.
* `submission_deadline` (`Date`, required): Strict project submission deadline.
* `status` (`String`, enum: `['draft', 'published', 'ongoing', 'voting', 'judging', 'closed']`, default: `'ongoing'`).
* `location` (`String`, default: `'Global / Decentralized'`).
* `created_by` (`ObjectId`, ref: `'User'`): Organizer ID who created the event.
* `created_at` (`Date`, default: `Date.now`).

### 3. `tracks`
* `_id` (`ObjectId`, PK): Unique track identifier.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Parent hackathon.
* `name` (`String`, required): Track name (e.g. "Autonomous Agents & DevTools").
* `description` (`String`): Detailed track overview.
* `prize_pool` (`String`): Bounty or prize description.

### 4. `prizes`
* `_id` (`ObjectId`, PK): Unique prize identifier.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Parent hackathon.
* `title` (`String`, required): Prize title (e.g. "Grand Champion").
* `award_amount` (`String`, required): Monetary value or award item.
* `description` (`String`): Award criteria.

### 5. `teams`
* `_id` (`ObjectId`, PK): Unique team identifier.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Competing event.
* `name` (`String`, required): Team name.
* `slug` (`String`, required): Slugified team name.
* `description` (`String`): Team summary.
* `leader_id` (`ObjectId`, ref: `'User'`, required): Creator/Captain.
* `invite_code` (`String`, required, unique): Unique 8-character secret invite code (hidden from public APIs).
* `members` ([`ObjectId`], ref: `'User'`): Team members array (**strictly capped at maximum 4 members**).
* `created_at` (`Date`, default: `Date.now`).

### 6. `submissions`
* `_id` (`ObjectId`, PK): Unique submission identifier.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Competing event.
* `team_id` (`ObjectId`, ref: `'Team'`, required): Owning team.
* `track_id` (`ObjectId`, ref: `'Track'`, required): Selected track.
* `title` (`String`, required): Project title.
* `tagline` (`String`): One-sentence elevator pitch.
* `description` (`String`, required): Markdown project breakdown.
* `repo_url` (`String`): Source code repository URL.
* `demo_url` (`String`): Live demonstration or deployment link.
* `tech_stack` ([`String`]): Array of technologies used.
* `status` (`String`, enum: `['draft', 'submitted']`, default: `'draft'`).
* `submitted_at` (`Date`, default: `Date.now`).
* `updated_at` (`Date`, default: `Date.now`).

### 7. `judgeinvites`
* `_id` (`ObjectId`, PK): Unique invite identifier.
* `event_id` (`ObjectId`, ref: `'Event'`): Optional linked event.
* `email` (`String`): Targeted judge recipient email.
* `invite_code` (`String`, required, unique): Secure invite token.
* `invited_by` (`ObjectId`, ref: `'User'`, required): Inviting organizer.
* `status` (`String`, enum: `['pending', 'accepted', 'expired']`, default: `'pending'`).
* `accepted_by` (`ObjectId`, ref: `'User'`): User who accepted.
* `created_at` (`Date`, default: `Date.now`).

### 8. `judgeassignments`
* `_id` (`ObjectId`, PK): Unique assignment identifier.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Hackathon event.
* `submission_id` (`ObjectId`, ref: `'Submission'`, required): Project to evaluate.
* `judge_id` (`ObjectId`, ref: `'User'`, required): Assigned evaluator.
* `assigned_by` (`ObjectId`, ref: `'User'`): Organizer ID who assigned.
* `status` (`String`, enum: `['assigned', 'in_progress', 'completed']`, default: `'assigned'`).
* `created_at` (`Date`, default: `Date.now`).
* **Compound Index**: `{ submission_id: 1, judge_id: 1 }` (unique constraint).

### 9. `rubriccriteria`
* `_id` (`ObjectId`, PK): Unique criterion identifier.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Hackathon event.
* `name` (`String`, required): Pillar title (e.g. "Innovation & Novelty").
* `description` (`String`): Scoring guidelines.
* `weight` (`Number`, default: `1.0`): Multiplier applied in evaluation totals.
* `min_score` (`Number`, default: `0`): Minimum allowable score.
* `max_score` (`Number`, default: `10`): Maximum allowable score.
* `created_at` (`Date`, default: `Date.now`).

### 10. `evaluationscores`
* `_id` (`ObjectId`, PK): Unique score identifier.
* `event_id` (`ObjectId`, ref: `'Event'`, required): Associated event.
* `submission_id` (`ObjectId`, ref: `'Submission'`, required): Evaluated project.
* `judge_id` (`ObjectId`, ref: `'User'`, required): Evaluating judge.
* `criteria_scores`: Array of scored rubric criteria:
  * `criterion_id` (`ObjectId`, ref: `'RubricCriterion'`, required)
  * `name` (`String`)
  * `score` (`Number`, required)
  * `weight` (`Number`, default: `1.0`)
* `comment` (`String`): Qualitative judge feedback.
* `weighted_total` (`Number`, default: `0`): Server-calculated weighted aggregate.
* `status` (`String`, enum: `['draft', 'submitted']`, default: `'draft'`).
* `created_at` (`Date`, default: `Date.now`).
* `updated_at` (`Date`, default: `Date.now`).
* `submitted_at` (`Date`).
* **Compound Index**: `{ submission_id: 1, judge_id: 1 }` (unique constraint).

---

## 2. CSV Export Endpoints & Data Paths

The backend provides RFC 4180 compliant CSV exports strictly protected by `requireRole('organizer', 'admin')`:

| Export Resource | Endpoint URL | Exported CSV Headers |
| :--- | :--- | :--- |
| **Participants** | `GET /api/export/participants` | `User ID,Username,Email,Full Name,Role,Created At` |
| **Teams** | `GET /api/export/teams` | `Team ID,Team Name,Slug,Event ID,Leader ID,Leader Name,Leader Email,Member Count,Members,Created At` |
| **Submissions** | `GET /api/export/submissions` | `Submission ID,Title,Tagline,Event ID,Event Title,Team ID,Team Name,Track ID,Track Name,Status,Repo URL,Demo URL,Tech Stack,Submitted At` |
| **Assignments** | `GET /api/export/assignments` | `Assignment ID,Event ID,Submission ID,Submission Title,Team Name,Judge ID,Judge Username,Judge Full Name,Judge Email,Status,Assigned At` |
| **Raw Scores** | `GET /api/export/raw_scores` | `Score ID,Submission ID,Submission Title,Team Name,Judge ID,Judge Name,Weighted Total,Status,Criteria Breakdown,Judge Comment,Updated At` |
| **Normalized Scores** | `GET /api/export/normalized_scores` | `Rank,Submission ID,Title,Team,Track,Evaluations Count,Raw Score,Z Score Min,Z Score Max,Normalized Score (0-100)` |
| **Final Results** | `GET /api/export/final_results` | `Normalized Rank,Raw Rank,Rank Delta,Submission ID,Title,Team,Track,Evaluations Count,Raw Score,Normalized Score (0-100)` |

*Note: Query parameters `?type=<resource>` and `?event_id=<id>` are also supported on `GET /api/export`.*
