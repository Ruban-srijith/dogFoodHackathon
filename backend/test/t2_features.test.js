const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-t2-judge';

const app = require('../src/server');
const { generateToken } = require('../src/auth');
const { User, Event, Track, Prize, Team, Submission, JudgeInvite, JudgeAssignment, EvaluationScore } = require('../src/models');

test('T2 Feature Suite: Judge Invitations, Assignments (Manual/Batch/Auto), and Strict 403 Isolation', async (t) => {

  // Test Users & Tokens
  const organizerUser = { id: 'org_user_1', email: 'organizer@dogfood.local', username: 'organizer', role: 'ORGANIZER', full_name: 'Lead Organizer' };
  const adminUser = { id: 'admin_user_1', email: 'admin@dogfood.local', username: 'admin', role: 'ADMIN', full_name: 'Platform Admin' };
  
  // 3 Judges
  const judge1User = { id: 'judge_user_1', email: 'judge1@dogfood.local', username: 'judge1', role: 'JUDGE', full_name: 'Dr. Sarah Chen' };
  const judge2User = { id: 'judge_user_2', email: 'judge2@dogfood.local', username: 'judge2', role: 'JUDGE', full_name: 'Marcus Vance' };
  const judge3User = { id: 'judge_user_3', email: 'judge3@dogfood.local', username: 'judge3', role: 'JUDGE', full_name: 'Elena Rostova' };
  
  // Judge who also belongs to Team A (to test Conflict of Interest)
  const judgeConflictedUser = { id: 'judge_user_conflicted', email: 'conflicted@dogfood.local', username: 'conflicted_judge', role: 'JUDGE', full_name: 'Conflicted Judge' };

  // Participants
  const participant1 = { id: 'part_user_1', email: 'alice@dogfood.local', username: 'alice', role: 'PARTICIPANT', full_name: 'Alice Walker' };
  const participant2 = { id: 'part_user_2', email: 'bob@dogfood.local', username: 'bob', role: 'PARTICIPANT', full_name: 'Bob Smith' };

  const organizerToken = generateToken(organizerUser);
  const adminToken = generateToken(adminUser);
  const judge1Token = generateToken(judge1User);
  const judge2Token = generateToken(judge2User);
  const judge3Token = generateToken(judge3User);
  const judgeConflictedToken = generateToken(judgeConflictedUser);
  const p1Token = generateToken(participant1);
  const p2Token = generateToken(participant2);

  // In-Memory Database Store for T2 Testing
  const mockDb = {
    users: [
      { _id: 'org_user_1', ...organizerUser },
      { _id: 'admin_user_1', ...adminUser },
      { _id: 'judge_user_1', ...judge1User },
      { _id: 'judge_user_2', ...judge2User },
      { _id: 'judge_user_3', ...judge3User },
      { _id: 'judge_user_conflicted', ...judgeConflictedUser },
      { _id: 'part_user_1', ...participant1, save: async function() { return this; } },
      { _id: 'part_user_2', ...participant2, save: async function() { return this; } }
    ],
    events: [
      {
        _id: 'ev_1',
        title: 'Global Hackathon 2026',
        slug: 'global-hackathon-2026',
        description: 'Autonomous agents and developer tooling',
        start_date: new Date(Date.now() - 86400000),
        end_date: new Date(Date.now() + 86400000 * 7),
        submission_deadline: new Date(Date.now() + 86400000 * 3),
        status: 'ongoing'
      }
    ],
    teams: [
      {
        _id: 'team_a',
        event_id: 'ev_1',
        name: 'Team Alpha',
        slug: 'team-alpha',
        leader_id: 'judge_user_conflicted', // Conflicted Judge leads this team!
        members: ['judge_user_conflicted', 'part_user_1']
      },
      {
        _id: 'team_b',
        event_id: 'ev_1',
        name: 'Team Beta',
        slug: 'team-beta',
        leader_id: 'part_user_2',
        members: ['part_user_2']
      },
      {
        _id: 'team_c',
        event_id: 'ev_1',
        name: 'Team Gamma',
        slug: 'team-gamma',
        leader_id: 'part_user_1',
        members: ['part_user_1']
      }
    ],
    submissions: [
      {
        _id: 'sub_1',
        event_id: 'ev_1',
        team_id: 'team_a', // Belonging to Team Alpha (conflicted for judge_user_conflicted)
        title: 'Alpha Autonomous Runtime',
        description: 'Self-healing agent loop',
        status: 'submitted',
        repo_url: 'https://github.com/dogfood/alpha'
      },
      {
        _id: 'sub_2',
        event_id: 'ev_1',
        team_id: 'team_b',
        title: 'Beta Write-Ahead DB',
        description: 'Deterministic storage engine',
        status: 'submitted',
        repo_url: 'https://github.com/dogfood/beta'
      },
      {
        _id: 'sub_3',
        event_id: 'ev_1',
        team_id: 'team_c',
        title: 'Gamma Observability Tracing',
        description: 'Zero-overhead telemetry',
        status: 'submitted',
        repo_url: 'https://github.com/dogfood/gamma'
      }
    ],
    judgeInvites: [],
    judgeAssignments: []
  };

  // Mock User
  User.find = (filter) => {
    let result = mockDb.users;
    if (filter && filter.role) {
      if (typeof filter.role === 'object' && filter.role.$in) {
        result = result.filter(u => filter.role.$in.includes(u.role));
      } else {
        result = result.filter(u => u.role === filter.role);
      }
    }
    if (filter && filter._id && filter._id.$in) {
      result = result.filter(u => filter._id.$in.map(String).includes(String(u._id)));
    }
    return {
      select: () => ({
        lean: async () => result
      }),
      then: (resolve) => resolve(result)
    };
  };

  User.findById = async (id) => {
    const u = mockDb.users.find(u => String(u._id) === String(id));
    if (u && !u.save) {
      u.save = async function() { return this; };
    }
    return u || null;
  };

  // Mock Event
  Event.findOne = () => ({
    sort: () => mockDb.events[0] || null,
    lean: async () => mockDb.events[0] || null
  });
  Event.findById = async (id) => mockDb.events.find(e => String(e._id) === String(id)) || null;

  // Mock Team
  Team.find = async () => mockDb.teams;
  Team.findById = (id) => {
    const t = mockDb.teams.find(tm => String(tm._id) === String(id));
    return {
      populate: function() { return this; },
      then: function(resolve) { resolve(t || null); }
    };
  };

  // Mock Submission
  Submission.find = (filter) => {
    let result = mockDb.submissions;
    if (filter && filter._id && filter._id.$in) {
      result = result.filter(s => filter._id.$in.map(String).includes(String(s._id)));
    }
    return {
      populate: function() { return this; },
      select: function() { return result; },
      sort: function() { return this; },
      lean: async function() { return result; },
      then: function(resolve) { resolve(result); }
    };
  };

  Submission.findById = (id) => {
    const sub = mockDb.submissions.find(s => String(s._id) === String(id));
    if (!sub) {
      return {
        populate: function() { return this; },
        lean: async function() { return null; },
        then: function(resolve) { resolve(null); }
      };
    }
    // Deep clone and populate team_id
    const team = mockDb.teams.find(tm => String(tm._id) === String(sub.team_id));
    const populatedSub = {
      ...sub,
      team_id: team || sub.team_id,
      track_id: { _id: 'tr_1', name: 'Agent Systems' },
      event_id: mockDb.events[0]
    };
    return {
      populate: function() { return this; },
      lean: async function() { return populatedSub; },
      then: function(resolve) { resolve(populatedSub); }
    };
  };

  // Mock JudgeInvite
  JudgeInvite.create = async (doc) => {
    const newDoc = {
      _id: `inv_${mockDb.judgeInvites.length + 1}`,
      ...doc,
      save: async function() { return this; }
    };
    mockDb.judgeInvites.push(newDoc);
    return newDoc;
  };

  JudgeInvite.find = () => ({
    populate: function() { return this; },
    sort: function() { return this; },
    lean: async function() { return mockDb.judgeInvites; }
  });

  JudgeInvite.findOne = async (query) => {
    const inv = mockDb.judgeInvites.find(i => i.invite_code === query.invite_code && i.status === (query.status || i.status));
    if (inv && !inv.save) {
      inv.save = async function() { return this; };
    }
    return inv || null;
  };

  // Mock JudgeAssignment
  JudgeAssignment.create = async (doc) => {
    const newDoc = {
      _id: `asgn_${mockDb.judgeAssignments.length + 1}`,
      ...doc,
      save: async function() { return this; }
    };
    mockDb.judgeAssignments.push(newDoc);
    return newDoc;
  };

  JudgeAssignment.insertMany = async (docs) => {
    const created = docs.map((d, i) => ({
      _id: `asgn_${mockDb.judgeAssignments.length + i + 1}`,
      ...d
    }));
    mockDb.judgeAssignments.push(...created);
    return created;
  };

  JudgeAssignment.findById = (id) => {
    const a = mockDb.judgeAssignments.find(asgn => String(asgn._id) === String(id));
    return {
      populate: function() { return this; },
      then: function(resolve) { resolve(a || null); }
    };
  };

  JudgeAssignment.find = (filter) => {
    let result = mockDb.judgeAssignments;
    if (filter && filter.judge_id) {
      result = result.filter(a => String(a.judge_id) === String(filter.judge_id));
    }
    return {
      populate: function() { return this; },
      sort: function() { return this; },
      lean: async function() { return result; },
      then: function(resolve) { resolve(result); }
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

  JudgeAssignment.findByIdAndDelete = async (id) => {
    const idx = mockDb.judgeAssignments.findIndex(a => String(a._id) === String(id));
    if (idx !== -1) {
      const removed = mockDb.judgeAssignments.splice(idx, 1)[0];
      return removed;
    }
    return null;
  };

  EvaluationScore.findOne = async () => null;
  EvaluationScore.create = async (doc) => ({
    _id: 'mock_eval_score_1',
    ...doc,
    save: async function() { return this; }
  });

  let generatedInviteCode = '';

  // ==========================================
  // SECTION 1: JUDGE INVITATIONS
  // ==========================================

  await t.test('Organizer invites judges: generates invite link (201)', async () => {
    const res = await request(app)
      .post('/api/judges/invite')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ event_id: 'ev_1' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.invite_code, 'Must return invite_code');
    assert.ok(res.body.invite_link.includes(res.body.invite_code), 'Invite link must contain code');
    generatedInviteCode = res.body.invite_code;
  });

  await t.test('Organizer invites judge by email (local only) (201)', async () => {
    const res = await request(app)
      .post('/api/judges/invite')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ email: 'dr_chen@university.local', event_id: 'ev_1' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.invite.email, 'dr_chen@university.local');
  });

  await t.test('Participant is rejected with 403 Forbidden when attempting to invite judges', async () => {
    const res = await request(app)
      .post('/api/judges/invite')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ email: 'unauthorized@dogfood.local' });

    assert.strictEqual(res.status, 403);
    assert.ok(res.body.error, 'Must indicate forbidden');
  });

  await t.test('Anonymous user is rejected with 401 Unauthorized when attempting to invite judges', async () => {
    const res = await request(app)
      .post('/api/judges/invite')
      .send({ email: 'anon@dogfood.local' });

    assert.strictEqual(res.status, 401);
  });

  await t.test('User joins/accepts judge invite with valid code (200, role becomes JUDGE)', async () => {
    const res = await request(app)
      .post('/api/judges/join')
      .set('Authorization', `Bearer ${p2Token}`)
      .send({ invite_code: generatedInviteCode });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'JUDGE');
  });

  await t.test('Join judge invite fails with 404 for invalid code', async () => {
    const res = await request(app)
      .post('/api/judges/join')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({ invite_code: 'INVALID_9999' });

    assert.strictEqual(res.status, 404);
  });

  await t.test('Organizer can list all judge invites (200)', async () => {
    const res = await request(app)
      .get('/api/judges/invites')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.count, 2);
  });

  await t.test('Organizer can list all available judges (200)', async () => {
    const res = await request(app)
      .get('/api/judges')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.judges.length >= 3);
  });

  // ==========================================
  // SECTION 2: MANUAL & BATCH ASSIGNMENT & CONFLICT OF INTEREST
  // ==========================================

  await t.test('Manual Mode: Organizer assigns project to judge (201)', async () => {
    const res = await request(app)
      .post('/api/judges/assignments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        submission_id: 'sub_2',
        judge_id: 'judge_user_1',
        event_id: 'ev_1'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.assignment);
  });

  await t.test('Manual Mode: Participant receives 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/judges/assignments')
      .set('Authorization', `Bearer ${p1Token}`)
      .send({
        submission_id: 'sub_2',
        judge_id: 'judge_user_1'
      });

    assert.strictEqual(res.status, 403);
  });

  await t.test('CRITICAL CONFLICT OF INTEREST: Organizer cannot assign judge to project from judge’s own team (400)', async () => {
    // sub_1 is created by Team Alpha, where judge_user_conflicted is the leader!
    const res = await request(app)
      .post('/api/judges/assignments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        submission_id: 'sub_1',
        judge_id: 'judge_user_conflicted',
        event_id: 'ev_1'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Conflict of Interest');
  });

  await t.test('Batch Mode: Organizer batch assigns projects to judges (201)', async () => {
    const res = await request(app)
      .post('/api/judges/assignments/batch')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        assignments: [
          { submission_id: 'sub_3', judge_id: 'judge_user_1' },
          { submission_id: 'sub_3', judge_id: 'judge_user_2' }
        ],
        event_id: 'ev_1'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.assigned_count, 2);
  });

  await t.test('Batch Mode: Detects and skips conflict of interest pair', async () => {
    const res = await request(app)
      .post('/api/judges/assignments/batch')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        assignments: [
          { submission_id: 'sub_1', judge_id: 'judge_user_conflicted' } // Conflict!
        ],
        event_id: 'ev_1'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.skipped_count, 1);
    assert.strictEqual(res.body.skipped[0].reason, 'Conflict of interest (own team)');
  });

  // ==========================================
  // SECTION 3: AUTOMATIC ASSIGNMENT (N Judges, Even Load, No Own Team)
  // ==========================================

  await t.test('Automatic Mode: Assigns configurable N judges with even load and no own-team project (200)', async () => {
    // Reset assignments for pure test
    mockDb.judgeAssignments = [];

    const res = await request(app)
      .post('/api/judges/assignments/automatic')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        event_id: 'ev_1',
        n_judges: 2
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.n_judges, 2);
    assert.strictEqual(res.body.total_projects, 3);
    // 3 projects * 2 judges = 6 total assignments
    assert.strictEqual(mockDb.judgeAssignments.length, 6);

    // Verify Constraint 1: Each project received exactly 2 judges
    const subCounts = {};
    for (const a of mockDb.judgeAssignments) {
      const sId = String(a.submission_id);
      subCounts[sId] = (subCounts[sId] || 0) + 1;
    }
    assert.strictEqual(subCounts['sub_1'], 2);
    assert.strictEqual(subCounts['sub_2'], 2);
    assert.strictEqual(subCounts['sub_3'], 2);

    // Verify Constraint 2: Load is spread evenly across available judges
    const loads = Object.values(res.body.judge_loads);
    const maxLoad = Math.max(...loads);
    const minLoad = Math.min(...loads);
    assert.ok(maxLoad - minLoad <= 1, `Loads must be balanced. Max=${maxLoad}, Min=${minLoad}`);

    // Verify Constraint 3: STRICT CHECK — No judge gets a project from their own team!
    const sub1Assignments = mockDb.judgeAssignments.filter(a => String(a.submission_id) === 'sub_1');
    const assignedJudgesSub1 = sub1Assignments.map(a => String(a.judge_id));
    assert.ok(
      !assignedJudgesSub1.includes('judge_user_conflicted'),
      'CRITICAL: Conflicted judge must NEVER be assigned to project sub_1 from Team Alpha!'
    );
  });

  // ==========================================
  // SECTION 4: JUDGE ISOLATION & STRICT 403 CHECKS
  // ==========================================

  await t.test('Setup isolated assignment for Judge 1 and Judge 2', async () => {
    mockDb.judgeAssignments = [
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
        submission_id: 'sub_2',
        judge_id: 'judge_user_2',
        status: 'assigned'
      }
    ];
  });

  await t.test('Judge 1 sees ONLY projects assigned to them (sub_1), NOT sub_2 (200)', async () => {
    const res = await request(app)
      .get('/api/judges/assignments')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.total, 1);
    assert.strictEqual(String(res.body.assignments[0].submission_id), 'sub_1');
  });

  await t.test('STRICT CHECK: Participant receives 403 Forbidden on GET /api/judges/assignments', async () => {
    const res = await request(app)
      .get('/api/judges/assignments')
      .set('Authorization', `Bearer ${p1Token}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('STRICT CHECK: Unauthenticated user receives 401 on GET /api/judges/assignments', async () => {
    const res = await request(app)
      .get('/api/judges/assignments');

    assert.strictEqual(res.status, 401);
  });

  await t.test('Judge 1 accessing assigned project details sub_1 succeeds (200)', async () => {
    const res = await request(app)
      .get('/api/submissions/sub_1')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.title, 'Alpha Autonomous Runtime');
  });

  await t.test('STRICT 403 CHECK: Judge 1 receives 403 Forbidden accessing unassigned project sub_2 via GET /api/submissions/:id', async () => {
    // sub_2 is assigned ONLY to Judge 2!
    const res = await request(app)
      .get('/api/submissions/sub_2')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');
    assert.ok(res.body.message.includes('not assigned to evaluate this project'));
  });

  await t.test('STRICT 403 CHECK: Judge 1 receives 403 Forbidden accessing unassigned project sub_2 via dedicated route GET /api/judges/submissions/:id', async () => {
    const res = await request(app)
      .get('/api/judges/submissions/sub_2')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('Judge 1 accessing assigned project sub_1 via dedicated route GET /api/judges/submissions/:id succeeds (200)', async () => {
    const res = await request(app)
      .get('/api/judges/submissions/sub_1')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.submission.title, 'Alpha Autonomous Runtime');
  });

  await t.test('STRICT 403 CHECK: Judge 1 receives 403 Forbidden attempting to submit score for unassigned project sub_2', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_2/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        scores: { innovation: 25, execution: 20 },
        feedback: 'Unauthorized scoring attempt'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('Judge 1 submits score for assigned project sub_1 succeeds (200)', async () => {
    const res = await request(app)
      .post('/api/judges/submissions/sub_1/score')
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        scores: { innovation: 24, execution: 23 },
        feedback: 'Outstanding technical rigor and autonomous design'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Scores submitted successfully');
  });

  await t.test('Organizer removes assignment (200)', async () => {
    const res = await request(app)
      .delete('/api/judges/assignments/asgn_1')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });
});
