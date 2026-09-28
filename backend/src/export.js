const { User, Event, Track, Team, Submission, JudgeAssignment, EvaluationScore } = require('./models');
const { normalizeScores } = require('./normalization');

/**
 * Escapes and serializes an array of values into a single RFC 4180 CSV row string.
 * Quotes fields that contain commas, quotes, or newlines.
 */
function toCsvRow(values) {
  return values.map(val => {
    if (val === null || val === undefined) return '';
    let str = typeof val === 'object' && val instanceof Date ? val.toISOString() : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(',');
}

/**
 * Generates full CSV string with CRLF row endings.
 */
function generateCsv(headers, rows) {
  const headerLine = toCsvRow(headers);
  const dataLines = rows.map(r => toCsvRow(r));
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Resolve event filter (specific event or latest active event).
 */
async function resolveEventFilter(eventId) {
  if (eventId) return { event_id: eventId };
  const activeEvent = await Event.findOne().sort({ created_at: -1 }).lean();
  if (activeEvent) return { event_id: activeEvent._id };
  return {};
}

/**
 * Calculates judge progress dashboard metrics:
 * - per judge: assigned, scored, pending, drafts, completion percentage, status
 * - overall summary: total judges, total assignments, total scored, total pending, completion rate
 */
async function getJudgeProgress(eventId = null) {
  const eventFilter = await resolveEventFilter(eventId);

  // 1. Fetch all judges
  const judges = await User.find({ role: 'JUDGE' }).sort({ full_name: 1, username: 1 }).lean();

  // 2. Fetch all assignments for the event
  const assignments = await JudgeAssignment.find(eventFilter)
    .populate({
      path: 'submission_id',
      select: 'title team_id track_id status',
      populate: { path: 'team_id', select: 'name' }
    })
    .lean();

  // 3. Fetch all evaluation scores for the event
  const scores = await EvaluationScore.find(eventFilter).lean();

  // Index assignments by judge ID
  const assignmentsByJudge = new Map();
  for (const a of assignments) {
    const jId = String(a.judge_id?._id || a.judge_id);
    if (!assignmentsByJudge.has(jId)) assignmentsByJudge.set(jId, []);
    assignmentsByJudge.get(jId).push(a);
  }

  // Index scores by judge_id + submission_id
  const scoresByJudgeSub = new Map();
  for (const s of scores) {
    const sJudgeId = String(s.judge_id?._id || s.judge_id);
    const sSubId = String(s.submission_id?._id || s.submission_id);
    const key = `${sJudgeId}_${sSubId}`;
    scoresByJudgeSub.set(key, s);
  }

  let totalAssignments = 0;
  let totalScored = 0;
  let totalPending = 0;
  let totalDrafts = 0;

  const judgeProgressList = judges.map(judge => {
    const jId = String(judge._id);
    const judgeAssignments = assignmentsByJudge.get(jId) || [];
    const assignedCount = judgeAssignments.length;

    let scoredCount = 0;
    let draftCount = 0;
    let totalScoreSum = 0;

    for (const a of judgeAssignments) {
      const subId = String(a.submission_id?._id || a.submission_id);
      const scoreKey = `${jId}_${subId}`;
      const evalScore = scoresByJudgeSub.get(scoreKey);

      if (evalScore && evalScore.status === 'submitted') {
        scoredCount++;
        totalScoreSum += (evalScore.weighted_total || 0);
      } else if (evalScore && evalScore.status === 'draft') {
        draftCount++;
      }
    }

    const pendingCount = Math.max(0, assignedCount - scoredCount);
    const completionPercent = assignedCount > 0 ? Math.round((scoredCount / assignedCount) * 100) : 0;
    const avgScore = scoredCount > 0 ? Number((totalScoreSum / scoredCount).toFixed(2)) : null;

    let status = 'unassigned';
    if (assignedCount > 0) {
      if (pendingCount === 0) {
        status = 'completed';
      } else if (scoredCount > 0 || draftCount > 0) {
        status = 'in_progress';
      } else {
        status = 'pending';
      }
    }

    totalAssignments += assignedCount;
    totalScored += scoredCount;
    totalPending += pendingCount;
    totalDrafts += draftCount;

    return {
      judge_id: judge._id,
      username: judge.username,
      full_name: judge.full_name,
      email: judge.email,
      assigned: assignedCount,
      scored: scoredCount,
      pending: pendingCount,
      drafts: draftCount,
      progress_percent: completionPercent,
      average_score: avgScore,
      status,
      assigned_projects: judgeAssignments.map(a => {
        const sub = a.submission_id;
        const subId = String(sub?._id || a.submission_id);
        const evalScore = scoresByJudgeSub.get(`${jId}_${subId}`);
        return {
          submission_id: subId,
          title: sub?.title || 'Unknown Project',
          team_name: sub?.team_id?.name || '—',
          status: evalScore?.status === 'submitted' ? 'scored' : evalScore?.status === 'draft' ? 'draft' : 'pending',
          score: evalScore?.status === 'submitted' ? evalScore.weighted_total : null
        };
      })
    };
  });

  const overallCompletionRate = totalAssignments > 0 
    ? Math.round((totalScored / totalAssignments) * 100) 
    : 0;

  return {
    summary: {
      total_judges: judges.length,
      total_assignments: totalAssignments,
      total_scored: totalScored,
      total_pending: totalPending,
      total_drafts: totalDrafts,
      overall_completion_rate: overallCompletionRate
    },
    judges: judgeProgressList
  };
}

/**
 * 1. Export Participants CSV
 */
async function exportParticipants(eventId = null) {
  const participants = await User.find({ role: 'PARTICIPANT' }).sort({ created_at: -1 }).lean();
  
  // Find team memberships
  const teams = await Team.find().lean();
  const userTeamMap = new Map();
  for (const t of teams) {
    if (t.leader_id) userTeamMap.set(String(t.leader_id), { name: t.name, id: t._id });
    if (Array.isArray(t.members)) {
      for (const mId of t.members) {
        userTeamMap.set(String(mId), { name: t.name, id: t._id });
      }
    }
  }

  const headers = [
    'Participant ID',
    'Username',
    'Full Name',
    'Email',
    'Role',
    'Team Name',
    'Team ID',
    'Registered At'
  ];

  const rows = participants.map(p => {
    const team = userTeamMap.get(String(p._id));
    return [
      p._id,
      p.username,
      p.full_name,
      p.email,
      p.role,
      team ? team.name : '',
      team ? team.id : '',
      p.created_at ? new Date(p.created_at).toISOString() : ''
    ];
  });

  return generateCsv(headers, rows);
}

/**
 * 2. Export Teams CSV
 */
async function exportTeams(eventId = null) {
  const eventFilter = await resolveEventFilter(eventId);
  const teams = await Team.find(eventFilter)
    .populate('leader_id', 'username full_name email')
    .populate('members', 'username full_name email')
    .sort({ created_at: -1 })
    .lean();

  const headers = [
    'Team ID',
    'Team Name',
    'Slug',
    'Leader Username',
    'Leader Email',
    'Member Count',
    'Members',
    'Invite Code',
    'Created At'
  ];

  const rows = teams.map(t => [
    t._id,
    t.name,
    t.slug,
    t.leader_id?.username || '',
    t.leader_id?.email || '',
    t.members?.length || 0,
    (t.members || []).map(m => m.username || m.full_name).join('; '),
    t.invite_code,
    t.created_at ? new Date(t.created_at).toISOString() : ''
  ]);

  return generateCsv(headers, rows);
}

/**
 * 3. Export Submissions CSV
 */
async function exportSubmissions(eventId = null) {
  const eventFilter = await resolveEventFilter(eventId);
  const submissions = await Submission.find(eventFilter)
    .populate('team_id', 'name')
    .populate('track_id', 'name')
    .sort({ created_at: -1 })
    .lean();

  const headers = [
    'Submission ID',
    'Title',
    'Tagline',
    'Team Name',
    'Track',
    'Status',
    'Repo URL',
    'Demo URL',
    'Tech Stack',
    'Submitted At'
  ];

  const rows = submissions.map(s => [
    s._id,
    s.title,
    s.tagline || '',
    s.team_id?.name || '',
    s.track_id?.name || '',
    s.status,
    s.repo_url || '',
    s.demo_url || '',
    (s.tech_stack || []).join('; '),
    s.submitted_at ? new Date(s.submitted_at).toISOString() : ''
  ]);

  return generateCsv(headers, rows);
}

/**
 * 4. Export Assignments CSV
 */
async function exportAssignments(eventId = null) {
  const eventFilter = await resolveEventFilter(eventId);
  const assignments = await JudgeAssignment.find(eventFilter)
    .populate('judge_id', 'username full_name email')
    .populate({
      path: 'submission_id',
      select: 'title team_id',
      populate: { path: 'team_id', select: 'name' }
    })
    .sort({ created_at: -1 })
    .lean();

  const scores = await EvaluationScore.find(eventFilter).lean();
  const scoreStatusMap = new Map();
  for (const s of scores) {
    scoreStatusMap.set(`${String(s.judge_id)}_${String(s.submission_id)}`, s.status);
  }

  const headers = [
    'Assignment ID',
    'Judge ID',
    'Judge Name',
    'Judge Email',
    'Submission ID',
    'Project Title',
    'Team Name',
    'Assignment Status',
    'Evaluation Status',
    'Assigned At'
  ];

  const rows = assignments.map(a => {
    const jId = String(a.judge_id?._id || a.judge_id);
    const subId = String(a.submission_id?._id || a.submission_id);
    const evalStatus = scoreStatusMap.get(`${jId}_${subId}`) || 'unscored';

    return [
      a._id,
      jId,
      a.judge_id?.full_name || a.judge_id?.username || '',
      a.judge_id?.email || '',
      subId,
      a.submission_id?.title || '',
      a.submission_id?.team_id?.name || '',
      a.status,
      evalStatus,
      a.created_at ? new Date(a.created_at).toISOString() : ''
    ];
  });

  return generateCsv(headers, rows);
}

/**
 * 5. Export Raw Scores CSV
 */
async function exportRawScores(eventId = null) {
  const eventFilter = await resolveEventFilter(eventId);
  const scores = await EvaluationScore.find(eventFilter)
    .populate('judge_id', 'username full_name email')
    .populate({
      path: 'submission_id',
      select: 'title team_id track_id',
      populate: [
        { path: 'team_id', select: 'name' },
        { path: 'track_id', select: 'name' }
      ]
    })
    .sort({ updated_at: -1 })
    .lean();

  const headers = [
    'Score ID',
    'Submission ID',
    'Project Title',
    'Team Name',
    'Track',
    'Judge ID',
    'Judge Name',
    'Judge Email',
    'Weighted Total',
    'Status',
    'Comment',
    'Criteria Breakdown',
    'Submitted At'
  ];

  const rows = scores.map(s => {
    const breakdown = (s.criteria_scores || [])
      .map(c => `${c.name}: ${c.score}/${c.weight || 1.0}`)
      .join('; ');

    return [
      s._id,
      s.submission_id?._id || s.submission_id,
      s.submission_id?.title || '',
      s.submission_id?.team_id?.name || '',
      s.submission_id?.track_id?.name || '',
      s.judge_id?._id || s.judge_id,
      s.judge_id?.full_name || s.judge_id?.username || '',
      s.judge_id?.email || '',
      s.weighted_total,
      s.status,
      s.comment || '',
      breakdown,
      s.submitted_at ? new Date(s.submitted_at).toISOString() : s.updated_at ? new Date(s.updated_at).toISOString() : ''
    ];
  });

  return generateCsv(headers, rows);
}

/**
 * 6. Export Normalized Scores CSV
 */
async function exportNormalizedScores(eventId = null) {
  const eventFilter = await resolveEventFilter(eventId);
  const submissions = await Submission.find(eventFilter)
    .populate('team_id', 'name slug')
    .populate('track_id', 'name prize_pool')
    .lean();

  const subIds = submissions.map(s => s._id);
  const scores = await EvaluationScore.find({ submission_id: { $in: subIds } })
    .populate('judge_id', 'username full_name email role')
    .lean();

  const normResult = normalizeScores(submissions, scores);

  const headers = [
    'Submission ID',
    'Project Title',
    'Track',
    'Team Name',
    'Judge ID',
    'Judge Name',
    'Judge Email',
    'Raw Score',
    'Judge Mean',
    'Judge StdDev',
    'Z-Score',
    'Rescaled Score (0-100)'
  ];

  const rows = [];
  for (const r of normResult.rankings) {
    if (r.evaluations && r.evaluations.length > 0) {
      for (const e of r.evaluations) {
        rows.push([
          r.submission_id,
          r.title,
          r.track,
          r.team_name,
          e.judge_id || '',
          e.judge_name || '',
          e.judge_email || '',
          e.raw_score,
          e.judge_mean,
          e.judge_std_dev,
          e.z_score,
          r.normalized_score
        ]);
      }
    } else {
      // Unscored submission
      rows.push([
        r.submission_id,
        r.title,
        r.track,
        r.team_name,
        '',
        'No evaluations',
        '',
        '0.0',
        '0.0',
        '0.0',
        '0.0',
        '0.0'
      ]);
    }
  }

  return generateCsv(headers, rows);
}

/**
 * 7. Export Final Results / Leaderboard CSV
 */
async function exportFinalResults(eventId = null) {
  const eventFilter = await resolveEventFilter(eventId);
  const submissions = await Submission.find(eventFilter)
    .populate('team_id', 'name slug')
    .populate('track_id', 'name prize_pool')
    .lean();

  const subIds = submissions.map(s => s._id);
  const scores = await EvaluationScore.find({ submission_id: { $in: subIds } })
    .populate('judge_id', 'username full_name email role')
    .lean();

  const normResult = normalizeScores(submissions, scores);

  const headers = [
    'Normalized Rank',
    'Raw Rank',
    'Rank Shift',
    'Project Title',
    'Team Name',
    'Track',
    'Normalized Score (0-100)',
    'Raw Average Score',
    'Judge Count',
    'Submission Status',
    'Repo URL',
    'Demo URL'
  ];

  const rows = normResult.rankings.map(r => [
    r.normalized_rank !== null ? r.normalized_rank : 'Unranked',
    r.raw_rank !== null ? r.raw_rank : 'Unranked',
    r.rank_delta !== null ? (r.rank_delta > 0 ? `+${r.rank_delta}` : `${r.rank_delta}`) : '0',
    r.title,
    r.team_name,
    r.track,
    r.normalized_score,
    r.raw_score,
    r.evaluations_count,
    r.status,
    r.repo_url || '',
    r.demo_url || ''
  ]);

  return generateCsv(headers, rows);
}

module.exports = {
  toCsvRow,
  generateCsv,
  getJudgeProgress,
  exportParticipants,
  exportTeams,
  exportSubmissions,
  exportAssignments,
  exportRawScores,
  exportNormalizedScores,
  exportFinalResults
};
