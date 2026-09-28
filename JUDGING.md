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
1. **Weighted Aggregate Score** (highest wins).
2. **Total Number of Evaluators Completed**.
3. **Public Community Votes** (tie-breaker).
4. **Earliest Submission Timestamp**.

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
