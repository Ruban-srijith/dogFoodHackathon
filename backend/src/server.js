const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const { seedDatabaseIfEmpty, testCredentials } = require('./seed');
const { User, Event, Track, Prize, Team, Submission } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/app_db';

// Enable CORS for all incoming origins
app.use(cors());
app.use(express.json());

// GET /api/health returning {"status":"ok"}
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

// Also support root /health
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

// GET /api/overview - returns seeded data counts and test accounts
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

connectWithRetry();

module.exports = app;
