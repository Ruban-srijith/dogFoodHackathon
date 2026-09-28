# DOGFOOD — Judging Isolation & Scoring Specification

> **Operational rules, verification flow, rubric weighting mathematics, and security isolation guarantees for evaluators.**

---

## 1. The Core Law of Judging Isolation (Rule 16)

Judges **MUST ONLY** access and evaluate submissions explicitly assigned to them by an event organizer or administrator.

```text
                  Incoming Evaluation Request:
                 POST /api/v1/scores/submission/:id
                                 │
                                 ▼
                     Extract Authenticated User
                        (from signed JWT)
                                 │
                                 ▼
                    Verify User Has JUDGE Role
                                 │
                                 ▼
                   Query: judge_assignments WHERE
                 judge_id = auth_user.id AND
                 submission_id = req.params.id
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
             Match Found?                   No Assignment?
                │                                 │
                ▼                                 ▼
       Allow Evaluation Form            403 FORBIDDEN
       & Validate Rubric Points          "Access Denied: You are not assigned
                                          to evaluate this submission."
```

### Critical Security Guarantees
* **Identity Immutability:** The server determines the judge identity strictly from `req.user.userId`. Any `judge_id` passed in request payloads or query parameters is discarded.
* **Tamper Resistance:** Modifying a submission ID in the URL bar yields a `403 Forbidden` unless an assignment record exists in PostgreSQL.

---

## 2. Evaluation Rubric & Scoring Mechanics

Every hackathon defines a multi-dimensional rubric with customizable criteria.

### Criterion Definition
Each criterion specifies:
1. `name`: Pillar title (e.g., "Innovation & Novelty").
2. `max_points`: Upper bound for raw points (e.g., `25.0`).
3. `weight`: Multiplier applied during aggregation (e.g., `1.0` or `1.5`).

### Validation Rules (Rule 14)
When a score is submitted:
1. `points` must be $\ge 0$.
2. `points` must be $\le \text{criterion.max\_points}$.
3. `criterion_id` must belong to the rubric configured for this specific hackathon event.

---

## 3. Aggregate Scoring Mathematics

Let $S$ be a project submission evaluated by a set of assigned judges $J = \{j_1, j_2, \dots, j_m\}$.
Let $C = \{c_1, c_2, \dots, c_k\}$ be the set of rubric criteria for the event.

For each judge $j \in J$ and criterion $c \in C$, let $p(j, c)$ be the points awarded, and $w(c)$ be the criterion weight.

The score awarded by judge $j$ is:
$$\text{Score}(j, S) = \sum_{c \in C} \left( p(j, c) \times w(c) \right)$$

The aggregate score across all assigned judges is the arithmetic mean:
$$\text{Aggregate Score}(S) = \frac{1}{|J|} \sum_{j \in J} \text{Score}(j, S)$$

### Tie-Breaking Hierarchy
1. **Weighted Normalized Score** (highest wins).
2. **Weighted Aggregate Raw Score**.
3. **Total Number of Evaluators Completed**.
4. **Public Community Votes** (tie-breaker).
5. **Earliest Submission Timestamp**.

---

## 3.1. Cross-Judge Score Normalization (Z-Score & 0–100 Rescaling)

### Motivation: Eliminating Evaluator Bias
In open hackathons, evaluator standards differ significantly:
* **Harsh Judges:** Score strictly, with average evaluations around 4.0–6.0.
* **Generous Judges:** Score leniently, with average evaluations around 7.5–9.5.

When raw scores are directly averaged, a project assigned to a generous judge receives an unearned advantage over an exceptional project assigned to a harsh judge. **Cross-judge score normalization** resolves this by evaluating how far a project performed relative to that specific judge's scoring distribution.

### Mathematical Formulation

#### 1. Per-Judge Mean ($\mu_j$) and Standard Deviation ($\sigma_j$)
For each judge $j$ who evaluated $N_j$ submissions with scores $X_j = \{x_{j, 1}, x_{j, 2}, \dots, x_{j, N_j}\}$:

$$\mu_j = \frac{1}{N_j} \sum_{i=1}^{N_j} x_{j, i}$$

$$\sigma_j = \sqrt{\frac{1}{N_j} \sum_{i=1}^{N_j} (x_{j, i} - \mu_j)^2}$$

#### 2. Z-Score Transformation
For each evaluation score $x_{j, i}$:

$$z_{j, i} = \frac{x_{j, i} - \mu_j}{\sigma_j}$$

The z-score measures how many standard deviations a project score falls above or below the judge's personal average.

#### 3. 0–100 Rescaling
Across all computed $z$-scores in the event, let $z_{\min} = \min(Z)$ and $z_{\max} = \max(Z)$:

