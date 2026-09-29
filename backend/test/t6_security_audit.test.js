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

  const scoreClosed = {
    _id: 'score_closed',
    event_id: closedEvent._id,
    submission_id: closedEventSubmission._id,
    judge_id: judge1,
    criteria_scores: [{ name: 'Quality', score: 8, weight: 1.0 }],
    weighted_total: 80,
    comment: 'Score for closed event',
    status: 'submitted',
    save: async function() { return this; }
  };

  // Mock DB Setup
  User.countDocuments = async () => 6;
  Event.countDocuments = async () => 2;
  Track.countDocuments = async () => 2;
  Prize.countDocuments = async () => 3;
  Team.countDocuments = async () => 2;
  Submission.countDocuments = async () => 3;
  EvaluationScore.countDocuments = async () => 2;

  Track.find = () => ({ lean: async () => [] });
  Prize.find = () => ({ lean: async () => [] });

  User.find = () => ({
    select: function() { return this; },
    sort: function() { return this; },
    lean: async () => [participantA, participantB, judge1, judge2, organizerUser, adminUser],
    then: (resolve) => resolve([participantA, participantB, judge1, judge2, organizerUser, adminUser])
  });

  User.findById = async (id) => {
    const all = [participantA, participantB, judge1, judge2, organizerUser, adminUser];
    const u = all.find(x => String(x._id) === String(id) || String(x.id) === String(id));
    if (!u) return null;
    return {
      ...u,
      save: async function() { return this; }
    };
  };

  User.create = async (doc) => ({
    _id: 'new_user_mock_id',
    id: 'new_user_mock_id',
    created_at: new Date(),
    ...doc
  });

  User.findOne = async (query) => {
    const all = [participantA, participantB, judge1, judge2, organizerUser, adminUser];
    if (query && query.$or) {
      return all.find(u => query.$or.some(c => (c.email && u.email === c.email) || (c.username && u.username === c.username))) || null;
    }
    if (query && query.email) {
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

  Team.findById = (id) => {
    let t = null;
    if (String(id) === String(teamA._id)) t = teamA;
    if (String(id) === String(teamClosed._id)) t = teamClosed;
    return {
      populate: function() { return this; },
      lean: async () => t,
      then: (resolve) => resolve(t)
    };
  };

  Team.find = () => ({
    populate: function() { return this; },
    sort: function() { return { lean: async () => [teamA] }; },
    lean: async () => [teamA]
  });

  Team.findOne = (query) => {
    let t = null;
    if (query.invite_code === 'CODE_ALPHA' || query.slug === 'team-alpha') t = teamA;
    if (query.invite_code === 'CODE_CLOSED' || query.slug === 'team-closed') t = teamClosed;
    return {
      populate: function() { return this; },
      lean: async () => t,
      then: (resolve) => resolve(t)
    };
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
    const scores = [scoreJudge1, scoreJudge2, scoreClosed];
    if (query._id) {
      return scores.find(s => String(s._id) === String(query._id)) || null;
    }
    if (query.$or) {
      for (const cond of query.$or) {
        if (cond._id) {
          const found = scores.find(s => String(s._id) === String(cond._id));
          if (found) return found;
        }
        if (cond.submission_id) {
          const found = scores.find(s => String(s.submission_id) === String(cond.submission_id));
          if (found) return found;
        }
      }
    }
    if (query.judge_id) {
      return scores.find(s => String(s.judge_id._id || s.judge_id) === String(query.judge_id)) || null;
    }
    return null;
  };

  EvaluationScore.findById = (id) => {
    let score = null;
    if (String(id) === String(scoreJudge1._id)) score = scoreJudge1;
    else if (String(id) === String(scoreJudge2._id)) score = scoreJudge2;
    else if (String(id) === String(scoreClosed._id)) score = scoreClosed;
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

  // =========================================================================
  // 6. AUDIT CATEGORY 6: Team Invite Code Confidentiality & Leak Prevention
  // =========================================================================
  await t.test('Audit 6: Team invite codes are never leaked in public gallery or to outsiders', async () => {
    // 1. GET /api/gallery must NOT leak invite_code
    const resGallery = await request(app).get('/api/gallery');
    assert.equal(resGallery.status, 200);
    assert.ok(resGallery.body.projects?.length > 0, 'Gallery should return projects');
    for (const p of resGallery.body.projects) {
      if (p.team_id) {
        assert.equal(p.team_id.invite_code, undefined, 'Public gallery must not leak team invite_code');
      }
    }

    // 2. GET /api/submissions/:id: Outsider cannot see team invite_code
    const resSubOutsider = await request(app)
      .get(`/api/submissions/${submittedSubA._id}`)
      .set('Authorization', `Bearer ${partBToken}`);
    assert.equal(resSubOutsider.status, 200);
    assert.equal(resSubOutsider.body.team_id?.invite_code, undefined, 'Outsiders must not receive team invite_code');

    // 3. GET /api/submissions/:id: Team member Alice CAN see her team invite_code
    const resSubMember = await request(app)
      .get(`/api/submissions/${submittedSubA._id}`)
      .set('Authorization', `Bearer ${partAToken}`);
    assert.equal(resSubMember.status, 200);
    assert.equal(resSubMember.body.team_id?.invite_code, 'CODE_ALPHA', 'Team member should be able to view their own invite_code');

    // 4. GET /api/teams/:id: Outsider cannot see invite_code
    const resTeamOutsider = await request(app)
      .get(`/api/teams/${teamA._id}`)
      .set('Authorization', `Bearer ${partBToken}`);
    assert.equal(resTeamOutsider.status, 200);
    assert.equal(resTeamOutsider.body.invite_code, undefined, 'Outsider fetching team must not receive invite_code');

    // 5. GET /api/teams/:id: Team member CAN see invite_code
    const resTeamMember = await request(app)
      .get(`/api/teams/${teamA._id}`)
      .set('Authorization', `Bearer ${partAToken}`);
    assert.equal(resTeamMember.status, 200);
    assert.equal(resTeamMember.body.invite_code, 'CODE_ALPHA', 'Team member fetching team must receive invite_code');
  });

  // =========================================================================
  // 7. AUDIT CATEGORY 7: Role Whitelisting on Judge Assignments
  // =========================================================================
  await t.test('Audit 7: Unknown or arbitrary roles are rejected from judge assignments (403)', async () => {
    const guestUser = { _id: 'guest_1', id: 'guest_1', email: 'guest@dogfood.local', username: 'guest_1', role: 'GUEST', full_name: 'Guest User' };
    const guestToken = generateToken(guestUser);

    const res = await request(app)
      .get('/api/judges/assignments')
      .set('Authorization', `Bearer ${guestToken}`);
    assert.equal(res.status, 403, 'Non-whitelisted role GUEST must be rejected with 403 Forbidden');
  });

  // =========================================================================
  // 8. AUDIT CATEGORY 8: Evaluations Rejected on Closed Events
  // =========================================================================
  await t.test('Audit 8: Scoring rejected when event has ended or is closed (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/judges/submissions/${closedEventSubmission._id}/score`)
      .set('Authorization', `Bearer ${judge1Token}`)
      .send({
        scores: { Quality: 9 }
      });
    assert.equal(res.status, 403, 'Scoring on closed events must return 403 Forbidden');
    assert.match(res.body.message, /event is closed/i);

    // Also verify organizer cannot reopen evaluation for closed event
    const resReopen = await request(app)
      .post(`/api/scores/${scoreClosed._id}/reopen`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({});
    assert.equal(resReopen.body.message || resReopen.status, 'The event is closed. Reopening scores is no longer permitted.');
    assert.equal(resReopen.status, 403, 'Reopening score on closed events must return 403 Forbidden');
    assert.match(resReopen.body.message, /event is closed/i);
  });

  // =========================================================================
  // 9. AUDIT CATEGORY 9: Admin User Directory & Role Governance
  // =========================================================================
  await t.test('Audit 9: User directory & role modification strictly restricted to Admin', async () => {
    // Participant blocked from GET /api/users
    const resPartGet = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${partAToken}`);
    assert.equal(resPartGet.status, 403, 'Participant must get 403 on GET /api/users');

    // Participant blocked from PATCH /api/users/:id/role
    const resPartPatch = await request(app)
      .patch(`/api/users/${participantA._id}/role`)
      .set('Authorization', `Bearer ${partAToken}`)
      .send({ role: 'ADMIN' });
    assert.equal(resPartPatch.status, 403, 'Participant must get 403 on PATCH /api/users/:id/role');

    // Admin can list users and password_hash is stripped
    const resAdminGet = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resAdminGet.status, 200);
    assert.ok(Array.isArray(resAdminGet.body), 'Admin should receive user array');
    for (const u of resAdminGet.body) {
      assert.equal(u.password_hash, undefined, 'Users in admin directory must not contain password_hash');
    }

    // Admin can update user role
    const resAdminPatch = await request(app)
      .patch(`/api/users/${participantB._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'JUDGE' });
    assert.equal(resAdminPatch.status, 200);
    assert.equal(resAdminPatch.body.role, 'JUDGE');
    assert.equal(resAdminPatch.body.password_hash, undefined);

    // Participant blocked from POST /api/users (Add User)
    const resPartCreate = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${partAToken}`)
      .send({
        email: 'attacker@evil.local',
        username: 'attacker',
        password: 'Password123!',
        role: 'ADMIN'
      });
    assert.equal(resPartCreate.status, 403, 'Participant must get 403 trying to create users');

    // Admin user creation validation checks
    const resAdminCreateMissing = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'newuser@dogfood.local' });
    assert.equal(resAdminCreateMissing.status, 400, 'Missing username/password must return 400');

    const resAdminCreateShortPass = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'shortpass@dogfood.local', username: 'shortpass', password: '123' });
    assert.equal(resAdminCreateShortPass.status, 400, 'Short password must return 400');

    const resAdminCreateDup = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: participantA.email, username: 'uniqueuser123', password: 'ValidPassword123!' });
    assert.equal(resAdminCreateDup.status, 400, 'Duplicate email must return 400');

    // Admin successfully creates user
    const resAdminCreate = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'newjudge@dogfood.local',
        username: 'newjudge',
        password: 'JudgePassword123!',
        full_name: 'Dr. Provisioned Judge',
        role: 'JUDGE'
      });
    assert.equal(resAdminCreate.status, 201, 'Admin must get 201 Created on valid user creation');
    assert.equal(resAdminCreate.body.success, true);
    assert.equal(resAdminCreate.body.user.role, 'JUDGE');
    assert.equal(resAdminCreate.body.user.username, 'newjudge');
    assert.equal(resAdminCreate.body.user.password_hash, undefined, 'Password hash must never be returned');

    // Admin stats endpoint check
    const resStatsAdmin = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resStatsAdmin.status, 200);
    assert.ok(resStatsAdmin.body.totalUsers !== undefined);

    const resStatsPart = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${partAToken}`);
    assert.equal(resStatsPart.status, 403, 'Participant must get 403 on GET /api/admin/stats');
  });

  // =========================================================================
  // 10. AUDIT CATEGORY 10: Event Date Consistency Validation
  // =========================================================================
  await t.test('Audit 10: Event creation rejects invalid chronological date sequences (400)', async () => {
    // start_date >= end_date
    const resInvalidDates = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Broken Dates Hackathon',
        description: 'Test invalid dates',
        start_date: '2026-10-15',
        end_date: '2026-10-10', // Before start
        submission_deadline: '2026-10-12'
      });
    assert.equal(resInvalidDates.status, 400);
    assert.match(resInvalidDates.body.message, /start_date must be strictly before end_date/i);

    // submission_deadline > end_date
    const resDeadlineAfterEnd = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Late Deadline Hackathon',
        description: 'Test deadline after end',
        start_date: '2026-10-01',
        end_date: '2026-10-10',
        submission_deadline: '2026-10-15' // After end
      });
    assert.equal(resDeadlineAfterEnd.status, 400);
    assert.match(resDeadlineAfterEnd.body.message, /submission_deadline must fall between start_date and end_date/i);
  });
});
