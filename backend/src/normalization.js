/**
 * Cross-Judge Score Normalization Service
 * 
 * Addresses judge variance (harsh vs generous scoring) by:
 * 1. Computing each judge's mean (μ) and standard deviation (σ).
 * 2. Calculating z-scores per evaluation: z = (score - μ) / σ.
 * 3. Handling edge cases:
 *    - Judge with 1 score (N=1): σ is 0 -> z = 0.
 *    - Judge with standard deviation 0 (identical scores): σ = 0 -> z = 0.
 *    - Missing scores: unscored projects handled without NaN.
 * 4. Rescaling z-scores to a 0–100 scale: (z - z_min) / (z_max - z_min) * 100.
 * 5. Computing side-by-side raw and normalized rankings with rank delta.
 */

function round(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Normalizes scores across judges and computes side-by-side rankings.
 * 
 * @param {Array} submissions - List of submissions [{ _id, title, team_name, track_name, ... }]
 * @param {Array} rawScores - List of evaluation scores [{ submission_id, judge_id, weighted_total, ... }]
 * @param {Object} options - { minMaxScale: boolean }
 * @returns {Object} { rankings, judge_stats, summary }
 */
function normalizeScores(submissions = [], rawScores = [], options = {}) {
  // 1. Group valid scores by judge
  const judgeScoresMap = new Map();
  const validEvaluations = [];

  for (const s of rawScores) {
    const rawVal = s.weighted_total !== undefined ? Number(s.weighted_total) : Number(s.score);
    if (isNaN(rawVal)) continue;

    const judgeId = String(s.judge_id?._id || s.judge_id);
    const subId = String(s.submission_id?._id || s.submission_id);

    const evalEntry = {
      _id: s._id,
      judge_id: judgeId,
      judge_name: s.judge_id?.full_name || s.judge_id?.username || `Judge ${judgeId.slice(-4)}`,
      submission_id: subId,
      raw_score: rawVal,
      status: s.status || 'submitted'
    };

    validEvaluations.push(evalEntry);

    if (!judgeScoresMap.has(judgeId)) {
      judgeScoresMap.set(judgeId, {
        judge_id: judgeId,
        judge_name: evalEntry.judge_name,
        scores: []
      });
    }
    judgeScoresMap.get(judgeId).scores.push(rawVal);
  }

  // 2. Compute Judge Statistics (Mean, StdDev) and Handle Edge Cases
  const judgeStats = {};
  for (const [judgeId, data] of judgeScoresMap.entries()) {
    const vals = data.scores;
    const n = vals.length;

    let mean = 0;
    let stdDev = 0;
    let edgeCase = null;

    if (n === 0) {
      edgeCase = 'no_scores';
    } else if (n === 1) {
      // EDGE CASE 1: Judge with only 1 score
      mean = vals[0];
      stdDev = 0;
      edgeCase = 'single_score';
    } else {
      mean = vals.reduce((sum, v) => sum + v, 0) / n;
      const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n; // population std
      stdDev = Math.sqrt(variance);

      // EDGE CASE 2: Standard deviation is 0 (all scores identical)
      if (stdDev < 1e-9) {
        stdDev = 0;
        edgeCase = 'zero_variance';
      }
    }

    judgeStats[judgeId] = {
      judge_id: judgeId,
      judge_name: data.judge_name,
      count: n,
      mean: round(mean),
      std_dev: round(stdDev),
      edge_case: edgeCase
    };
  }

  // 3. Compute Z-Scores for each evaluation
  const zScoresList = [];
  for (const ev of validEvaluations) {
    const stats = judgeStats[ev.judge_id];
    let z = 0.0;

    if (stats && stats.std_dev > 0) {
      z = (ev.raw_score - stats.mean) / stats.std_dev;
    } else {
      // Handle edge cases: single score or zero variance defaults to neutral z=0
      z = 0.0;
    }

    ev.z_score = z;
    zScoresList.push(z);
  }

  // 4. Rescale Z-Scores to 0–100 Scale
  let zMin = 0;
  let zMax = 0;
  if (zScoresList.length > 0) {
    zMin = Math.min(...zScoresList);
    zMax = Math.max(...zScoresList);
  }

  for (const ev of validEvaluations) {
    if (zMax > zMin) {
      ev.normalized_score = round(((ev.z_score - zMin) / (zMax - zMin)) * 100);
    } else {
      // If all z-scores are identical (e.g. all 0), default to 50
      ev.normalized_score = 50.0;
    }
  }

  // 5. Aggregate Scores by Submission
  const subEvaluationsMap = new Map();
  for (const ev of validEvaluations) {
    if (!subEvaluationsMap.has(ev.submission_id)) {
      subEvaluationsMap.set(ev.submission_id, []);
    }
    subEvaluationsMap.get(ev.submission_id).push(ev);
  }

  // 6. Build Project Rankings List (Handling Missing Scores)
  const rankings = [];

  for (const sub of submissions) {
    const subId = String(sub._id || sub.id);
    const evals = subEvaluationsMap.get(subId) || [];

    const title = sub.title || 'Untitled Project';
    const teamName = sub.team_id?.name || sub.team_name || (typeof sub.team === 'string' ? sub.team : 'Team');
    const trackName = sub.track_id?.name || sub.track_name || (typeof sub.track === 'string' ? sub.track : 'General Track');

    if (evals.length === 0) {
      // EDGE CASE 3: Missing scores (unscored project)
      rankings.push({
        submission_id: subId,
        title,
        team_name: teamName,
        track_name: trackName,
        raw_score: null,
        normalized_score: null,
        evaluations_count: 0,
        has_scores: false,
        evaluations: []
      });
    } else {
      const rawAvg = evals.reduce((sum, e) => sum + e.raw_score, 0) / evals.length;
      const normAvg = evals.reduce((sum, e) => sum + e.normalized_score, 0) / evals.length;

      rankings.push({
        submission_id: subId,
        title,
        team_name: teamName,
        track_name: trackName,
        raw_score: round(rawAvg),
        normalized_score: round(normAvg),
        evaluations_count: evals.length,
        has_scores: true,
        evaluations: evals.map(e => ({
          judge_id: e.judge_id,
          judge_name: e.judge_name,
          raw_score: e.raw_score,
          z_score: round(e.z_score),
          normalized_score: e.normalized_score
        }))
      });
    }
  }

  // 7. Assign Raw Ranks (Highest raw score wins; unscored at bottom)
  const scoredItems = rankings.filter(r => r.has_scores);
  const unscoredItems = rankings.filter(r => !r.has_scores);

  // Sort by raw_score descending
  scoredItems.sort((a, b) => b.raw_score - a.raw_score);
  scoredItems.forEach((item, index) => {
    item.raw_rank = index + 1;
  });

  // Sort by normalized_score descending
  scoredItems.sort((a, b) => {
    if (b.normalized_score !== a.normalized_score) {
      return b.normalized_score - a.normalized_score;
    }
    return b.raw_score - a.raw_score; // tie breaker: raw score
  });

  scoredItems.forEach((item, index) => {
    item.normalized_rank = index + 1;
    // Rank delta: positive means project improved after normalization
    item.rank_delta = item.raw_rank - item.normalized_rank;
  });

  unscoredItems.forEach((item) => {
    item.raw_rank = null;
    item.normalized_rank = null;
    item.rank_delta = 0;
  });

  // Final rankings list sorted by normalized rank (then unscored)
  const finalRankings = [...scoredItems, ...unscoredItems];

  return {
    success: true,
    rankings: finalRankings,
    judge_stats: Object.values(judgeStats),
    summary: {
      total_submissions: submissions.length,
      evaluated_submissions: scoredItems.length,
      unscored_submissions: unscoredItems.length,
      total_evaluations: validEvaluations.length,
      z_min: round(zMin),
      z_max: round(zMax)
    }
  };
}

module.exports = {
  normalizeScores,
  round
};
