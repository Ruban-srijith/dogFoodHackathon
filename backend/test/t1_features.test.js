const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-12345';

const app = require('../src/server');
const { generateToken } = require('../src/auth');
const { Event, Track, Prize, Team, Submission } = require('../src/models');

test('T1 Feature Suite: Events, Teams, Submissions, Deadlines & Gallery', async (t) => {

  // Test Users & Tokens
  const organizerUser = { id: 'org_user_1', email: 'organizer@dogfood.local', username: 'organizer', role: 'ORGANIZER' };
  const participant1 = { id: 'part_user_1', email: 'alice@dogfood.local', username: 'alice', role: 'PARTICIPANT' };
  const participant2 = { id: 'part_user_2', email: 'bob@dogfood.local', username: 'bob', role: 'PARTICIPANT' };
  const participant3 = { id: 'part_user_3', email: 'charlie@dogfood.local', username: 'charlie', role: 'PARTICIPANT' };
  const participant4 = { id: 'part_user_4', email: 'david@dogfood.local', username: 'david', role: 'PARTICIPANT' };
  const participant5 = { id: 'part_user_5', email: 'emma@dogfood.local', username: 'emma', role: 'PARTICIPANT' };
  const outsiderUser = { id: 'outsider_user', email: 'stranger@dogfood.local', username: 'stranger', role: 'PARTICIPANT' };

  const organizerToken = generateToken(organizerUser);
  const p1Token = generateToken(participant1);
  const p2Token = generateToken(participant2);
  const p3Token = generateToken(participant3);
  const p4Token = generateToken(participant4);
  const p5Token = generateToken(participant5);
  const outsiderToken = generateToken(outsiderUser);

  // In-Memory Database Store for Test Execution
  const mockDb = {
    events: [],
    tracks: [],
    prizes: [],
    teams: [],
    submissions: []
  };

  // Setup Model Mocks
  const originalEvent = {
    create: Event.create,
    find: Event.find,
    findById: Event.findById,
    findOne: Event.findOne
  };

  const originalTrack = {
    insertMany: Track.insertMany,
    find: Track.find,
    findOne: Track.findOne
  };

  const originalPrize = {
    insertMany: Prize.insertMany,
    find: Prize.find
  };

  const originalTeam = {
    create: Team.create,
    find: Team.find,
    findById: Team.findById,
    findOne: Team.findOne
  };

  const originalSubmission = {
    create: Submission.create,
    findById: Submission.findById,
    find: Submission.find
  };

  // Mock Event
  Event.create = async (doc) => {
    const newDoc = { _id: `ev_${mockDb.events.length + 1}`, ...doc };
    mockDb.events.push(newDoc);
    return newDoc;
  };
  Event.find = () => ({
    sort: () => ({
      lean: async () => mockDb.events
    })
  });
  Event.findById = async (id) => mockDb.events.find(e => String(e._id) === String(id)) || null;
  Event.findOne = () => ({
    sort: () => mockDb.events[0] || null,
    lean: async () => mockDb.events[0] || null
  });

  // Mock Track
  Track.insertMany = async (docs) => {
    const created = docs.map((d, i) => ({ _id: `tr_${mockDb.tracks.length + i + 1}`, ...d }));
    mockDb.tracks.push(...created);
    return created;
  };
  Track.findOne = async (query) => {
    if (query && query.event_id) {
      return mockDb.tracks.find(t => String(t.event_id) === String(query.event_id)) || mockDb.tracks[0] || null;
    }
    return mockDb.tracks[0] || null;
  };
  Track.find = (filter) => {
    let result = mockDb.tracks;
    if (filter && filter.event_id && filter.event_id.$in) {
      result = mockDb.tracks.filter(t => filter.event_id.$in.map(String).includes(String(t.event_id)));
    }
    return {
      lean: async () => result,
      select: () => result
    };
  };

  // Mock Prize
  Prize.insertMany = async (docs) => {
    const created = docs.map((d, i) => ({ _id: `prz_${mockDb.prizes.length + i + 1}`, ...d }));
    mockDb.prizes.push(...created);
    return created;
  };
  Prize.find = (filter) => {
    let result = mockDb.prizes;
    if (filter && filter.event_id && filter.event_id.$in) {
      result = mockDb.prizes.filter(p => filter.event_id.$in.map(String).includes(String(p.event_id)));
    }
    return {
      lean: async () => result
    };
  };

  // Mock Team
  Team.create = async (doc) => {
    const newDoc = {
      _id: `team_${mockDb.teams.length + 1}`,
      ...doc,
      save: async function() { return this; }
    };
    mockDb.teams.push(newDoc);
    return newDoc;
  };
  Team.findOne = async (query) => {
    if (query.invite_code) {
      const found = mockDb.teams.find(t => t.invite_code === query.invite_code);
      if (found) {
        found.save = async function() { return this; };
      }
      return found || null;
    }
    return null;
  };
  Team.findById = (id) => {
    const team = mockDb.teams.find(t => String(t._id) === String(id));
    if (team && !team.save) {
      team.save = async function() { return this; };
    }
    return {
      populate: function() { return this; },
      then: function(resolve) { resolve(team || null); }
    };
  };
  Team.find = () => ({
    populate: () => ({
      populate: () => ({
        populate: async () => mockDb.teams
      })
    }),
    lean: async () => mockDb.teams
  });

  // Mock Submission
  Submission.create = async (doc) => {
    const newDoc = {
      _id: `sub_${mockDb.submissions.length + 1}`,
      ...doc,
      save: async function() { return this; }
    };
    mockDb.submissions.push(newDoc);
    return newDoc;
  };
  Submission.findById = (id) => {
    const sub = mockDb.submissions.find(s => String(s._id) === String(id));
    if (sub && !sub.save) {
      sub.save = async function() { return this; };
    }
    return {
      populate: function() { return this; },
      then: function(resolve) { resolve(sub || null); }
    };
  };
  Submission.find = (filter) => {
    let result = mockDb.submissions;
    if (filter && filter.status && filter.status.$ne) {
      result = result.filter(s => s.status !== filter.status.$ne);
    }
    if (filter && filter.$or) {
      result = result.filter(s => {
        return filter.$or.some(cond => {
          if (cond.title) return cond.title.test(s.title);
          if (cond.tagline) return cond.tagline.test(s.tagline);
          if (cond.description) return cond.description.test(s.description);
          return false;
        });
      });
    }
    return {
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              lean: async () => result
            })
          })
        })
      })
    };
  };

  try {
    // =========================================================================
    // 1. ORGANIZER CREATES EVENT (CONFIGURABLE DATES, TRACKS, PRIZES)
    // =========================================================================
    let createdEventId = null;
    let openDeadlineEventId = null;
    let pastDeadlineEventId = null;

    await t.test('Organizer can create an event with dates, tracks, and prizes (201)', async () => {
      const futureDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days in future
      const payload = {
        title: 'Open Source AI Cup 2026',
        slug: 'open-source-ai-cup-2026',
        description: 'Global distributed hackathon for autonomous edge agents',
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        submission_deadline: futureDeadline,
        location: 'Virtual / Local-First',
        tracks: [
          { name: 'Edge AI Agents', description: 'Offline agent execution', prize_pool: '$10,000' },
          { name: 'Developer Tooling', description: 'Linters, parsers, and runtimes', prize_pool: '$5,000' }
        ],
        prizes: [
          { title: '1st Place Overall', award_amount: '$10,000', description: 'Best overall entry' },
          { title: 'Community Choice', award_amount: '$2,500', description: 'Peer voted favorite' }
        ]
      };

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.message, 'Event created successfully');
      assert.strictEqual(res.body.event.title, 'Open Source AI Cup 2026');
      assert.strictEqual(res.body.tracks.length, 2);
      assert.strictEqual(res.body.prizes.length, 2);

      createdEventId = res.body.event._id;
      openDeadlineEventId = createdEventId;
    });

    await t.test('Non-organizer (Participant) is rejected when trying to create event (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${p1Token}`)
        .send({
          title: 'Unauthorized Event',
          description: 'Hacker event',
          start_date: new Date(),
          end_date: new Date(),
          submission_deadline: new Date()
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'Forbidden');
    });

    await t.test('Event creation fails if required fields are missing (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ title: 'Incomplete Event' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Bad Request');
    });

    // Create a second event with a deadline in the PAST for testing deadline rejections
    await t.test('Organizer creates an event with a passed deadline for testing', async () => {
      const passedDeadline = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Closed Hackathon 2026',
          slug: 'closed-hackathon-2026',
          description: 'An event where deadline has ended',
          start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          submission_deadline: passedDeadline,
          tracks: [{ name: 'Legacy Track', prize_pool: '$1,000' }]
        });

      assert.strictEqual(res.status, 201);
      pastDeadlineEventId = res.body.event._id;
    });

    // =========================================================================
    // 2. PARTICIPANT CREATES TEAM AND INVITE LINK; MAX 4 MEMBERS ENFORCEMENT
    // =========================================================================
    let teamId = null;
    let inviteCode = null;

    await t.test('Participant creates a team and gets an invite link/code (201)', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${p1Token}`)
        .send({
          event_id: openDeadlineEventId,
          name: 'The Binary Nomads',
          description: 'Building offline resilience'
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.message, 'Team created successfully');
      assert.ok(res.body.invite_code, 'Invite code must be returned');
      assert.ok(res.body.invite_link, 'Invite link must be returned');
      assert.strictEqual(res.body.team.members.length, 1);
      assert.strictEqual(res.body.team.leader_id, participant1.id);

      teamId = res.body.team._id;
      inviteCode = res.body.invite_code;
    });

    await t.test('Second participant joins team via invite code (200)', async () => {
      const res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${p2Token}`)
        .send({ invite_code: inviteCode });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, 'Successfully joined team');
      assert.strictEqual(res.body.team.members.length, 2);
    });

    await t.test('Participant already in team is rejected on duplicate join (400)', async () => {
      const res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${p2Token}`)
        .send({ invite_code: inviteCode });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /already a member/);
    });

    await t.test('Third and fourth participants join team up to max 4 (200)', async () => {
      // 3rd member joins
      let res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${p3Token}`)
        .send({ invite_code: inviteCode });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.team.members.length, 3);

      // 4th member joins
      res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${p4Token}`)
        .send({ invite_code: inviteCode });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.team.members.length, 4);
    });

    await t.test('STRICT CHECK: Fifth participant is rejected because max 4 members allowed (400)', async () => {
      const res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${p5Token}`)
        .send({ invite_code: inviteCode });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Bad Request');
      assert.match(res.body.message, /maximum of 4 members/i);
    });

    // =========================================================================
    // 3. PROJECT SUBMISSION: DRAFTS & EDITS BEFORE DEADLINE
    // =========================================================================
    let submissionId = null;

    await t.test('Team member can submit a project as draft before deadline (201)', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${p1Token}`)
        .send({
          event_id: openDeadlineEventId,
          team_id: teamId,
          title: 'Nomad Local Stack',
          tagline: 'Self-hosted developer workspace',
          description: 'A robust offline-first toolkit',
          repo_url: 'https://github.com/nomads/local-stack',
          demo_url: 'http://localhost:5173/nomad',
          tech_stack: ['TypeScript', 'Node.js', 'React'],
          is_draft: true
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.submission.status, 'draft');
      assert.strictEqual(res.body.submission.title, 'Nomad Local Stack');

      submissionId = res.body.submission._id;
    });

    await t.test('Non-team member is forbidden from submitting for another team (403)', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          event_id: openDeadlineEventId,
          team_id: teamId,
          title: 'Infiltrator Project',
          description: 'Unauthorized submission attempt'
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'Forbidden');
    });

    await t.test('Team member can edit project while deadline is open (200)', async () => {
      const res = await request(app)
        .put(`/api/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${p2Token}`) // team member Bob
        .send({
          title: 'Nomad Autonomous Edge Stack (Updated)',
          tagline: 'Refined and improved offline agent toolkit',
          is_draft: false // finalize submission!
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, 'Submission updated successfully');
      assert.strictEqual(res.body.submission.title, 'Nomad Autonomous Edge Stack (Updated)');
      assert.strictEqual(res.body.submission.status, 'submitted');
    });

    // =========================================================================
    // 4. CRITICAL REQUIREMENT: BACKEND REJECTS EDITS AFTER DEADLINE (403)
    // =========================================================================
    await t.test('CRITICAL CHECK: Backend rejects edits after the deadline (403 Forbidden)', async () => {
      // First, create a project associated with an event whose deadline has passed
      // Create team for past event
      const pastTeam = {
        _id: 'team_past_1',
        event_id: pastDeadlineEventId,
        name: 'Past Horizon',
        leader_id: participant1.id,
        members: [participant1.id],
        save: async function() { return this; }
      };
      mockDb.teams.push(pastTeam);

      // Create a submission that was previously recorded for the past event
      const expiredSubmission = {
        _id: 'sub_expired_1',
        event_id: pastDeadlineEventId,
        team_id: pastTeam._id,
        title: 'Original Timely Entry',
        description: 'Submitted before the clock ran out',
        status: 'submitted',
        save: async function() { return this; }
      };
      mockDb.submissions.push(expiredSubmission);

      // Participant attempts to EDIT the submission after the deadline
      const res = await request(app)
        .put(`/api/submissions/${expiredSubmission._id}`)
        .set('Authorization', `Bearer ${p1Token}`)
        .send({
          title: 'Late Tampered Project Title',
          description: 'Attempting to sneak in changes after deadline expired'
        });

      assert.strictEqual(res.status, 403, 'Backend MUST return 403 Forbidden on edits past deadline');
      assert.strictEqual(res.body.error, 'Forbidden');
      assert.match(res.body.message, /deadline has passed/i);
    });

    await t.test('CRITICAL CHECK: Backend also rejects NEW submissions after deadline (403 Forbidden)', async () => {
      const pastTeam = mockDb.teams.find(t => t.event_id === pastDeadlineEventId);

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${p1Token}`)
        .send({
          event_id: pastDeadlineEventId,
          team_id: pastTeam._id,
          title: 'Too Late Project',
          description: 'Attempting to create entry after deadline'
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'Forbidden');
      assert.match(res.body.message, /deadline has passed/i);
    });

    // =========================================================================
    // 5. PUBLIC GALLERY: SEARCH AND FILTER BY TRACK
    // =========================================================================
    await t.test('Public gallery returns submitted projects and excludes drafts', async () => {
      // Add a draft project to mockDb
      mockDb.submissions.push({
        _id: 'sub_draft_only',
        title: 'Secret Unfinished Project',
        tagline: 'Draft in progress',
        description: 'Not ready yet',
        status: 'draft',
        event_id: openDeadlineEventId,
        team_id: teamId
      });

      const res = await request(app).get('/api/gallery');

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.projects));
      // Verify no drafts are in public gallery
      const hasDrafts = res.body.projects.some(p => p.status === 'draft');
      assert.strictEqual(hasDrafts, false, 'Draft projects must not appear in public gallery');
    });

    await t.test('Public gallery filters by search query', async () => {
      const res = await request(app)
        .get('/api/gallery')
        .query({ search: 'Nomad' });

      assert.strictEqual(res.status, 200);
      const allContainNomad = res.body.projects.every(p => 
        p.title.includes('Nomad') || p.tagline.includes('Nomad') || p.description.includes('Nomad')
      );
      assert.strictEqual(allContainNomad, true);
    });

  } finally {
    // Restore original functions
    Event.create = originalEvent.create;
    Event.find = originalEvent.find;
    Event.findById = originalEvent.findById;
    Event.findOne = originalEvent.findOne;

    Track.insertMany = originalTrack.insertMany;
    Track.find = originalTrack.find;
    Track.findOne = originalTrack.findOne;

    Prize.insertMany = originalPrize.insertMany;
    Prize.find = originalPrize.find;

    Team.create = originalTeam.create;
    Team.find = originalTeam.find;
    Team.findById = originalTeam.findById;
    Team.findOne = originalTeam.findOne;

    Submission.create = originalSubmission.create;
    Submission.findById = originalSubmission.findById;
    Submission.find = originalSubmission.find;
  }
});
