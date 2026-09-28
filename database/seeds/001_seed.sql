-- DOGFOOD Deterministic Seed Data
-- Passwords:
-- Admin: admin@dogfood.local / DogfoodAdmin123!
-- Organizer: organizer@dogfood.local / DogfoodOrg123!
-- Judges: judge1@dogfood.local, judge2@dogfood.local / DogfoodJudge123!
-- Participants: alice@dogfood.local, bob@dogfood.local, charlie@dogfood.local / DogfoodUser123!
-- Visitor: visitor@dogfood.local / DogfoodUser123!

-- 1. Users
INSERT INTO users (id, username, email, password_hash, role, full_name, bio)
VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'admin@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'ADMIN', 'Platform Administrator', 'Chief System Administrator & Hackathon Overseer'),
('22222222-2222-2222-2222-222222222222', 'organizer', 'organizer@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'ORGANIZER', 'Elena Rostova', 'Lead Hackathon Director & Community Lead'),
('33333333-3333-3333-3333-333333333331', 'judge1', 'judge1@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'JUDGE', 'Dr. Alan Turing Jr.', 'Senior AI Researcher and Evaluation Lead'),
('33333333-3333-3333-3333-333333333332', 'judge2', 'judge2@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'JUDGE', 'Grace Hopper AI', 'Staff Systems Architect & Infrastructure Specialist'),
('44444444-4444-4444-4444-444444444441', 'alice', 'alice@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'PARTICIPANT', 'Alice Henderson', 'Fullstack Engineer & Autonomous Agent Enthusiast'),
('44444444-4444-4444-4444-444444444442', 'bob', 'bob@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'PARTICIPANT', 'Bob Martinez', 'Distributed Systems & Database Optimizer'),
('44444444-4444-4444-4444-444444444443', 'charlie', 'charlie@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'PARTICIPANT', 'Charlie Zhang', 'Frontend Architect & UI Motion Designer'),
('55555555-5555-5555-5555-555555555555', 'visitor', 'visitor@dogfood.local', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.eRjXvh71qj5E7NrkZ9B7W8fK1VqU5qy', 'VISITOR', 'Guest Explorer', 'Open source observer & community voter')
ON CONFLICT (id) DO NOTHING;

-- 2. Event
INSERT INTO events (id, title, slug, description, start_date, end_date, submission_deadline, status, location, created_by)
VALUES
('e0000000-0000-0000-0000-000000000001', 'Global AI & Open Source Hackathon 2026', 'global-ai-hackathon-2026', 'The premier self-hosted engineering hackathon pushing the frontiers of autonomous agents, developer tooling, and distributed systems.', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '4 days', 'ongoing', 'Global / Decentralized', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- 3. Tracks
INSERT INTO tracks (id, event_id, name, description, prize_pool)
VALUES
('t0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Autonomous AI Agents', 'Multi-agent frameworks, tool use, reasoning loops, and intelligent local sidecars.', '$10,000 + Cloud Credits'),
('t0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Developer Tooling & Infrastructure', 'Compilers, package managers, testing frameworks, and reproducible environments.', '$7,500'),
('t0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Community & Open Web', 'Collaborative apps, accessibility, decentralization, and privacy-preserving tools.', '$5,000')
ON CONFLICT (id) DO NOTHING;

-- 4. Rubric & Criteria
INSERT INTO rubrics (id, event_id, name, description, max_score)
VALUES
('r0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Official Evaluation Rubric 2026', 'Standard evaluation rubric for judges', 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rubric_criteria (id, rubric_id, name, description, weight, max_points)
VALUES
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'Innovation & Novelty', 'Originality of approach, unique insight, and creative leap', 1.0, 25),
('c0000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000001', 'Technical Depth & Architecture', 'Code quality, system stability, self-hostability, and engineering rigor', 1.0, 25),
('c0000000-0000-0000-0000-000000000003', 'r0000000-0000-0000-0000-000000000001', 'UI / UX & Developer Experience', 'Aesthetic polish, intuitive flows, clean error handling, and visual appeal', 1.0, 25),
('c0000000-0000-0000-0000-000000000004', 'r0000000-0000-0000-0000-000000000001', 'Real-world Practical Impact', 'Utility to developers, problem severity, and open source value', 1.0, 25)
ON CONFLICT (id) DO NOTHING;

-- 5. Teams & Members
INSERT INTO teams (id, event_id, name, slug, description, leader_id, invite_code)
VALUES
('b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Team Antigravity', 'team-antigravity', 'Pioneering recursive autonomous reasoning loops.', '44444444-4444-4444-4444-444444444441', 'GRAV2026'),
('b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Team ByteForge', 'team-byteforge', 'Building ultra low-latency database engines.', '44444444-4444-4444-4444-444444444442', 'BYTE2026'),
('b0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Team NeuralFlow', 'team-neuralflow', 'Designing interactive neural graph visualizers.', '44444444-4444-4444-4444-444444444443', 'FLOW2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_members (team_id, user_id, role)
VALUES
('b0000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444441', 'leader'),
('b0000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444442', 'leader'),
('b0000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444443', 'leader')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 6. Submissions
INSERT INTO submissions (id, event_id, team_id, track_id, title, tagline, description, repo_url, demo_url, video_url, tech_stack, status, submitted_at)
VALUES
('s0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001', 'Antigravity Autonomous Core', 'Self-correcting pair-programming agent with deterministic execution sandbox', 'Zero-latency coding agent environment that runs locally, enforces strict architectural contracts, verifies every migration, and provides interactive browser validation without cloud dependencies.', 'https://github.com/dogfood-hack/antigravity-core', 'https://demo.antigravity.local', 'https://youtube.com/watch?v=dQw4w9WgXcQ', ARRAY['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'React'], 'submitted', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('s0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000002', 'ByteForge High-Throughput Log Engine', 'Append-only distributed immutable ledger for real-time audit compliance', 'Embedded write-ahead logging storage engine built for microsecond audit verifications and self-hosted high-concurrency systems.', 'https://github.com/dogfood-hack/byteforge-db', 'https://byteforge.local', NULL, ARRAY['Rust', 'PostgreSQL', 'Docker', 'Go'], 'submitted', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Judge Assignments
INSERT INTO judge_assignments (id, event_id, judge_id, submission_id, status)
VALUES
('ja000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', 's0000000-0000-0000-0000-000000000001', 'completed'),
('ja000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', 's0000000-0000-0000-0000-000000000002', 'assigned')
ON CONFLICT (judge_id, submission_id) DO NOTHING;

-- 8. Scores
INSERT INTO scores (assignment_id, judge_id, submission_id, criterion_id, points, feedback)
VALUES
('ja000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 24, 'Brilliant innovation on local deterministic loop isolation.'),
('ja000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 25, 'Extremely clean architecture and robust database migrations.'),
('ja000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', 's0000000-0000-0000-0000-000000000003', 23, 'Polished dark UI and immediate responsive feedback.'),
('ja000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', 's0000000-0000-0000-0000-000000000004', 24, 'High developer utility for running offline hackathons.')
ON CONFLICT (judge_id, submission_id, criterion_id) DO NOTHING;

-- 9. Votes
INSERT INTO votes (event_id, user_id, submission_id)
VALUES
('e0000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 's0000000-0000-0000-0000-000000000001')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- 10. Audit logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
VALUES
('22222222-2222-2222-2222-222222222222', 'EVENT_CREATED', 'event', 'e0000000-0000-0000-0000-000000000001', '{"title": "Global AI & Open Source Hackathon 2026"}'),
('44444444-4444-4444-4444-444444444441', 'TEAM_CREATED', 'team', 'b0000000-0000-0000-0000-000000000001', '{"team": "Team Antigravity"}'),
('44444444-4444-4444-4444-444444444441', 'SUBMISSION_SUBMITTED', 'submission', 's0000000-0000-0000-0000-000000000001', '{"title": "Antigravity Autonomous Core"}');
