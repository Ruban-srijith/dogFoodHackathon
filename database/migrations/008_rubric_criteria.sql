-- Migration 008: Rubric Criteria Table
CREATE TABLE IF NOT EXISTS rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight NUMERIC(4, 2) NOT NULL DEFAULT 1.00 CHECK (weight > 0),
    max_points NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (max_points > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rubric_criterion_name UNIQUE (rubric_id, name)
);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria_rubric_id ON rubric_criteria(rubric_id);
