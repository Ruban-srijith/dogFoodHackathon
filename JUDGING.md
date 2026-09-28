# DOGFOOD — Judging Engine Specification

Specification of project assignment strategies, rubric scoring mechanics, cross-judge z-score normalization, and architectural rationale.

---

## 1. Assignment Strategy

The platform provides three assignment modes via organizer endpoints:

1. **Manual Assignment (`POST /api/judges/assignments`)**:
   * Assigns an individual `{ submission_id, judge_id }` pair.
   * Validates project existence, ensures project is submitted (not draft), and checks conflict of interest.

2. **Batch Assignment (`POST /api/judges/assignments/batch`)**:
   * Accepts an array of `{ submission_id, judge_id }` pairs.
   * Skips duplicates, flags invalid pairs, and rejects conflicts of interest.

3. **Automatic Load-Balanced Assignment (`POST /api/judges/assignments/automatic`)**:
   * Accepts `{ event_id, n_judges }` (default: 2–3 judges per project).
   * Calculates current workload (assigned count) across all active judges.
   * For each submission:
     1. Excludes judges who are members or leaders of the submission's team.
     2. Excludes judges already assigned to the project.
     3. Sorts remaining eligible judges by current load in ascending order.
     4. Assigns the least-burdened judges up to the target $N$.

### Conflict-of-Interest Guarantee
A judge cannot evaluate a submission created by a team they lead or belong to. Both manual and automatic endpoints check `Team.find({ members: judgeId })` and reject conflicting assignments with `400 Bad Request`.

---

## 2. Scoring Method

### Multi-Criteria Rubric Scoring (`POST /api/judges/submissions/:id/evaluate`)
1. Organizers configure rubric criteria with explicit weights (e.g., Innovation: 0.4, Execution: 0.6) and valid score bounds (`min_score` to `max_score`).
2. Judges grade criteria per project. The backend calculates the weighted aggregate:
   $$\text{Weighted Total} = \frac{\sum_{i=1}^{K} (\text{score}_i \times \text{weight}_i)}{\sum_{i=1}^{K} \text{weight}_i}$$
3. **Draft vs. Submitted Locking**:
   * Judges can save evaluations as `draft` and update them iteratively.
   * When finalized (`status: 'submitted'`), the score is permanently locked.
   * Any subsequent edit by the judge returns `403 Forbidden`.
   * Only an organizer can reopen a score (`POST /api/organizer/evaluations/:id/reopen`), and only while the event remains open.

---

## 3. Normalization Method

### Evaluator Variance Problem
Judges evaluate on subjective scales: harsh judges might score between 4.0–6.0, while generous judges score between 8.0–9.5. Raw score averages unfairly penalize projects assigned to harsh judges.

### Z-Score Normalization Algorithm (`backend/src/normalization.js`)

1. **Judge Mean ($\mu_j$) and Standard Deviation ($\sigma_j$)**:
   $$\mu_j = \frac{1}{N} \sum_{i=1}^{N} x_i, \quad \sigma_j = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (x_i - \mu_j)^2}$$

2. **Z-Score Calculation**:
   $$z = \frac{x - \mu_j}{\sigma_j}$$

3. **Edge-Case Handling**:
   * **Single Score ($N=1$)**: $\sigma_j = 0 \implies z = 0.0$ (neutral).
   * **Zero Variance ($\sigma_j = 0$)**: All scores identical $\implies z = 0.0$.
   * **Unscored Submissions**: Placed at the bottom with null scores, preventing `NaN` or ranking errors.

4. **Rescaling to 0–100**:
   $$\text{Normalized Score} = \left( \frac{z - z_{\min}}{z_{\max} - z_{\min}} \right) \times 100$$
   *(Defaults to 50.0 if all z-scores are identical)*.

5. **Side-by-Side Leaderboard & Rank Delta**:
   $$\text{Rank Delta} = \text{raw\_rank} - \text{normalized\_rank}$$
   A positive delta highlights projects that were suppressed by harsh grading and elevated to their fair position by normalization.

---

## 4. Why I Chose Them

1. **Why Greedy Load-Balanced Assignment?**
   * Balances evaluation workload evenly across the judge pool to avoid judge fatigue.
   * Automatically isolates judges from their own teams to enforce fairness without manual auditing.

2. **Why Server-Side Weighted Totals?**
   * Eliminates client tampering by calculating all scores against database-persisted rubric definitions.

3. **Why Draft & Lock Mechanics?**
   * Gives judges time to deliberate and adjust initial impressions. Locking upon submission guarantees score finality and protects against post-event collusion.

4. **Why Z-Score Over Percentile or Min-Max?**
   * *Min-Max*: Highly vulnerable to single extreme outliers.
   * *Percentile*: Drops score magnitude, treating small differences identically to massive differences.
   * *Z-Score*: Measures statistical variance from each judge's scoring baseline, preserving relative performance gaps while neutralizing subjective grader bias.
