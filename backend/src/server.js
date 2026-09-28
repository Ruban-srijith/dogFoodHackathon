const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const { seedDatabaseIfEmpty, testCredentials } = require('./seed');
const { User, Event, Track, Prize, Team, Submission } = require('./models');
const { generateToken, authenticate, requireRole } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/app_db';

// Middleware stack
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ==========================================
// 1. PUBLIC HEALTHCHECK
// ==========================================
app.get('/api/health', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (!isDbReady) {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection not ready'
    });
  }
  return res.status(200).json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

// ==========================================
// 2. AUTHENTICATION ROUTES (Register, Login, Logout, Me)
// ==========================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, full_name, role } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, username, and password are required.'
      });
    }

    const assignedRole = (role || 'PARTICIPANT').toUpperCase();
    const validRoles = ['PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'];
    if (!validRoles.includes(assignedRole)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role '${role}'. Valid roles are: ${validRoles.join(', ')}.`
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A user with this email or username already exists.'
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password_hash,
      role: assignedRole,
      full_name: full_name || username
    });

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req, res) => {
  return res.status(200).json({ user: req.user });
});

// ==========================================
// 3. T1 FEATURE: ORGANIZER CREATES EVENTS
// Configurable dates, tracks, prizes
// ==========================================

// POST /api/events (Organizer or Admin only)
app.post('/api/events', authenticate, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { title, slug, description, start_date, end_date, submission_deadline, location, tracks, prizes } = req.body;

    if (!title || !description || !start_date || !end_date || !submission_deadline) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title, description, start_date, end_date, and submission_deadline are required.'
      });
    }

    const eventSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const event = await Event.create({
      title,
      slug: eventSlug,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      submission_deadline: new Date(submission_deadline),
      location: location || 'Global / Online',
      status: 'ongoing',
      created_by: req.user.id
    });

    // Create associated tracks if provided
    let createdTracks = [];
    if (Array.isArray(tracks) && tracks.length > 0) {
      const trackDocs = tracks.map(t => ({
        event_id: event._id,
        name: t.name,
        description: t.description || '',
        prize_pool: t.prize_pool || ''
      }));
      createdTracks = await Track.insertMany(trackDocs);
    }

    // Create associated prizes if provided
    let createdPrizes = [];
    if (Array.isArray(prizes) && prizes.length > 0) {
      const prizeDocs = prizes.map(p => ({
        event_id: event._id,
        title: p.title,
        award_amount: p.award_amount || '$0',
        description: p.description || ''
      }));
      createdPrizes = await Prize.insertMany(prizeDocs);
    }

    return res.status(201).json({
      message: 'Event created successfully',
      event,
      tracks: createdTracks,
      prizes: createdPrizes
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// GET /api/events (Public - List all events with tracks and prizes)
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ created_at: -1 }).lean();
    const eventIds = events.map(e => e._id);

    const [allTracks, allPrizes] = await Promise.all([
      Track.find({ event_id: { $in: eventIds } }).lean(),
      Prize.find({ event_id: { $in: eventIds } }).lean()
    ]);

    const enrichedEvents = events.map(ev => ({
      ...ev,
      tracks: allTracks.filter(t => String(t.event_id) === String(ev._id)),
      prizes: allPrizes.filter(p => String(p.event_id) === String(ev._id))
    }));

    return res.status(200).json(enrichedEvents);
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// GET /api/events/:id
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let event = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      event = await Event.findById(id).lean();
    } else {
      event = await Event.findOne({ slug: id }).lean();
    }

    if (!event) {
      return res.status(404).json({ error: 'Not Found', message: 'Event not found' });
    }

    const [tracks, prizes] = await Promise.all([
      Track.find({ event_id: event._id }).lean(),
      Prize.find({ event_id: event._id }).lean()
    ]);

    return res.status(200).json({ ...event, tracks, prizes });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// ==========================================
// 4. T1 FEATURE: TEAMS & INVITE LINKS (MAX 4 MEMBERS)
// ==========================================

// POST /api/teams (Participant creates a team and gets an invite link)
app.post('/api/teams', authenticate, requireRole('participant', 'admin'), async (req, res) => {
  try {
    const { event_id, name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Bad Request', message: 'Team name is required.' });
    }

    let targetEventId = event_id;
    if (!targetEventId) {
      const defaultEvent = await Event.findOne().sort({ created_at: -1 });
      if (defaultEvent) targetEventId = defaultEvent._id;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const invite_code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const team = await Team.create({
      event_id: targetEventId,
      name,
      slug,
      description: description || '',
      leader_id: req.user.id,
      invite_code,
      members: [req.user.id]
    });

    const invite_link = `/teams/join?code=${invite_code}`;

    return res.status(201).json({
      message: 'Team created successfully',
      team,
      invite_code,
      invite_link
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// POST /api/teams/join (Others join via link/code - max 4 members)
app.post('/api/teams/join', authenticate, requireRole('participant', 'admin'), async (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invite code is required.' });
    }

    const team = await Team.findOne({ invite_code: invite_code.toUpperCase().trim() });
    if (!team) {
      return res.status(404).json({ error: 'Not Found', message: 'Team with this invite code not found.' });
    }

    const userIdStr = String(req.user.id);
    const alreadyMember = team.members.some(m => String(m) === userIdStr) || String(team.leader_id) === userIdStr;
    if (alreadyMember) {
      return res.status(400).json({ error: 'Bad Request', message: 'You are already a member of this team.' });
    }

    // STRICT CHECK: Maximum 4 members allowed
    if (team.members && team.members.length >= 4) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Team is full. A maximum of 4 members are allowed per team.'
      });
    }

    team.members.push(req.user.id);
    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'username full_name email role')
      .populate('leader_id', 'username full_name email');

    return res.status(200).json({
      message: 'Successfully joined team',
      team: populatedTeam
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// GET /api/teams/my (Get teams for current user)
app.get('/api/teams/my', authenticate, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [{ members: req.user.id }, { leader_id: req.user.id }]
    })
      .populate('members', 'username full_name email role')
      .populate('leader_id', 'username full_name email')
      .populate('event_id', 'title slug submission_deadline');

    return res.status(200).json(teams);
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// ==========================================
// 5. T1 FEATURE: SUBMISSIONS & DEADLINE VALIDATION
// Reject edits after deadline (403)
// ==========================================

// POST /api/submissions (Create project submission, saved as draft or submitted)
app.post('/api/submissions', authenticate, requireRole('participant', 'admin'), async (req, res) => {
  try {
    const { event_id, team_id, track_id, title, tagline, description, repo_url, demo_url, tech_stack, is_draft } = req.body;

    if (!title || !description || !team_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title, description, and team_id are required.'
      });
    }

    // Verify team exists and user is a member
    const team = await Team.findById(team_id);
    if (!team) {
      return res.status(404).json({ error: 'Not Found', message: 'Team not found.' });
    }

    const userIdStr = String(req.user.id);
    const isMember = String(team.leader_id) === userIdStr || team.members.some(m => String(m) === userIdStr);
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You must be a member of this team to submit a project.'
      });
    }

    const targetEventId = event_id || team.event_id;
    const event = await Event.findById(targetEventId);
    if (!event) {
      return res.status(404).json({ error: 'Not Found', message: 'Associated event not found.' });
    }

    // Check submission deadline
    const now = new Date();
    if (now > new Date(event.submission_deadline)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Submission deadline has passed. New submissions are closed.'
      });
    }

    // Assign track
    let targetTrackId = track_id;
    if (!targetTrackId) {
      const defaultTrack = await Track.findOne({ event_id: targetEventId });
      if (defaultTrack) targetTrackId = defaultTrack._id;
    }

    const status = is_draft ? 'draft' : 'submitted';

    const submission = await Submission.create({
      event_id: targetEventId,
      team_id,
      track_id: targetTrackId,
      title,
      tagline: tagline || '',
      description,
      repo_url: repo_url || '',
      demo_url: demo_url || '',
      tech_stack: Array.isArray(tech_stack) ? tech_stack : (tech_stack ? [tech_stack] : []),
      status,
      submitted_at: new Date()
    });

    return res.status(201).json({
      message: is_draft ? 'Project saved as draft' : 'Project submitted successfully',
      submission
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// PUT /api/submissions/:id (Edit project - Backend rejects edits after deadline with 403)
app.put('/api/submissions/:id', authenticate, requireRole('participant', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: 'Not Found', message: 'Submission not found.' });
    }

    // Verify user is team member or admin
    if (req.user.role !== 'ADMIN') {
      const team = await Team.findById(submission.team_id);
      const userIdStr = String(req.user.id);
      const isMember = team && (String(team.leader_id) === userIdStr || team.members.some(m => String(m) === userIdStr));
      if (!isMember) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not a member of the team that owns this project.'
        });
      }
    }

    // STRICT CHECK: Backend rejects edits after the deadline (403)
    const event = await Event.findById(submission.event_id);
    if (event && new Date() > new Date(event.submission_deadline)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Submission deadline has passed. Edits are no longer allowed.'
      });
    }

    const { title, tagline, description, repo_url, demo_url, track_id, tech_stack, is_draft } = req.body;
    if (title !== undefined) submission.title = title;
    if (tagline !== undefined) submission.tagline = tagline;
    if (description !== undefined) submission.description = description;
    if (repo_url !== undefined) submission.repo_url = repo_url;
    if (demo_url !== undefined) submission.demo_url = demo_url;
    if (track_id !== undefined) submission.track_id = track_id;
    if (tech_stack !== undefined) submission.tech_stack = Array.isArray(tech_stack) ? tech_stack : [tech_stack];
    if (is_draft !== undefined) {
      submission.status = is_draft ? 'draft' : 'submitted';
    }
    submission.updated_at = new Date();

    await submission.save();

    return res.status(200).json({
      message: 'Submission updated successfully',
      submission
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// GET /api/submissions/:id
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('team_id', 'name slug invite_code members')
      .populate('track_id', 'name prize_pool description')
      .populate('event_id', 'title slug submission_deadline');

    if (!submission) {
      return res.status(404).json({ error: 'Not Found', message: 'Submission not found' });
    }

    return res.status(200).json(submission);
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// ==========================================
// 6. T1 FEATURE: PUBLIC GALLERY
// Search and filter by track
// ==========================================
app.get('/api/gallery', async (req, res) => {
  try {
    const { search, track, event } = req.query;

    const filter = {
      status: { $ne: 'draft' } // Public gallery only shows submitted entries
    };

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { tagline: searchRegex },
        { description: searchRegex },
        { tech_stack: searchRegex }
      ];
    }

    if (track && track.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(track)) {
        filter.track_id = track;
      } else {
        const matchingTracks = await Track.find({ name: new RegExp(track.trim(), 'i') }).select('_id');
        filter.track_id = { $in: matchingTracks.map(t => t._id) };
      }
    }

    if (event && event.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(event)) {
        filter.event_id = event;
      } else {
        const matchingEvents = await Event.find({ slug: event.trim() }).select('_id');
        filter.event_id = { $in: matchingEvents.map(e => e._id) };
      }
    }

    const projects = await Submission.find(filter)
      .populate('team_id', 'name slug invite_code')
      .populate('track_id', 'name prize_pool description')
      .populate('event_id', 'title slug submission_deadline')
      .sort({ submitted_at: -1 })
      .lean();

    return res.status(200).json({
      total: projects.length,
      projects
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// GET /api/tracks (Public - Get all tracks for filtering)
app.get('/api/tracks', async (req, res) => {
  try {
    const tracks = await Track.find().lean();
    return res.status(200).json(tracks);
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

// ==========================================
// 7. ROLE-PROTECTED TEST ENDPOINTS
// ==========================================
app.get('/api/participant/dashboard', authenticate, requireRole('participant', 'admin'), (req, res) => {
  return res.status(200).json({ message: 'Welcome to Participant Dashboard', role: req.user.role, user: req.user });
});

app.get('/api/judge/evaluations', authenticate, requireRole('judge', 'admin'), (req, res) => {
  return res.status(200).json({ message: 'Welcome to Judge Evaluations Portal', role: req.user.role, user: req.user });
});

app.get('/api/organizer/events', authenticate, requireRole('organizer', 'admin'), (req, res) => {
  return res.status(200).json({ message: 'Welcome to Organizer Event Management', role: req.user.role, user: req.user });
});

app.get('/api/admin/system', authenticate, requireRole('admin'), (req, res) => {
  return res.status(200).json({ message: 'Welcome to Root Admin System Control', role: req.user.role, user: req.user });
});

// Overview route
app.get('/api/overview', async (req, res) => {
  try {
    const [userCount, eventCount, trackCount, prizeCount, teamCount, projectCount] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Track.countDocuments(),
      Prize.countDocuments(),
      Team.countDocuments(),
      Submission.countDocuments()
    ]);

    const event = await Event.findOne().lean();
    const tracks = await Track.find().lean();
    const prizes = await Prize.find().lean();
    const teams = await Team.find().lean();
    const projects = await Submission.find().lean();

    return res.json({
      counts: {
        users: userCount,
        events: eventCount,
        tracks: trackCount,
        prizes: prizeCount,
        teams: teamCount,
        projects: projectCount
      },
      event,
      tracks,
      prizes,
      teams,
      projects,
      testCredentials: testCredentials.map(tc => ({
        role: tc.role,
        email: tc.email,
        password: tc.password,
        name: tc.full_name
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Retry loop to ensure backend waits for the database to be fully ready
async function connectWithRetry() {
  const retryIntervalMs = 2000;
  let attempt = 0;

  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);

  while (true) {
    try {
      attempt++;
      console.log(`[Attempt ${attempt}] Connecting to MongoDB...`);
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Successfully connected to MongoDB!');
      break;
    } catch (err) {
      console.error(`MongoDB connection error: ${err.message}. Retrying in ${retryIntervalMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }
  }

  await seedDatabaseIfEmpty();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
    console.log(`Healthcheck endpoint active at http://0.0.0.0:${PORT}/api/health`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  connectWithRetry();
}

module.exports = app;
