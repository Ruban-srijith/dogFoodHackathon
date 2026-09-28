const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

    // Normalize and validate role
    const assignedRole = (role || 'PARTICIPANT').toUpperCase();
    const validRoles = ['PARTICIPANT', 'JUDGE', 'ORGANIZER', 'ADMIN'];
    if (!validRoles.includes(assignedRole)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role '${role}'. Valid roles are: ${validRoles.join(', ')}.`
      });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A user with this email or username already exists.'
      });
    }

    // Hash password with bcrypt (salt rounds = 10)
    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password_hash,
      role: assignedRole,
      full_name: full_name || username
    });

    // Generate JWT token
    const token = generateToken(user);

    // Set secure HTTP-only session cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

    // Generate JWT token
    const token = generateToken(user);

    // Set session cookie
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

// GET /api/auth/me (Protected - Any authenticated user)
app.get('/api/auth/me', authenticate, (req, res) => {
  return res.status(200).json({
    user: req.user
  });
});

// ==========================================
// 3. ROLE-PROTECTED BACKEND ROUTES
// Returns 401 if unauthenticated, 403 if unauthorized role
// ==========================================

// PARTICIPANT Route (Allowed: PARTICIPANT, ADMIN)
app.get('/api/participant/dashboard', authenticate, requireRole('participant', 'admin'), (req, res) => {
  return res.status(200).json({
    message: 'Welcome to Participant Dashboard',
    role: req.user.role,
    user: req.user
  });
});

// JUDGE Route (Allowed: JUDGE, ADMIN)
app.get('/api/judge/evaluations', authenticate, requireRole('judge', 'admin'), (req, res) => {
  return res.status(200).json({
    message: 'Welcome to Judge Evaluations Portal',
    role: req.user.role,
    user: req.user
  });
});

// ORGANIZER Route (Allowed: ORGANIZER, ADMIN)
app.get('/api/organizer/events', authenticate, requireRole('organizer', 'admin'), (req, res) => {
  return res.status(200).json({
    message: 'Welcome to Organizer Event Management',
    role: req.user.role,
    user: req.user
  });
});

// ADMIN Route (Exclusively ADMIN)
app.get('/api/admin/system', authenticate, requireRole('admin'), (req, res) => {
  return res.status(200).json({
    message: 'Welcome to Root Admin System Control',
    role: req.user.role,
    user: req.user
  });
});

// ==========================================
// 4. OVERVIEW & SEEDED METRICS
// ==========================================
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

  // Run automatic seed script if database is empty
  await seedDatabaseIfEmpty();

  // Start HTTP server once database is ready and seeded
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
    console.log(`Healthcheck endpoint active at http://0.0.0.0:${PORT}/api/health`);
  });
}

// Start database connection and server if run directly
if (process.env.NODE_ENV !== 'test') {
  connectWithRetry();
}

module.exports = app;
