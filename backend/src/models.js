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
  tech_stack: [{ type: String }],
  status: { 
    type: String, 
    enum: ['draft', 'submitted'],
    default: 'draft' 
  },
  submitted_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const Track = mongoose.model('Track', trackSchema);
const Prize = mongoose.model('Prize', prizeSchema);
const Team = mongoose.model('Team', teamSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = {
  User,
  Event,
  Track,
  Prize,
  Team,
  Submission
};
