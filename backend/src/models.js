const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT', 'VISITOR'],
    default: 'PARTICIPANT'
  },
  full_name: { type: String, required: true },
  bio: { type: String },
  avatar_url: { type: String },
  created_at: { type: Date, default: Date.now }
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password_hash;
    return ret;
  }
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password_hash;
    return ret;
  }
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  submission_deadline: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'ongoing', 'voting', 'judging', 'closed'],
    default: 'ongoing'
  },
  location: { type: String, default: 'Global / Decentralized' },
  participation_type: { 
    type: String, 
    enum: ['individual', 'team', 'both'], 
    default: 'both' 
  },
  min_team_size: { type: Number, default: 1 },
  max_team_size: { type: Number, default: 4 },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

const trackSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  description: { type: String },
  prize_pool: { type: String }
});

const prizeSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true },
  award_amount: { type: String, required: true },
  description: { type: String }
});

const teamSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  leader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invite_code: { type: String, required: true, unique: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  created_at: { type: Date, default: Date.now }
});

const submissionSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  track_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
  title: { type: String, required: true },
  tagline: { type: String },
  description: { type: String, required: true },
  repo_url: { type: String },
  demo_url: { type: String },
  video_url: { type: String },
  tech_stack: [{ type: String }],
  status: { 
    type: String, 
    enum: ['draft', 'submitted'],
    default: 'draft' 
  },
  submitted_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const judgeInviteSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  email: { type: String },
  invite_code: { type: String, required: true, unique: true },
  invited_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'expired'], 
    default: 'pending' 
  },
  accepted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

const judgeAssignmentSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  submission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  judge_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['assigned', 'in_progress', 'completed'], 
    default: 'assigned' 
  },
  created_at: { type: Date, default: Date.now }
});

judgeAssignmentSchema.index({ submission_id: 1, judge_id: 1 }, { unique: true });

const rubricCriterionSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  weight: { type: Number, default: 1.0 },
  min_score: { type: Number, default: 0 },
  max_score: { type: Number, default: 10 },
  created_at: { type: Date, default: Date.now }
});

const evaluationScoreSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  submission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  judge_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  criteria_scores: [{
    criterion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RubricCriterion', required: true },
    name: { type: String },
    score: { type: Number, required: true },
    weight: { type: Number, default: 1.0 }
  }],
  comment: { type: String, default: '' },
  weighted_total: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'submitted'], 
    default: 'draft' 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  submitted_at: { type: Date }
});

evaluationScoreSchema.index({ submission_id: 1, judge_id: 1 }, { unique: true });

// Community vote: one per user per event, points at a submission
const voteSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  submission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
});
voteSchema.index({ event_id: 1, user_id: 1 }, { unique: true }); // one vote per user per event

// Threaded comment on a submission (judges and organizers can mark is_internal)
const commentSchema = new mongoose.Schema({
  submission_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  is_internal: { type: Boolean, default: false }, // true = only judges/organizers see it
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const Track = mongoose.model('Track', trackSchema);
const Prize = mongoose.model('Prize', prizeSchema);
const Team = mongoose.model('Team', teamSchema);
const Submission = mongoose.model('Submission', submissionSchema);
const JudgeInvite = mongoose.model('JudgeInvite', judgeInviteSchema);
const JudgeAssignment = mongoose.model('JudgeAssignment', judgeAssignmentSchema);
const RubricCriterion = mongoose.model('RubricCriterion', rubricCriterionSchema);
const EvaluationScore = mongoose.model('EvaluationScore', evaluationScoreSchema);
const Vote = mongoose.model('Vote', voteSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = {
  User,
  Event,
  Track,
  Prize,
  Team,
  Submission,
  JudgeInvite,
  JudgeAssignment,
  RubricCriterion,
  EvaluationScore,
  Score: EvaluationScore,
  Vote,
  Comment
};
