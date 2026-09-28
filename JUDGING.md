# DOGFOOD — Judging Engine Specification

> **Assignment strategies, multi-criteria scoring mechanics, cross-judge z-score normalization, and rationale.**

---

## 1. Assignment Strategies

The platform supports 3 assignment modes via dedicated organizer endpoints:

### 1. Manual Assignment (`POST /api/judges/assignments`)
* **Behavior**: Organizer specifies `{ submission_id, judge_id }`.
* **Validation**: Validates that the judge exists, project is not in draft, and verifies conflict of interest.

### 2. Batch Assignment (`POST /api/judges/assignments/batch`)
* **Behavior**: Accepts an array of `{ submission_id, judge_id }` pairs.
* **Resilience**: Skips duplicate assignments and rejects conflict-of-interest pairs with detailed error reporting.

### 3. Automatic Load-Balanced Assignment (`POST /api/judges/assignments/automatic`)
* **Behavior**: Accepts `{ event_id, n_judges }` (default: 3 judges per project).
* **Strategy**:
  1. Computes current workload (number of assigned projects) for all available judges.
  2. For each submission, filters out judges who are on the project's team or already assigned.
  3. Sorts candidate judges by current load in ascending order.
  4. Assigns the least-burdened $N$ judges to each project, ensuring balanced distribution across the judging pool.

### Conflict-of-Interest Guarantee
* A judge can **never** evaluate a project belonging to a team where they are a leader or member. Both manual and automated assignment engines actively query `Team.find({ members: judgeId })` and reject assignments with `400 Bad Request`.

---

## 2. Scoring Method

### Multi-Criteria Rubric Evaluation (`POST /api/judges/submissions/:id/evaluate`)
1. Each event defines weighted rubric criteria (e.g. Innovation: weight 0.4, Execution: weight 0.6).
2. When a judge grades a submission, the server computes the weighted total:
   $$\text{Weighted Total} = \frac{\sum_{i=1}^{K} (\text{score}_i \times \text{weight}_i)}{\sum_{i=1}^{K} \text{weight}_i}$$
3. **Draft vs Submit Locking**:
   * Evaluators can save scores as `draft` and update them iteratively.
   * Once finalized with `status: 'submitted'`, the score is **permanently locked**.
   * Any subsequent edit by the judge returns `403 Forbidden`. Only an organizer can reopen the score (and only while the event remains open).

---

## 3. Cross-Judge Score Normalization Method

### The Problem: Evaluator Variance
In any hackathon, some judges grade harshly (averaging 4.0–6.0) while others grade generously (averaging 8.0–9.5). Under a raw average, a mediocre project assigned to generous judges will unfairly beat an exceptional project assigned to harsh judges.

### The Algorithm: Z-Score + 0–100 Rescaling

#### Step 1: Per-Judge Mean ($\mu_j$) and Standard Deviation ($\sigma_j$)
For each judge $j$ with scores $X_j = \{x_1, x_2, \dots, x_N\}$:
$$\mu_j = \frac{1}{N} \sum_{i=1}^{N} x_i, \quad \sigma_j = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (x_i - \mu_j)^2}$$

#### Step 2: Z-Score Calculation
Each score is converted into units of standard deviation from that judge's mean:
$$z = \frac{x - \mu_j}{\sigma_j}$$

#### Step 3: Edge-Case Handling (No Division by Zero)
* **Single Evaluation ($N = 1$)**: $\sigma_j = 0 \implies z = 0.0$ (neutral).
* **Identical Scores ($\sigma_j = 0$)**: All scores identical $\implies z = 0.0$.
* **Unscored Projects**: Ranked at the bottom with `raw_score: null, normalized_score: null` without breaking ranking arrays.

#### Step 4: Rescaling to 0–100 Scale
To make z-scores intuitive for human interpretation, z-scores are mapped across the global $[z_{\min}, z_{\max}]$ spectrum:
$$\text{Normalized Score} = \left( \frac{z - z_{\min}}{z_{\max} - z_{\min}} \right) \times 100$$
*(If all z-scores are identical, defaults to 50.0)*.

#### Step 5: Side-by-Side Leaderboard & Rank Delta
The leaderboard calculates both `raw_rank` and `normalized_rank`:
$$\text{Rank Delta} = \text{raw\_rank} - \text{normalized\_rank}$$
A positive delta indicates a project that was suppressed by harsh judging and restored to its rightful rank through normalization.

---

## 4. Why We Chose These Methods

1. **Why Load-Balanced Greedy Assignment?**
   * Minimizes judge fatigue by preventing uneven spikes in workload.
   * Completely eliminates conflict of interest programmatically at assignment time.

2. **Why Server-Side Weighted Totals?**
   * Eliminates client tampering. Judges cannot modify weight factors in browser payloads.

3. **Why Draft & Lock Mechanics?**
   * Judges can draft notes and deliberate without prematurely publishing unfinished marks. Once finalized, locking prevents post-competition manipulation or collusion.

4. **Why Z-Score Over Simple Min-Max or Percentile Ranking?**
   * Simple min-max rescaling only stretches the range and remains vulnerable to extreme outlier scores.
   * Percentile ranking discards the magnitude of difference between projects.
   * **Z-score preserves relative distribution and distance**, measuring how exceptionally a project performed relative to a specific judge's typical scoring tendencies.
