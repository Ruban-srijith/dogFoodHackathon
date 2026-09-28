const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

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

  // Start HTTP server only once database connection is confirmed
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
    console.log(`Healthcheck endpoint active at http://0.0.0.0:${PORT}/api/health`);
  });
}

connectWithRetry();

module.exports = app;
