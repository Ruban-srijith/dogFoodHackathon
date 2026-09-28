const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-t4-normalization';

const app = require('../src/server');
const { generateToken } = require('../src/auth');
const { normalizeScores, round } = require('../src/normalization');
const { Submission, EvaluationScore, Event } = require('../src/models');

test('T4 Feature Suite: Cross-Judge Score Normalization (Z-Score & 0-100 Rescaling)', async (t) => {
  // Test Users
  const organizerUser = { id: 'org_1', email: 'org@hack.local', username: 'org', role: 'ORGANIZER', full_name: 'Lead Organizer' };
  const judgeHarsh = { id: 'judge_harsh', email: 'harsh@hack.local', username: 'dr_chen', role: 'JUDGE', full_name: 'Dr. Sarah Chen (Harsh)' };
  const judgeGenerous = { id: 'judge_generous', email: 'generous@hack.local', username: 'elena', role: 'JUDGE', full_name: 'Elena Rostova (Generous)' };
  const judgeSingle = { id: 'judge_single', email: 'single@hack.local', username: 'marcus', role: 'JUDGE', full_name: 'Marcus Vance (1 Score)' };
  const judgeFlat = { id: 'judge_flat', email: 'flat@hack.local', username: 'flat_judge', role: 'JUDGE', full_name: 'Alex Flat (Zero StdDev)' };

  const organizerToken = generateToken(organizerUser);

  // Fixture Submissions (from sample_teams_and_projects.json)
  const sub1 = { _id: 'sub_1', title: 'Antigravity Autonomous Core', team_name: 'Team Antigravity', track_name: 'Autonomous AI Agents' };
  const sub2 = { _id: 'sub_2', title: 'Agentic Workflow Orchestrator', team_name: 'Team Antigravity', track_name: 'Autonomous AI Agents' };
  const sub3 = { _id: 'sub_3', title: 'ByteForge High-Throughput Log Engine', team_name: 'Team ByteForge', track_name: 'Developer Tooling & Infrastructure' };
  const sub4 = { _id: 'sub_4', title: 'HotReload Micro-Bundler', team_name: 'Team ByteForge', track_name: 'Developer Tooling & Infrastructure' };
  const sub5_unscored = { _id: 'sub_5', title: 'NeuralGraph Semantic Visualizer', team_name: 'Team NeuralFlow', track_name: 'Autonomous AI Agents' };

  // =========================================================================
  // 1. UNIT TEST: MATHEMATICAL NORMALIZATION & RANK INVERSION CORRECTION
  // =========================================================================
  await t.test('Corrects judge bias where harsh judge top score is suppressed by generous judge bottom score', () => {
    // Dr. Sarah Chen is a harsh judge: scores sub_1 = 6.0, sub_2 = 4.0
    // Mean = 5.0, Variance = 1.0, StdDev = 1.0
    // sub_1: z = (6 - 5) / 1 = +1.0
    // sub_2: z = (4 - 5) / 1 = -1.0
    //
    // Elena Rostova is a generous judge: scores sub_3 = 9.0, sub_4 = 7.0
    // Mean = 8.0, Variance = 1.0, StdDev = 1.0
    // sub_3: z = (9 - 8) / 1 = +1.0
    // sub_4: z = (7 - 8) / 1 = -1.0
    //
    // RAW RANKING BEFORE NORMALIZATION:
    // 1st: sub_3 (9.0)
    // 2nd: sub_4 (7.0) <-- Elena's lowest project!
    // 3rd: sub_1 (6.0) <-- Sarah's best project!
    // 4th: sub_2 (4.0)
    // Notice sub_4 (generous worst) beat sub_1 (harsh best)!
    //
    // NORMALIZED RANKING AFTER Z-SCORE & 0-100 RESCALING:
    // z_min = -1.0, z_max = +1.0
    // sub_1: z = +1.0 -> rescaled = (1.0 - (-1)) / (1 - (-1)) * 100 = 100.0 (Rank 1 tied)
    // sub_3: z = +1.0 -> rescaled = 100.0 (Rank 1 tied)
    // sub_2: z = -1.0 -> rescaled = 0.0 (Rank 3 tied)
    // sub_4: z = -1.0 -> rescaled = 0.0 (Rank 3 tied)

    const submissions = [sub1, sub2, sub3, sub4];
    const scores = [
      { submission_id: 'sub_1', judge_id: judgeHarsh.id, weighted_total: 6.0, status: 'submitted' },
      { submission_id: 'sub_2', judge_id: judgeHarsh.id, weighted_total: 4.0, status: 'submitted' },
      { submission_id: 'sub_3', judge_id: judgeGenerous.id, weighted_total: 9.0, status: 'submitted' },
      { submission_id: 'sub_4', judge_id: judgeGenerous.id, weighted_total: 7.0, status: 'submitted' }
    ];

    const result = normalizeScores(submissions, scores);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.rankings.length, 4);

    const rSub1 = result.rankings.find(r => r.submission_id === 'sub_1');
    const rSub4 = result.rankings.find(r => r.submission_id === 'sub_4');

    // Verify Raw Inversion: sub_4 had a higher raw score (7.0) than sub_1 (6.0)
    assert.strictEqual(rSub4.raw_score, 7.0);
    assert.strictEqual(rSub1.raw_score, 6.0);
    assert.strictEqual(rSub4.raw_rank, 2);
    assert.strictEqual(rSub1.raw_rank, 3);

    // Verify Normalized Inversion Fixed: sub_1 (100.0) ranks above or tied with sub_4 (0.0)
    assert.strictEqual(rSub1.normalized_score, 100.0);
    assert.strictEqual(rSub4.normalized_score, 0.0);
    assert.ok(rSub1.normalized_rank < rSub4.normalized_rank, 'Harsh best project ranks higher than generous worst project');
    // sub_1 improved its rank
    assert.ok(rSub1.rank_delta > 0, 'sub_1 rank improved (positive delta)');
  });

  // =========================================================================
  // 2. EDGE CASE: JUDGE WITH 1 SCORE (N=1)
  // =========================================================================
  await t.test('Handles edge case: judge with only 1 score (defaults z to 0.0, no division by zero)', () => {
    const submissions = [sub1, sub2];
    const scores = [
      // judgeSingle only evaluated sub1
      { submission_id: 'sub_1', judge_id: judgeSingle.id, weighted_total: 8.5, status: 'submitted' }
    ];

    const result = normalizeScores(submissions, scores);
    assert.strictEqual(result.success, true);

    const stats = result.judge_stats.find(s => s.judge_id === judgeSingle.id);
    assert.strictEqual(stats.count, 1);
    assert.strictEqual(stats.mean, 8.5);
    assert.strictEqual(stats.std_dev, 0);
    assert.strictEqual(stats.edge_case, 'single_score');

    const rSub1 = result.rankings.find(r => r.submission_id === 'sub_1');
    assert.strictEqual(rSub1.raw_score, 8.5);
    // Single score with all z=0 rescales to 50.0
    assert.strictEqual(rSub1.normalized_score, 50.0);
    assert.strictEqual(rSub1.normalized_rank, 1);
  });

  // =========================================================================
  // 3. EDGE CASE: STANDARD DEVIATION IS 0 (ALL SCORES IDENTICAL)
  // =========================================================================
  await t.test('Handles edge case: judge with standard deviation 0 (all identical scores)', () => {
    const submissions = [sub1, sub2, sub3];
    const scores = [
      // judgeFlat gave 7.0 to all three projects
      { submission_id: 'sub_1', judge_id: judgeFlat.id, weighted_total: 7.0, status: 'submitted' },
      { submission_id: 'sub_2', judge_id: judgeFlat.id, weighted_total: 7.0, status: 'submitted' },
      { submission_id: 'sub_3', judge_id: judgeFlat.id, weighted_total: 7.0, status: 'submitted' }
    ];

    const result = normalizeScores(submissions, scores);
    assert.strictEqual(result.success, true);

    const stats = result.judge_stats.find(s => s.judge_id === judgeFlat.id);
    assert.strictEqual(stats.count, 3);
    assert.strictEqual(stats.mean, 7.0);
    assert.strictEqual(stats.std_dev, 0);
    assert.strictEqual(stats.edge_case, 'zero_variance');

    // All evaluations have z = 0.0
    result.rankings.forEach(r => {
      if (r.has_scores) {
        assert.strictEqual(r.normalized_score, 50.0);
        assert.strictEqual(r.raw_score, 7.0);
      }
    });
  });

  // =========================================================================
  // 4. EDGE CASE: MISSING SCORES (UNSCORED SUBMISSIONS)
  // =========================================================================
  await t.test('Handles edge case: missing scores (unscored submissions do not produce NaN or break rankings)', () => {
    const submissions = [sub1, sub5_unscored]; // sub5 has no scores at all
    const scores = [
      { submission_id: 'sub_1', judge_id: judgeHarsh.id, weighted_total: 8.0, status: 'submitted' }
    ];

    const result = normalizeScores(submissions, scores);
    assert.strictEqual(result.success, true);

    const rSub5 = result.rankings.find(r => r.submission_id === 'sub_5');
    assert.strictEqual(rSub5.has_scores, false);
    assert.strictEqual(rSub5.raw_score, null);
    assert.strictEqual(rSub5.normalized_score, null);
    assert.strictEqual(rSub5.raw_rank, null);
    assert.strictEqual(rSub5.normalized_rank, null);
    assert.strictEqual(rSub5.rank_delta, 0);

    assert.strictEqual(result.summary.unscored_submissions, 1);
    assert.strictEqual(result.summary.evaluated_submissions, 1);
  });

  // =========================================================================
  // 5. SIDE-BY-SIDE RANKING METRICS AND DELTAS
  // =========================================================================
  await t.test('Outputs side-by-side raw vs normalized rankings with rank_delta', () => {
    const submissions = [sub1, sub2, sub3, sub4];
    const scores = [
      { submission_id: 'sub_1', judge_id: judgeHarsh.id, weighted_total: 5.5, status: 'submitted' },
      { submission_id: 'sub_2', judge_id: judgeHarsh.id, weighted_total: 3.5, status: 'submitted' },
      { submission_id: 'sub_3', judge_id: judgeGenerous.id, weighted_total: 9.5, status: 'submitted' },
      { submission_id: 'sub_4', judge_id: judgeGenerous.id, weighted_total: 7.5, status: 'submitted' }
    ];

    const result = normalizeScores(submissions, scores);

    result.rankings.forEach(r => {
      assert.ok(typeof r.title === 'string');
      assert.ok(typeof r.team_name === 'string');
      assert.ok(typeof r.track_name === 'string');
      assert.ok(typeof r.raw_score === 'number');
      assert.ok(typeof r.raw_rank === 'number');
      assert.ok(typeof r.normalized_score === 'number');
      assert.ok(typeof r.normalized_rank === 'number');
      assert.strictEqual(r.rank_delta, r.raw_rank - r.normalized_rank);
      assert.ok(r.normalized_score >= 0 && r.normalized_score <= 100);
    });
  });

  // =========================================================================
  // 6. BACKEND API ENDPOINT: GET /api/leaderboard
  // =========================================================================
  await t.test('GET /api/leaderboard returns 200 with side-by-side rankings', async () => {
    // Stub models for API test
    const mockSubs = [
      {
        _id: 'sub_1',
        title: 'Antigravity Autonomous Core',
        team_id: { _id: 't_1', name: 'Team Antigravity', slug: 'team-antigravity' },
        track_id: { _id: 'tr_1', name: 'Autonomous AI Agents', prize_pool: '$10,000' }
      },
      {
        _id: 'sub_3',
        title: 'ByteForge High-Throughput Log Engine',
        team_id: { _id: 't_2', name: 'Team ByteForge', slug: 'team-byteforge' },
        track_id: { _id: 'tr_2', name: 'Developer Tooling & Infrastructure', prize_pool: '$7,500' }
      }
    ];

    const mockScores = [
      {
        _id: 'sc_1',
        submission_id: 'sub_1',
        judge_id: { _id: 'judge_harsh', username: 'dr_chen', full_name: 'Dr. Sarah Chen', role: 'JUDGE' },
        weighted_total: 6.0,
        status: 'submitted'
      },
      {
        _id: 'sc_2',
        submission_id: 'sub_3',
        judge_id: { _id: 'judge_generous', username: 'elena', full_name: 'Elena Rostova', role: 'JUDGE' },
        weighted_total: 9.0,
        status: 'submitted'
      }
    ];

    Submission.find = () => ({
      populate: () => ({
        populate: () => ({
          lean: async () => mockSubs
        })
      })
    });

    EvaluationScore.find = () => ({
      populate: () => ({
        lean: async () => mockScores
      })
    });

    Event.findOne = () => ({
      sort: () => ({ _id: 'ev_1' })
    });

    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.rankings));
    assert.strictEqual(res.body.rankings.length, 2);

    const first = res.body.rankings[0];
    assert.ok('raw_score' in first);
    assert.ok('raw_rank' in first);
    assert.ok('normalized_score' in first);
    assert.ok('normalized_rank' in first);
    assert.ok('rank_delta' in first);
    assert.ok('judge_stats' in res.body);
  });
});
