const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-t3-rubrics';

const app = require('../src/server');
const { generateToken } = require('../src/auth');
const {
  User,
  Event,
  Submission,
  JudgeAssignment,
  RubricCriterion,
  EvaluationScore
} = require('../src/models');

test('T3 Feature Suite: Configurable Judging Rubrics, Draft/Submit Locking & Strict Judge Isolation', async (t) => {
  // --- USERS & TOKENS ---
  const organizerUser = { id: 'org_user_1', email: 'organizer@hackathon.local', username: 'organizer', role: 'ORGANIZER', full_name: 'Lead Organizer' };
  const judge1User = { id: 'judge_user_1', email: 'judge1@hackathon.local', username: 'judge1', role: 'JUDGE', full_name: 'Judge Alice' };
  const judge2User = { id: 'judge_user_2', email: 'judge2@hackathon.local', username: 'judge2', role: 'JUDGE', full_name: 'Judge Bob' };
  const judgeUnassignedUser = { id: 'judge_unassigned', email: 'judge_unassigned@hackathon.local', username: 'judge_unassigned', role: 'JUDGE', full_name: 'Unassigned Judge' };
  const participantUser = { id: 'part_user_1', email: 'hacker@hackathon.local', username: 'hacker', role: 'PARTICIPANT', full_name: 'Participant Hacker' };

  const organizerToken = generateToken(organizerUser);
  const judge1Token = generateToken(judge1User);
  const judge2Token = generateToken(judge2User);
  const unassignedJudgeToken = generateToken(judgeUnassignedUser);
  const participantToken = generateToken(participantUser);

  // --- MOCK DATABASE STORE ---
  const mockDb = {
    users: [
      { _id: 'org_user_1', ...organizerUser },
      { _id: 'judge_user_1', ...judge1User },
      { _id: 'judge_user_2', ...judge2User },
      { _id: 'judge_unassigned', ...judgeUnassignedUser },
      { _id: 'part_user_1', ...participantUser }
    ],
    events: [
      {
        _id: 'ev_1',
        title: 'Global AI Hackathon 2026',
        slug: 'global-ai-hackathon-2026',
        description: 'Next-gen agentic systems',
        submission_deadline: new Date(Date.now() + 86400000 * 7),
        status: 'ongoing'
      }
    ],
    submissions: [
      {
        _id: 'sub_1',
        event_id: 'ev_1',
        team_id: 'team_1',
        title: 'Autonomous Code Synthesizer',
        description: 'Compiles natural language into tested binaries',
        status: 'submitted'
      },
      {
        _id: 'sub_unassigned',
        event_id: 'ev_1',
        team_id: 'team_2',
        title: 'Unassigned Project',
        description: 'Not assigned to judge1 or judge2',
        status: 'submitted'
      }
    ],
    rubricCriteria: [],
    judgeAssignments: [
      {
        _id: 'asgn_1',
        event_id: 'ev_1',
        submission_id: 'sub_1',
        judge_id: 'judge_user_1',
        status: 'assigned'
      },
      {
        _id: 'asgn_2',
        event_id: 'ev_1',
        submission_id: 'sub_1',
        judge_id: 'judge_user_2',
        status: 'assigned'
      }
    ],
    evaluationScores: []
  };

  // --- MODEL STUBS ---
  User.findById = async (id) => mockDb.users.find(u => String(u._id) === String(id)) || null;

  Event.findOne = () => ({
    sort: () => mockDb.events[0] || null,
    lean: async () => mockDb.events[0] || null
  });
  Event.findById = async (id) => mockDb.events.find(e => String(e._id) === String(id)) || null;

  Submission.findById = (id) => {
    const s = mockDb.submissions.find(sub => String(sub._id) === String(id));
    return {
      populate: function() { return this; },
      lean: async function() { return s || null; },
      then: function(resolve) { resolve(s || null); }
    };
  };

  JudgeAssignment.findOne = async (query) => {
    return mockDb.judgeAssignments.find(a =>
      String(a.submission_id) === String(query.submission_id) &&
      String(a.judge_id) === String(query.judge_id)
    ) || null;
  };

  JudgeAssignment.updateOne = async (query, update) => {
    const a = mockDb.judgeAssignments.find(asgn =>
      String(asgn.submission_id) === String(query.submission_id) &&
      String(asgn.judge_id) === String(query.judge_id)
    );
    if (a) {
      Object.assign(a, update);
    }
    return { modifiedCount: a ? 1 : 0 };
  };

  // RubricCriterion stubs
  RubricCriterion.create = async (doc) => {
    const newDoc = {
      _id: `crit_${mockDb.rubricCriteria.length + 1}`,
      ...doc,
      save: async function() { return this; }
    };
    mockDb.rubricCriteria.push(newDoc);
    return newDoc;
  };

  RubricCriterion.find = (filter) => {
    let result = mockDb.rubricCriteria;
    if (filter && filter.event_id) {
      result = result.filter(c => String(c.event_id) === String(filter.event_id));
    }
    return {
      sort: () => ({
        lean: async () => result
      }),
      lean: async () => result,
      then: (resolve) => resolve(result)
    };
  };

  RubricCriterion.findById = async (id) => {
    const crit = mockDb.rubricCriteria.find(c => String(c._id) === String(id));
    if (crit && !crit.save) {
      crit.save = async function() { return this; };
    }
    return crit || null;
  };

  RubricCriterion.findByIdAndUpdate = async (id, update) => {
    const crit = mockDb.rubricCriteria.find(c => String(c._id) === String(id));
    if (crit) {
      Object.assign(crit, update);
      return crit;
    }
    return null;
  };

  RubricCriterion.findByIdAndDelete = async (id) => {
    const idx = mockDb.rubricCriteria.findIndex(c => String(c._id) === String(id));
    if (idx !== -1) {
      return mockDb.rubricCriteria.splice(idx, 1)[0];
    }
    return null;
  };

  // EvaluationScore stubs
  EvaluationScore.create = async (doc) => {
    const newDoc = {
      _id: `score_${mockDb.evaluationScores.length + 1}`,
      ...doc,
      save: async function() { return this; }
    };
    mockDb.evaluationScores.push(newDoc);
    return newDoc;
  };

  EvaluationScore.findOne = (query) => {
    const s = mockDb.evaluationScores.find(score => {
      let match = true;
      if (query.submission_id) match = match && String(score.submission_id) === String(query.submission_id);
      if (query.judge_id) match = match && String(score.judge_id) === String(query.judge_id);
      if (query._id) match = match && String(score._id) === String(query._id);
      return match;
    });

    return {
      populate: function() { return this; },
      lean: async function() { return s || null; },
      then: function(resolve) { resolve(s || null); }
    };
  };

  EvaluationScore.find = (query) => {
    let result = mockDb.evaluationScores;
    if (query && query.submission_id) {
      result = result.filter(s => String(s.submission_id) === String(query.submission_id));
    }
    return {
      populate: function() { return this; },
      lean: async function() { return result; },
      then: function(resolve) { resolve(result); }
    };
  };

  EvaluationScore.findById = (id) => {
    const s = mockDb.evaluationScores.find(score => String(score._id) === String(id));
    return {
      populate: function() { return this; },
      lean: async function() { return s || null; },
      then: function(resolve) { resolve(s || null); }
    };
  };

  let crit1Id = '';
  let crit2Id = '';
  let judge1ScoreId = '';
  let judge2ScoreId = '';

  // =====================================================================
  // 1. CONFIGURABLE RUBRIC CRITERIA CREATION & VALIDATION
  // =====================================================================
  await t.test('Organizer creates rubric criterion 1: Innovation (weight: 0.4, min: 0, max: 10)', async () => {
    const res = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        event_id: 'ev_1',
        name: 'Technical Innovation',
        description: 'Originality and algorithmic complexity',
        weight: 0.4,
        min_score: 0,
        max_score: 10
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Technical Innovation');
    assert.strictEqual(res.body.data.weight, 0.4);
    assert.strictEqual(res.body.data.min_score, 0);
    assert.strictEqual(res.body.data.max_score, 10);
    crit1Id = res.body.data._id;
  });

  await t.test('Organizer creates rubric criterion 2: Execution (weight: 0.6, min: 0, max: 10)', async () => {
    const res = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        event_id: 'ev_1',
        name: 'Execution & Quality',
        description: 'Code architecture and working demo',
        weight: 0.6,
        min_score: 0,
        max_score: 10
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.weight, 0.6);
    crit2Id = res.body.data._id;
  });

  await t.test('Organizer criterion creation fails if min_score >= max_score (400)', async () => {
    const res = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        event_id: 'ev_1',
        name: 'Invalid Scale Criterion',
        weight: 1.0,
        min_score: 10,
        max_score: 5
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Bad Request');
  });

  await t.test('Organizer criterion creation fails if weight is non-positive (400)', async () => {
    const res = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        event_id: 'ev_1',
        name: 'Zero Weight Criterion',
        weight: 0,
        min_score: 0,
        max_score: 10
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Bad Request');
  });

  await t.test('Organizer criterion creation fails if name is missing (400)', async () => {
    const res = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        event_id: 'ev_1',
        weight: 1.0,
        min_score: 0,
        max_score: 10
      });

    assert.strictEqual(res.status, 400);
  });

  await t.test('Participant receives 403 Forbidden trying to create rubric criteria', async () => {
    const res = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        event_id: 'ev_1',
        name: 'Hacker Injected Criterion',
        weight: 1.0,
        min_score: 0,
        max_score: 10
      });

    assert.strictEqual(res.status, 403);
  });

  await t.test('Judge receives 403 Forbidden trying to create rubric criteria', async () => {
    const res = await request(app)
      .post('/api/rubrics')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        event_id: 'ev_1',
        name: 'Judge Custom Criterion',
        weight: 1.0,
        min_score: 0,
        max_score: 10
      });

    assert.strictEqual(res.status, 403);
  });

  await t.test('Authenticated users can list rubric criteria for event', async () => {
    const res = await request(app)
      .get('/api/rubrics?event_id=ev_1')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 2);
  });

  // =====================================================================
  // 2. JUDGE SCORING, DRAFTING, AND BACKEND WEIGHTED TOTAL CALCULATION
  // =====================================================================
  await t.test('Unassigned judge receives 403 Forbidden when scoring project', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${unassignedJudgeToken}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 8 },
          { criterion_id: crit2Id, score: 9 }
        ],
        comment: 'Nice job'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('Judge receives 400 when score exceeds max_score', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 15 }, // max is 10
          { criterion_id: crit2Id, score: 9 }
        ],
        comment: 'Over-scored'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
  });

  await t.test('Judge receives 400 when score is below min_score', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: -2 }, // min is 0
          { criterion_id: crit2Id, score: 9 }
        ],
        comment: 'Negative score'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
  });

  await t.test('Judge 1 saves evaluation as DRAFT with comment and backend computes weighted total', async () => {
    // Formula check:
    // Innovation (weight 0.4): score 8 -> 8 * 0.4 = 3.2
    // Execution (weight 0.6): score 9 -> 9 * 0.6 = 5.4
    // Expected weighted_total = 8.6
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 8 },
          { criterion_id: crit2Id, score: 9 }
        ],
        comment: 'Solid prototype, needs more test coverage.',
        is_draft: true,
        // Attempting to spoof weighted_total from client side:
        weighted_total: 99.9
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'draft');
    // Backend MUST calculate the total, ignoring client 99.9:
    assert.strictEqual(res.body.weighted_total, 8.6);
    assert.strictEqual(res.body.data.comment, 'Solid prototype, needs more test coverage.');
    judge1ScoreId = res.body.data._id;
  });

  await t.test('Judge 1 can update DRAFT evaluation before final submission', async () => {
    // Update score 1 to 7 and score 2 to 10
    // Total = 7 * 0.4 + 10 * 0.6 = 2.8 + 6.0 = 8.8
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 7 },
          { criterion_id: crit2Id, score: 10 }
        ],
        comment: 'Re-evaluated after reviewing live demonstration.',
        status: 'draft'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'draft');
    assert.strictEqual(res.body.weighted_total, 8.8);
    assert.strictEqual(res.body.data.comment, 'Re-evaluated after reviewing live demonstration.');
  });

  // =====================================================================
  // 3. FINAL SUBMISSION AND LOCKING
  // =====================================================================
  await t.test('Judge 1 submits final evaluation (status becomes submitted)', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 8 },
          { criterion_id: crit2Id, score: 9 }
        ],
        comment: 'Finalized evaluation. Excellent work.',
        status: 'submitted'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'submitted');
    assert.strictEqual(res.body.weighted_total, 8.6);
  });

  await t.test('CRITICAL CHECK: Scores are LOCKED after submit (Judge gets 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 10 },
          { criterion_id: crit2Id, score: 10 }
        ],
        comment: 'Attempting to tamper after locking'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /locked after submit/i);
  });

  // =====================================================================
  // 4. ORGANIZER REOPENS LOCKED EVALUATION
  // =====================================================================
  await t.test('Judge cannot reopen their own locked evaluation (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/scores/${judge1ScoreId}/reopen`)
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 403);
  });

  await t.test('Participant cannot reopen locked evaluation (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/scores/${judge1ScoreId}/reopen`)
      .set('Authorization', `Bearer ${participantToken}`);

    assert.strictEqual(res.status, 403);
  });

  await t.test('Organizer reopens locked evaluation (status resets to draft)', async () => {
    const res = await request(app)
      .post(`/api/scores/${judge1ScoreId}/reopen`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'draft');
    assert.match(res.body.message, /reopened successfully/i);
  });

  await t.test('Judge 1 can edit reopened evaluation and resubmit', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 9 },
          { criterion_id: crit2Id, score: 9 }
        ],
        comment: 'Adjusted after organizer permitted re-evaluation.',
        status: 'submitted'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'submitted');
    // 9 * 0.4 + 9 * 0.6 = 3.6 + 5.4 = 9.0
    assert.strictEqual(res.body.weighted_total, 9.0);
  });

  // =====================================================================
  // 5. STRICT JUDGE ISOLATION: JUDGE A CAN NEVER SEE JUDGE B'S SCORES
  // =====================================================================
  await t.test('Judge 2 submits evaluation for sub_1', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge2Token}`)
      .send({
        criteria_scores: [
          { criterion_id: crit1Id, score: 6 },
          { criterion_id: crit2Id, score: 7 }
        ],
        comment: 'Decent execution by Judge 2.',
        status: 'submitted'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'submitted');
    // 6 * 0.4 + 7 * 0.6 = 2.4 + 4.2 = 6.6
    assert.strictEqual(res.body.weighted_total, 6.6);
    judge2ScoreId = res.body.data._id;
  });

  await t.test('STRICT ISOLATION: Judge 1 querying submission scores sees ONLY Judge 1 score', async () => {
    const res = await request(app)
      .get('/api/scores/submission/sub_1')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    // Must return an array with only 1 item: Judge 1's score
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].judge_id, 'judge_user_1');
    assert.strictEqual(res.body.data[0].weighted_total, 9.0);
  });

  await t.test('STRICT ISOLATION: Judge 1 requesting Judge 2 score by ID receives 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/scores/${judge2ScoreId}`)
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /cannot view scores submitted by another judge/i);
  });

  await t.test('STRICT ISOLATION: Judge 2 requesting Judge 1 score by ID receives 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/scores/${judge1ScoreId}`)
      .set('Authorization', `Bearer ${judge2Token}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /cannot view scores submitted by another judge/i);
  });

  await t.test('Organizer can view all judge scores and aggregate metrics for submission', async () => {
    const res = await request(app)
      .get('/api/scores/submission/sub_1')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.total_evaluations, 2);
    // Average of 9.0 and 6.6 is (9.0 + 6.6) / 2 = 7.8
    assert.strictEqual(res.body.aggregate_score, 7.8);
  });

  await t.test('Participant receives 403 Forbidden accessing submission scores', async () => {
    const res = await request(app)
      .get('/api/scores/submission/sub_1')
      .set('Authorization', `Bearer ${participantToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('Participant receives 403 Forbidden accessing specific score ID', async () => {
    const res = await request(app)
      .get(`/api/scores/${judge1ScoreId}`)
      .set('Authorization', `Bearer ${participantToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });
});