$$\text{Score}_{\text{norm}}(j, i) = \begin{cases} 
\displaystyle \left( \frac{z_{j, i} - z_{\min}}{z_{\max} - z_{\min}} \right) \times 100 & \text{if } z_{\max} > z_{\min} \\
50.0 & \text{if } z_{\max} = z_{\min}
\end{cases}$$

#### 4. Submission Normalized Score
The final normalized score for submission $S$ evaluated by judges $J_S$ is:

$$\text{Normalized Score}(S) = \frac{1}{|J_S|} \sum_{j \in J_S} \text{Score}_{\text{norm}}(j, S)$$

---

### Robust Edge-Case Handling

| Edge Case | Mathematical Problem | System Resolution |
| :--- | :--- | :--- |
| **Judge with 1 Score ($N_j = 1$)** | Variance $\sigma_j^2 = 0$; standard deviation $\sigma_j = 0$; division by zero. | Set $z_{j, 1} = 0.0$ (neutral median). The evaluation maps to the midpoint ($50.0$). Flagged with `single_score`. |
| **Standard Deviation 0 ($\sigma_j = 0$)** | Judge gave identical scores to all assigned projects (no variance); division by zero. | Set $z_{j, i} = 0.0$ for all their scores. Avoids division by zero and treats all evaluations as average ($50.0$). Flagged with `zero_variance`. |
| **Missing Scores / Unscored Projects** | Submissions with 0 completed judge evaluations. | Handled gracefully without `NaN`. Submissions remain unranked (`raw_rank = null`, `normalized_rank = null`) at the bottom of the table. |

---

### Before & After Case Study (Spec Fixture Data)

Consider four projects from [`sample_teams_and_projects.json`](file:///Users/rubansrijith/IdeaProjects/projects/dogFoodHackathon/database/fixtures/sample_teams_and_projects.json) evaluated by two judges with opposing rating habits from [`sample_users.json`](file:///Users/rubansrijith/IdeaProjects/projects/dogFoodHackathon/database/fixtures/sample_users.json):
* **Dr. Sarah Chen (`judge1`):** Harsh Judge ($\mu_1 = 5.0, \sigma_1 = 1.0$)
* **Elena Rostova (`judge3`):** Generous Judge ($\mu_2 = 8.0, \sigma_2 = 1.0$)

#### Side-by-Side Comparison

| Project Title | Team | Assigned Judge | Raw Score | Raw Rank | Z-Score | Normalized Score (0–100) | Normalized Rank | Rank Shift ($\Delta$) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Antigravity Autonomous Core** | Team Antigravity | Dr. Sarah Chen (Harsh) | **6.0** | #3 | **+1.00** | **100.0** | **#1** (tied) | **+2 (Jumped up)** |
| **ByteForge High-Throughput Log Engine** | Team ByteForge | Elena Rostova (Generous) | **9.0** | #1 | **+1.00** | **100.0** | **#1** (tied) | **0** |
| **Agentic Workflow Orchestrator** | Team Antigravity | Dr. Sarah Chen (Harsh) | **4.0** | #4 | **-1.00** | **0.0** | **#3** (tied) | **+1** |
| **HotReload Micro-Bundler** | Team ByteForge | Elena Rostova (Generous) | **7.0** | **#2** | **-1.00** | **0.0** | **#3** (tied) | **-1 (Dropped)** |

#### Key Takeaway:
* **Before Normalization:** HotReload Micro-Bundler was Elena's *worst* project ($7.0$), yet it placed **#2**, beating Dr. Chen's *best* project, Antigravity Autonomous Core ($6.0$, ranked #3), solely due to judge generosity bias.
* **After Normalization:** Antigravity Autonomous Core moves to **#1** with a perfect $100.0$, because it was the top-ranked project within its evaluator's distribution. Bias is completely eliminated.

---

## 4. Judging Lifecycle States

```text
[assigned] ────► [in_progress] ────► [completed]
     │                 │
     └─────────────────┴────────► (Assignment Removed by Organizer)
```

1. **`assigned`**: Organizer has assigned the project to the judge. The judge has not submitted scores for any criterion yet.
2. **`in_progress`**: The judge has scored at least one criterion, but criteria remain unscored.
3. **`completed`**: The judge has evaluated and saved scores for **all** criteria defined in the event rubric.

---

## 5. Audit Logging

Every evaluation event generates an append-only audit record:
* `SCORE_CREATED`: First score recorded for a criterion.
* `SCORE_UPDATED`: Modification of an existing criterion score.
* `JUDGE_ASSIGNED`: Organizer associates a judge with a submission.
* `JUDGE_UNASSIGNED`: Organizer removes an assignment.
* `RESULTS_PUBLISHED`: Event status transitioned to reveal final standings.
