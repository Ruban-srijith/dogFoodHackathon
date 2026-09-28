const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-t5-export';

const app = require('../src/server');
const { generateToken } = require('../src/auth');
const { User, Event, Track, Team, Submission, JudgeAssignment, EvaluationScore } = require('../src/models');
const { toCsvRow } = require('../src/export');

test('T5 Feature Suite: Judge Progress Dashboard and CSV Export System', async (t) => {
  // Test Users
  const organizerUser = { _id: 'org_user_t5', id: 'org_user_t5', username: 'organizer_t5', email: 'organizer_t5@dogfood.local', role: 'ORGANIZER', full_name: 'Elena Organizer' };
  const adminUser = { _id: 'admin_user_t5', id: 'admin_user_t5', username: 'admin_t5', email: 'admin_t5@dogfood.local', role: 'ADMIN', full_name: 'System Admin' };
  const participantUser = { _id: 'part_user_t5', id: 'part_user_t5', username: 'participant_t5', email: 'participant_t5@dogfood.local', role: 'PARTICIPANT', full_name: 'Alice Hacker', created_at: new Date('2026-09-01T10:00:00Z') };
  const judge1User = { _id: 'judge1_user_t5', id: 'judge1_user_t5', username: 'judge1_t5', email: 'judge1_t5@dogfood.local', role: 'JUDGE', full_name: 'Dr. Sarah Harsh' };
  const judge2User = { _id: 'judge2_user_t5', id: 'judge2_user_t5', username: 'judge2_t5', email: 'judge2_t5@dogfood.local', role: 'JUDGE', full_name: 'Elena Generous' };
  const judge3User = { _id: 'judge3_user_t5', id: 'judge3_user_t5', username: 'judge3_t5', email: 'judge3_t5@dogfood.local', role: 'JUDGE', full_name: 'Marcus Unassigned' };

  const organizerToken = generateToken(organizerUser);
  const adminToken = generateToken(adminUser);
  const participantToken = generateToken(participantUser);
  const judgeToken = generateToken(judge1User);

  const testEvent = {
    _id: 'ev_t5',
    title: 'DogFood Hackathon T5',
    slug: 'dogfood-hackathon-t5',
    description: 'Progress and Export testing event',
    submission_deadline: new Date(Date.now() + 86400000),
    status: 'ongoing',
    created_at: new Date('2026-09-01T08:00:00Z')
  };

  const testTrack = {
    _id: 'track_t5',
    event_id: 'ev_t5',
    name: 'AI & Systems',
    prize_pool: '$10,000'
  };

  const testTeam = {
    _id: 'team_t5',
    event_id: 'ev_t5',
    name: 'CyberCrafters, Inc.',
    slug: 'cybercrafters-inc',
    description: 'Building cool tools',
    leader_id: participantUser,
    invite_code: 'TEAM_T5_CODE',
    members: [participantUser],
    created_at: new Date('2026-09-02T10:00:00Z')
  };

  const testSub1 = {
    _id: 'sub_t5_1',
    event_id: 'ev_t5',
    team_id: testTeam,
    track_id: testTrack,
    title: 'Antigravity Autonomous Agent',
    tagline: 'Autonomous AI engineer',
    description: 'Full stack AI development agent',
    repo_url: 'https://github.com/example/agent',
    demo_url: 'https://demo.example.com',
    tech_stack: ['TypeScript', 'Node.js'],
    status: 'submitted',
    submitted_at: new Date('2026-09-10T14:00:00Z')
  };

  const testSub2 = {
    _id: 'sub_t5_2',
    event_id: 'ev_t5',
    team_id: testTeam,
    track_id: testTrack,
    title: 'ByteForge High-Throughput Engine',
    tagline: 'Lightning fast engine',
    description: 'Low latency streaming engine',
    repo_url: 'https://github.com/example/engine',
    demo_url: 'https://engine.example.com',
    tech_stack: ['Rust', 'Wasm'],
    status: 'submitted',
    submitted_at: new Date('2026-09-11T16:00:00Z')
  };

  const testAssignments = [
    {
      _id: 'asgn_1',
      event_id: 'ev_t5',
      submission_id: testSub1,
      judge_id: judge1User,
      status: 'completed',
      created_at: new Date('2026-09-12T09:00:00Z')
    },
    {
      _id: 'asgn_2',
      event_id: 'ev_t5',
      submission_id: testSub2,
      judge_id: judge1User,
      status: 'assigned',
      created_at: new Date('2026-09-12T09:05:00Z')
    },
    {
      _id: 'asgn_3',
      event_id: 'ev_t5',
      submission_id: testSub1,
      judge_id: judge2User,
      status: 'completed',
      created_at: new Date('2026-09-12T09:10:00Z')
    }
  ];

  const testScores = [
    {
      _id: 'score_1',
      event_id: 'ev_t5',
      submission_id: testSub1,
      judge_id: judge1User,
      criteria_scores: [
        { name: 'Innovation', score: 7.5, weight: 1.0 }
      ],
      weighted_total: 75.0,
      comment: 'Very thorough, great technical execution',
      status: 'submitted',
      submitted_at: new Date('2026-09-13T10:00:00Z')
    },
    {
      _id: 'score_2',
      event_id: 'ev_t5',
      submission_id: testSub1,
      judge_id: judge2User,
      criteria_scores: [
        { name: 'Innovation', score: 9.5, weight: 1.0 }
      ],
      weighted_total: 95.0,
      comment: 'Superb work!',
      status: 'submitted',
      submitted_at: new Date('2026-09-13T11:00:00Z')
    }
  ];

  // In-Memory Database Stubs for Mongoose
  User.find = (query) => {
    let users = [organizerUser, adminUser, participantUser, judge1User, judge2User, judge3User];
    if (query && query.role) {
      users = users.filter(u => u.role === query.role);
    }
    return {
      sort: () => ({
        lean: async () => users
      }),
      lean: async () => users
    };
  };

  User.findById = async (id) => {
    const all = [organizerUser, adminUser, participantUser, judge1User, judge2User, judge3User];
    return all.find(u => String(u._id) === String(id) || String(u.id) === String(id)) || null;
  };

  Event.findOne = () => ({
    sort: () => ({
      lean: async () => testEvent
    }),
    lean: async () => testEvent
  });

  Track.find = () => ({
    lean: async () => [testTrack]
  });

  Team.find = () => ({
    populate: function() { return this; },
    sort: function() {
      return {
        lean: async () => [testTeam]
      };
    },
    lean: async () => [testTeam]
  });

  Submission.find = () => ({
    populate: function() { return this; },
    sort: function() {
      return {
        lean: async () => [testSub1, testSub2]
      };
    },
    lean: async () => [testSub1, testSub2]
  });

  Submission.findById = (id) => {
    const sub = [testSub1, testSub2].find(s => String(s._id) === String(id));
    return {
      populate: function() { return this; },
      lean: async () => sub || null
    };
  };

  JudgeAssignment.find = () => ({
    populate: function() { return this; },
    sort: function() {
      return {
        lean: async () => testAssignments
      };
    },
    lean: async () => testAssignments
  });

  EvaluationScore.find = () => ({
    populate: function() { return this; },
    sort: function() {
      return {
        lean: async () => testScores
      };
    },
    lean: async () => testScores
  });

  // =========================================================================
  // SUB-SUITE 1: Judge Progress Dashboard
  // =========================================================================
  await t.test('GET /api/organizer/judges/progress requires organizer or admin (401 / 403 checks)', async () => {
    // Unauthenticated
    const resUnauth = await request(app).get('/api/organizer/judges/progress');
    assert.equal(resUnauth.status, 401, 'Unauthenticated access should be rejected with 401');

    // Participant forbidden
    const resPart = await request(app)
      .get('/api/organizer/judges/progress')
      .set('Authorization', `Bearer ${participantToken}`);
    assert.equal(resPart.status, 403, 'Participant access should be rejected with 403');

    // Judge forbidden
    const resJudge = await request(app)
      .get('/api/organizer/judges/progress')
      .set('Authorization', `Bearer ${judgeToken}`);
    assert.equal(resJudge.status, 403, 'Judge access should be rejected with 403');
  });

  await t.test('GET /api/organizer/judges/progress returns correct per-judge assigned, scored, pending metrics', async () => {
    const res = await request(app)
      .get('/api/organizer/judges/progress')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.summary, 'Summary object should be present');
    assert.equal(res.body.summary.total_judges, 3, 'Total judges should be 3');
    assert.equal(res.body.summary.total_assignments, 3, 'Total assignments should be 3');
    assert.equal(res.body.summary.total_scored, 2, 'Total scored should be 2');
    assert.equal(res.body.summary.total_pending, 1, 'Total pending should be 1');

    // Check Judge 1: assigned=2, scored=1, pending=1, status=in_progress
    const j1 = res.body.judges.find(j => String(j.judge_id) === String(judge1User._id));
    assert.ok(j1, 'Judge 1 should be listed');
    assert.equal(j1.assigned, 2, 'Judge 1 assigned count should be 2');
    assert.equal(j1.scored, 1, 'Judge 1 scored count should be 1');
    assert.equal(j1.pending, 1, 'Judge 1 pending count should be 1');
    assert.equal(j1.progress_percent, 50, 'Judge 1 progress percent should be 50%');
    assert.equal(j1.status, 'in_progress', 'Judge 1 status should be in_progress');

    // Check Judge 2: assigned=1, scored=1, pending=0, status=completed
    const j2 = res.body.judges.find(j => String(j.judge_id) === String(judge2User._id));
    assert.ok(j2, 'Judge 2 should be listed');
    assert.equal(j2.assigned, 1, 'Judge 2 assigned count should be 1');
    assert.equal(j2.scored, 1, 'Judge 2 scored count should be 1');
    assert.equal(j2.pending, 0, 'Judge 2 pending count should be 0');
    assert.equal(j2.progress_percent, 100, 'Judge 2 progress percent should be 100%');
    assert.equal(j2.status, 'completed', 'Judge 2 status should be completed');

    // Check Judge 3: assigned=0, scored=0, pending=0, status=unassigned
    const j3 = res.body.judges.find(j => String(j.judge_id) === String(judge3User._id));
    assert.ok(j3, 'Judge 3 should be listed');
    assert.equal(j3.assigned, 0, 'Judge 3 assigned count should be 0');
    assert.equal(j3.scored, 0, 'Judge 3 scored count should be 0');
    assert.equal(j3.pending, 0, 'Judge 3 pending count should be 0');
    assert.equal(j3.status, 'unassigned', 'Judge 3 status should be unassigned');
  });

  await t.test('Admin can also access judge progress dashboard via /api/judges/progress', async () => {
    const res = await request(app)
      .get('/api/judges/progress')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.judges.length, 3);
  });

  // =========================================================================
  // SUB-SUITE 2: CSV Export Security & Validation
  // =========================================================================
  await t.test('CSV exports strictly require organizer/admin permissions (401 & 403 checks)', async () => {
    const testEndpoints = [
      '/api/export/participants',
      '/api/export/teams',
      '/api/export/submissions',
      '/api/export/assignments',
      '/api/export/raw_scores',
      '/api/export/normalized_scores',
      '/api/export/final_results'
    ];

    for (const ep of testEndpoints) {
      // 1. Unauthenticated -> 401
      const resUnauth = await request(app).get(ep);
      assert.equal(resUnauth.status, 401, `${ep} must return 401 for unauthenticated requests`);

      // 2. Participant -> 403
      const resPart = await request(app)
        .get(ep)
        .set('Authorization', `Bearer ${participantToken}`);
      assert.equal(resPart.status, 403, `${ep} must return 403 for participant`);

      // 3. Judge -> 403
      const resJudge = await request(app)
        .get(ep)
        .set('Authorization', `Bearer ${judgeToken}`);
      assert.equal(resJudge.status, 403, `${ep} must return 403 for judge`);
    }
  });

  await t.test('GET /api/export/invalid_resource returns 400 Bad Request with supported list', async () => {
    const res = await request(app)
      .get('/api/export/unknown_resource')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Supported types:/);
  });

  // =========================================================================
  // SUB-SUITE 3: CSV Export Data Integrity Checks (All 7 Resources)
  // =========================================================================
  await t.test('Export 1: participants CSV format and content', async () => {
    const res = await request(app)
      .get('/api/export/participants')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="participants_export.csv"/);

    const lines = res.text.split('\r\n');
    assert.ok(lines.length >= 2, 'CSV must have header and data rows');
    assert.equal(lines[0], 'Participant ID,Username,Full Name,Email,Role,Team Name,Team ID,Registered At');
    assert.match(res.text, /participant_t5/);
    assert.match(res.text, /Alice Hacker/);
  });

  await t.test('Export 2: teams CSV format and content', async () => {
    const res = await request(app)
      .get('/api/export/teams')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="teams_export.csv"/);

    const lines = res.text.split('\r\n');
    assert.equal(lines[0], 'Team ID,Team Name,Slug,Leader Username,Leader Email,Member Count,Members,Invite Code,Created At');
    assert.match(res.text, /CyberCrafters/);
    assert.match(res.text, /TEAM_T5_CODE/);
  });

  await t.test('Export 3: submissions CSV format and content', async () => {
    const res = await request(app)
      .get('/api/export/submissions')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="submissions_export.csv"/);

    const lines = res.text.split('\r\n');
    assert.equal(lines[0], 'Submission ID,Title,Tagline,Team Name,Track,Status,Repo URL,Demo URL,Tech Stack,Submitted At');
    assert.match(res.text, /Antigravity Autonomous Agent/);
    assert.match(res.text, /ByteForge High-Throughput Engine/);
  });

  await t.test('Export 4: assignments CSV format and content', async () => {
    const res = await request(app)
      .get('/api/export/assignments')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="assignments_export.csv"/);

    const lines = res.text.split('\r\n');
    assert.equal(lines[0], 'Assignment ID,Judge ID,Judge Name,Judge Email,Submission ID,Project Title,Team Name,Assignment Status,Evaluation Status,Assigned At');
    assert.match(res.text, /Dr. Sarah Harsh/);
    assert.match(res.text, /Antigravity Autonomous Agent/);
  });

  await t.test('Export 5: raw_scores CSV format and content', async () => {
    const res = await request(app)
      .get('/api/export/raw_scores')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="raw_scores_export.csv"/);

    const lines = res.text.split('\r\n');
    assert.equal(lines[0], 'Score ID,Submission ID,Project Title,Team Name,Track,Judge ID,Judge Name,Judge Email,Weighted Total,Status,Comment,Criteria Breakdown,Submitted At');
    assert.match(res.text, /75/);
    assert.match(res.text, /95/);
    assert.match(res.text, /Very thorough/);
  });

  await t.test('Export 6: normalized_scores CSV format and content', async () => {
    const res = await request(app)
      .get('/api/export/normalized_scores')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="normalized_scores_export.csv"/);

    const lines = res.text.split('\r\n');
    assert.equal(lines[0], 'Submission ID,Project Title,Track,Team Name,Judge ID,Judge Name,Judge Email,Raw Score,Judge Mean,Judge StdDev,Z-Score,Rescaled Score (0-100)');
    assert.match(res.text, /Antigravity Autonomous Agent/);
  });

  await t.test('Export 7: final_results CSV format and content', async () => {
    const res = await request(app)
      .get('/api/export/final_results')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename="final_results_export.csv"/);

    const lines = res.text.split('\r\n');
    assert.equal(lines[0], 'Normalized Rank,Raw Rank,Rank Shift,Project Title,Team Name,Track,Normalized Score (0-100),Raw Average Score,Judge Count,Submission Status,Repo URL,Demo URL');
    assert.match(res.text, /Antigravity Autonomous Agent/);
  });

  await t.test('Export via query parameter GET /api/export?type=teams also works for admin', async () => {
    const res = await request(app)
      .get('/api/export?type=teams')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.text, /CyberCrafters/);
  });

  await t.test('Unit test: toCsvRow properly escapes commas, quotes, and newlines per RFC 4180', () => {
    const row = toCsvRow(['Regular', 'With, comma', 'With "quotes"', 'Multi\nline', 42, null]);
    assert.equal(row, 'Regular,"With, comma","With ""quotes""","Multi\nline",42,');
  });
});
