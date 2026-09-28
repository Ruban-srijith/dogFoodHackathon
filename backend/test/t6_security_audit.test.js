const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-t6-security-audit';

const app = require('../src/server');
const { generateToken } = require('../src/auth');
const { User, Event, Track, Prize, Team, Submission, JudgeInvite, JudgeAssignment, RubricCriterion, EvaluationScore } = require('../src/models');

test('T6 Security & Authorization Audit Suite', async (t) => {
  // Test User Entities
  const organizerUser = { _id: 'org_t6', id: 'org_t6', email: 'org@dogfood.local', username: 'org_t6', role: 'ORGANIZER', full_name: 'Lead Organizer' };
  const adminUser = { _id: 'admin_t6', id: 'admin_t6', email: 'admin@dogfood.local', username: 'admin_t6', role: 'ADMIN', full_name: 'System Admin' };
  const participantA = { _id: 'part_a', id: 'part_a', email: 'alice@dogfood.local', username: 'alice_t6', role: 'PARTICIPANT', full_name: 'Alice Team Member' };
  const participantB = { _id: 'part_b', id: 'part_b', email: 'bob@dogfood.local', username: 'bob_t6', role: 'PARTICIPANT', full_name: 'Bob Outsider' };
  const judge1 = { _id: 'judge_1', id: 'judge_1', email: 'judge1@dogfood.local', username: 'judge1_t6', role: 'JUDGE', full_name: 'Dr. Sarah Chen' };
  const judge2 = { _id: 'judge_2', id: 'judge_2', email: 'judge2@dogfood.local', username: 'judge2_t6', role: 'JUDGE', full_name: 'Marcus Vance' };

  const organizerToken = generateToken(organizerUser);
  const adminToken = generateToken(adminUser);
  const partAToken = generateToken(participantA);
  const partBToken = generateToken(participantB);
  const judge1Token = generateToken(judge1);
  const judge2Token = generateToken(judge2);

  const pastDate = new Date(Date.now() - 3600000); // 1 hour ago (passed deadline)
  const futureDate = new Date(Date.now() + 86400000); // 1 day in future (open deadline)

  const activeEvent = {
    _id: 'ev_active',
    title: 'Active Hackathon',
    slug: 'active-hackathon',
    submission_deadline: futureDate,
    status: 'ongoing'
  };

  const closedEvent = {
    _id: 'ev_closed',
    title: 'Closed Hackathon',
    slug: 'closed-hackathon',
    submission_deadline: pastDate,
    status: 'closed'
  };

  const teamA = {
    _id: 'team_a',
    event_id: activeEvent._id,
    name: 'Team Alpha',
    slug: 'team-alpha',
    leader_id: participantA._id,
    members: [participantA._id],
    invite_code: 'CODE_ALPHA'
  };

  const teamClosed = {
    _id: 'team_closed',
    event_id: closedEvent._id,
    name: 'Team Closed',
    slug: 'team-closed',
    leader_id: participantA._id,
    members: [participantA._id],
    invite_code: 'CODE_CLOSED'
  };

  const draftSubmissionA = {
    _id: 'sub_draft_a',
    event_id: activeEvent._id,
    team_id: teamA,
    title: 'Super Secret In-Progress AI',
    description: 'Proprietary confidential work in progress',
    status: 'draft',
    tech_stack: ['Python', 'Torch']
  };

  const submittedSubA = {
    _id: 'sub_public_a',
    event_id: activeEvent._id,
    team_id: teamA,
    title: 'Published AI Agent',
    description: 'Publicly visible completed submission',
    status: 'submitted',
    tech_stack: ['Node.js']
  };

  const closedEventSubmission = {
    _id: 'sub_closed_event',
    event_id: closedEvent._id,
    team_id: teamClosed._id,
    title: 'Late Project After Deadline',
    description: 'Submitted to closed event',
    status: 'submitted'
  };

  const assignmentJudge1 = {
    _id: 'asgn_j1',
    event_id: activeEvent._id,
    submission_id: submittedSubA,
    judge_id: judge1,
    status: 'assigned'
  };

  const assignmentJudge2 = {
    _id: 'asgn_j2',
    event_id: activeEvent._id,
    submission_id: submittedSubA,
    judge_id: judge2,
    status: 'assigned'
  };

  const scoreJudge1 = {
    _id: 'score_j1',
    event_id: activeEvent._id,
    submission_id: submittedSubA._id,
    judge_id: judge1,
    criteria_scores: [{ name: 'Quality', score: 8, weight: 1.0 }],
    weighted_total: 80,
    comment: 'Great work from Sarah',
    status: 'submitted'
  };

  const scoreJudge2 = {
    _id: 'score_j2',
    event_id: activeEvent._id,
    submission_id: submittedSubA._id,
    judge_id: judge2,
    criteria_scores: [{ name: 'Quality', score: 9, weight: 1.0 }],
    weighted_total: 90,
    comment: 'Confidential review from Marcus',
    status: 'submitted'
  };

  // Mock DB Setup
  User.countDocuments = async () => 6;
  Event.countDocuments = async () => 2;
  Track.countDocuments = async () => 2;
  Prize.countDocuments = async () => 3;
  Team.countDocuments = async () => 2;
  Submission.countDocuments = async () => 3;

  Track.find = () => ({ lean: async () => [] });
  Prize.find = () => ({ lean: async () => [] });

  User.find = () => ({
    select: () => ({ lean: async () => [judge1, judge2] }),
    sort: () => ({ lean: async () => [participantA, participantB, judge1, judge2, organizerUser, adminUser] }),
    lean: async () => [participantA, participantB, judge1, judge2, organizerUser, adminUser]
  });

  User.findById = async (id) => {
    const all = [participantA, participantB, judge1, judge2, organizerUser, adminUser];
    return all.find(u => String(u._id) === String(id) || String(u.id) === String(id)) || null;
  };

  User.findOne = async (query) => {
    if (query.email) {
      const all = [participantA, participantB, judge1, judge2, organizerUser, adminUser];
      return all.find(u => u.email === query.email) || null;
    }
    return null;
  };

  Event.findById = async (id) => {
    if (String(id) === String(activeEvent._id)) return activeEvent;
    if (String(id) === String(closedEvent._id)) return closedEvent;
    return null;
  };

  Event.findOne = () => ({
    sort: () => ({ lean: async () => activeEvent }),
    lean: async () => activeEvent
  });

  Team.findById = async (id) => {
    if (String(id) === String(teamA._id)) return teamA;
    if (String(id) === String(teamClosed._id)) return teamClosed;
    return null;
  };

  Team.find = () => ({
    populate: function() { return this; },
    sort: function() { return { lean: async () => [teamA] }; },
    lean: async () => [teamA]
  });

  Team.findOne = async (query) => {
    if (query.invite_code === 'CODE_ALPHA') return teamA;
    if (query.invite_code === 'CODE_CLOSED') return teamClosed;
    return null;
  };

  Submission.findById = (id) => {
    let sub = null;
    if (String(id) === String(draftSubmissionA._id)) sub = draftSubmissionA;
    else if (String(id) === String(submittedSubA._id)) sub = submittedSubA;
    else if (String(id) === String(closedEventSubmission._id)) sub = closedEventSubmission;

    return {
      populate: function() { return this; },
      lean: async () => sub,
      then: (resolve) => resolve(sub)
    };
  };

  Submission.find = () => ({
    populate: function() { return this; },
    sort: function() { return { lean: async () => [submittedSubA] }; },
    lean: async () => [submittedSubA]
  });

  JudgeAssignment.findOne = async (query) => {
    if (String(query.judge_id) === String(judge1._id) && String(query.submission_id) === String(submittedSubA._id)) {
      return assignmentJudge1;
    }
    if (String(query.judge_id) === String(judge2._id) && String(query.submission_id) === String(submittedSubA._id)) {
      return assignmentJudge2;
    }
    return null;
  };

  JudgeAssignment.find = (filter) => {
    let list = [assignmentJudge1, assignmentJudge2];
    if (filter && filter.judge_id) {
      list = list.filter(a => String(a.judge_id._id || a.judge_id) === String(filter.judge_id));
    }
    return {
      populate: function() { return this; },
      sort: function() { return { lean: async () => list }; },
      lean: async () => list
    };
  };

  EvaluationScore.findOne = async (query) => {
    if (String(query.judge_id) === String(judge1._id)) return scoreJudge1;
    if (String(query.judge_id) === String(judge2._id)) return scoreJudge2;
    return null;
  };

  EvaluationScore.findById = (id) => {
    const score = String(id) === String(scoreJudge1._id) ? scoreJudge1 : String(id) === String(scoreJudge2._id) ? scoreJudge2 : null;
    return {
      populate: function() { return this; },
      lean: async () => score,
      then: (resolve) => resolve(score)
    };
  };

  EvaluationScore.find = () => ({
    populate: function() { return this; },
    sort: function() { return { lean: async () => [scoreJudge1, scoreJudge2] }; },
    lean: async () => [scoreJudge1, scoreJudge2]
  });

  JudgeInvite.findOne = async (query) => {
    if (query.invite_code === 'TARGETED_CHEN') {
      return {
        _id: 'inv_1',
        invite_code: 'TARGETED_CHEN',
        email: 'dr_chen@university.local',
        status: 'pending',
        save: async function() { return this; }
      };
    }
    return null;
  };

  // =========================================================================
  // 1. AUDIT CATEGORY 1: Routes missing auth or role checks & draft isolation
  // =========================================================================
  await t.test('Audit 1: GET /api/submissions/:id rejects outsiders on draft projects with 403', async () => {
    // Outsider participant B cannot view team A's draft project
    const resOutsider = await request(app)
      .get(`/api/submissions/${draftSubmissionA._id}`)
      .set('Authorization', `Bearer ${partBToken}`);
    assert.equal(resOutsider.status, 403, 'Outsider participant should receive 403 Forbidden on draft submission');
    assert.match(resOutsider.body.message, /Draft projects are private/);

    // Unauthenticated user cannot view draft project
    const resAnon = await request(app).get(`/api/submissions/${draftSubmissionA._id}`);
    assert.equal(resAnon.status, 403, 'Anonymous user should receive 403 Forbidden on draft submission');

    // Team member Alice can view her own draft project
    const resMember = await request(app)
      .get(`/api/submissions/${draftSubmissionA._id}`)
      .set('Authorization', `Bearer ${partAToken}`);
    assert.equal(resMember.status, 200, 'Team member should be allowed to view draft project');

    // Organizer can view draft project for moderation
    const resOrg = await request(app)
      .get(`/api/submissions/${draftSubmissionA._id}`)
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.equal(resOrg.status, 200, 'Organizer should be allowed to view draft project');
  });

  // =========================================================================
  // 2. AUDIT CATEGORY 2: Participant reaching judge or organizer routes
  // =========================================================================
  await t.test('Audit 2: Participant is strictly blocked from all organizer and judge routes (403)', async () => {
    const forbiddenOrganizerRoutes = [
      { method: 'post', url: '/api/events' },
      { method: 'get', url: '/api/organizer/events' },
      { method: 'post', url: '/api/judges/invite' },
      { method: 'get', url: '/api/judges/invites' },
      { method: 'get', url: '/api/judges' },
      { method: 'post', url: '/api/judges/assignments' },
      { method: 'post', url: '/api/judges/assignments/batch' },
      { method: 'post', url: '/api/judges/assignments/automatic' },
      { method: 'delete', url: '/api/judges/assignments/asgn_1' },
      { method: 'post', url: '/api/rubrics' },
      { method: 'put', url: '/api/rubrics/crit_1' },
      { method: 'delete', url: '/api/rubrics/crit_1' },
      { method: 'post', url: '/api/scores/score_1/reopen' },
      { method: 'get', url: '/api/organizer/judges/progress' },
      { method: 'get', url: '/api/export/participants' },
      { method: 'get', url: '/api/export/teams' },
      { method: 'get', url: '/api/export/final_results' }
    ];

    for (const route of forbiddenOrganizerRoutes) {
      const res = await request(app)[route.method](route.url)
        .set('Authorization', `Bearer ${partAToken}`)
        .send({});
      assert.equal(res.status, 403, `Participant must get 403 Forbidden on ${route.method.toUpperCase()} ${route.url}`);
    }

    const forbiddenJudgeRoutes = [
      { method: 'get', url: '/api/judge/evaluations' },
      { method: 'get', url: '/api/judges/projects' },
      { method: 'get', url: '/api/judges/submissions/sub_public_a' },
      { method: 'post', url: '/api/judges/submissions/sub_public_a/score' }
    ];

    for (const route of forbiddenJudgeRoutes) {
      const res = await request(app)[route.method](route.url)
        .set('Authorization', `Bearer ${partAToken}`)
        .send({});
      assert.equal(res.status, 403, `Participant must get 403 Forbidden on ${route.method.toUpperCase()} ${route.url}`);
    }
  });

  await t.test('Audit 2 (targeted join): Participant cannot hijack a judge invitation sent to another email address', async () => {
    // Participant Alice (alice@dogfood.local) attempts to join using code sent to dr_chen@university.local
    const res = await request(app)
      .post('/api/judges/join')
      .set('Authorization', `Bearer ${partAToken}`)
      .send({ invite_code: 'TARGETED_CHEN' });

    assert.equal(res.status, 403, 'Should reject join when user email does not match targeted invitation email');
    assert.match(res.body.message, /different email address/);
  });

  // =========================================================================
  // 3. AUDIT CATEGORY 3: Judge reaching another judge's data
  // =========================================================================
  await t.test('Audit 3: Judge A receives 403 Forbidden when requesting Judge B score by ID', async () => {
    // Judge 1 requests Judge 2's score ID
    const res = await request(app)
      .get(`/api/scores/${scoreJudge2._id}`)
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.equal(res.status, 403, 'Judge 1 should receive 403 when requesting Judge 2 score by ID');
    assert.match(res.body.message, /cannot view scores submitted by another judge/);
  });

  await t.test('Audit 3: Judge receives 403 when querying scores for an unassigned project', async () => {
    // Judge 1 is not assigned to draftSubmissionA
    const res = await request(app)
      .get(`/api/scores/submission/${draftSubmissionA._id}`)
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.equal(res.status, 403, 'Judge should receive 403 when probing scores for unassigned project');
  });

  await t.test('Audit 3: GET /api/leaderboard masks individual judge identities and stats for non-organizers', async () => {
    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${judge1Token}`);

    assert.equal(res.status, 200);

    // In evaluations array, judge_id, judge_name, judge_email should NOT be leaked
    if (res.body.rankings && res.body.rankings[0]?.evaluations?.length > 0) {
      for (const ev of res.body.rankings[0].evaluations) {
        assert.equal(ev.judge_id, undefined, 'Judge ID must not be leaked in leaderboard evaluations');
        assert.equal(ev.judge_name, undefined, 'Judge name must not be leaked in leaderboard evaluations');
      }
    }

    // In judge_stats, judge_email and judge_id should be masked
    if (res.body.judge_stats && res.body.judge_stats.length > 0) {
      for (const st of res.body.judge_stats) {
        assert.equal(st.judge_id, undefined, 'Judge ID must not be leaked in judge_stats');
        assert.equal(st.judge_email, undefined, 'Judge email must not be leaked in judge_stats');
        assert.ok(st.judge_alias, 'judge_alias should be used instead of real names');
      }
    }
  });

  // =========================================================================
  // 4. AUDIT CATEGORY 4: Edits and actions allowed after the deadline
  // =========================================================================
  await t.test('Audit 4: Rejects submission edits after the deadline (403 Forbidden)', async () => {
    const res = await request(app)
      .put(`/api/submissions/${closedEventSubmission._id}`)
      .set('Authorization', `Bearer ${partAToken}`)
      .send({ title: 'Attempted edit after deadline' });

    assert.equal(res.status, 403, 'Edits after deadline must be rejected with 403');
    assert.match(res.body.message, /deadline has passed/i);
  });

  await t.test('Audit 4: Rejects team registration and join after event deadline has passed (403)', async () => {
    // Create team after deadline
    const resCreateTeam = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${partBToken}`)
      .send({
        event_id: closedEvent._id,
        name: 'Late Team Post-Deadline'
      });

    assert.equal(resCreateTeam.status, 403, 'Team creation after deadline must be rejected with 403');
    assert.match(resCreateTeam.body.message, /deadline has passed/i);

    // Join team after deadline
    const resJoinTeam = await request(app)
      .post('/api/teams/join')
      .set('Authorization', `Bearer ${partBToken}`)
      .send({ invite_code: 'CODE_CLOSED' });

    assert.equal(resJoinTeam.status, 403, 'Joining team after deadline must be rejected with 403');
    assert.match(resJoinTeam.body.message, /deadline has passed/i);
  });

  // =========================================================================
  // 5. AUDIT CATEGORY 5: Passwords and secrets in logs or responses
  // =========================================================================
  await t.test('Audit 5: Plain-text passwords and password hashes are never returned in responses', async () => {
    // 1. GET /api/overview must NOT return plain-text passwords
    const resOverview = await request(app).get('/api/overview');
    assert.equal(resOverview.status, 200);
    const bodyStr = JSON.stringify(resOverview.body);
    assert.doesNotMatch(bodyStr, /"password":/, '/api/overview must not contain any "password" keys');
    assert.doesNotMatch(bodyStr, /password_hash/, '/api/overview must not contain password hashes');

    // 2. GET /api/auth/me must NOT contain password_hash
    const resMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${partAToken}`);
    assert.equal(resMe.status, 200);
    assert.equal(resMe.body.user.password_hash, undefined, '/api/auth/me must never return password_hash');

    // 3. GET /api/export/participants CSV must NOT contain password_hash
    const resExport = await request(app)
      .get('/api/export/participants')
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.equal(resExport.status, 200);
    assert.doesNotMatch(resExport.text, /password_hash/i, 'Participant CSV export must not contain password_hash');
    assert.doesNotMatch(resExport.text, /Password123/i, 'Participant CSV export must not contain passwords');
  });
});
