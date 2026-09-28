import { db, pool } from '../config/database';
import { hashPassword } from '../utils/password';

export const runSeed = async () => {
  console.log('🌱 Starting deterministic seed data insertion...');

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Fixed Passwords (hashed via bcrypt)
    const adminPass = await hashPassword('DogfoodAdmin123!');
    const orgPass = await hashPassword('DogfoodOrg123!');
    const judgePass = await hashPassword('DogfoodJudge123!');
    const userPass = await hashPassword('DogfoodUser123!');

    // 2. Fixed Users with deterministic UUIDs
    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        username: 'admin',
        email: 'admin@dogfood.local',
        password_hash: adminPass,
        role: 'ADMIN',
        full_name: 'Platform Administrator',
        bio: 'Chief System Administrator & Hackathon Overseer',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        username: 'organizer',
        email: 'organizer@dogfood.local',
        password_hash: orgPass,
        role: 'ORGANIZER',
        full_name: 'Elena Rostova',
        bio: 'Lead Hackathon Director & Community Lead',
      },
      {
        id: '33333333-3333-3333-3333-333333333331',
        username: 'judge1',
        email: 'judge1@dogfood.local',
        password_hash: judgePass,
        role: 'JUDGE',
        full_name: 'Dr. Alan Turing Jr.',
        bio: 'Senior AI Researcher and Evaluation Lead',
      },
      {
        id: '33333333-3333-3333-3333-333333333332',
        username: 'judge2',
        email: 'judge2@dogfood.local',
        password_hash: judgePass,
        role: 'JUDGE',
        full_name: 'Grace Hopper AI',
        bio: 'Staff Systems Architect & Infrastructure Specialist',
      },
      {
        id: '44444444-4444-4444-4444-444444444441',
        username: 'alice',
        email: 'alice@dogfood.local',
        password_hash: userPass,
        role: 'PARTICIPANT',
        full_name: 'Alice Henderson',
        bio: 'Fullstack Engineer & Autonomous Agent Enthusiast',
      },
      {
        id: '44444444-4444-4444-4444-444444444442',
        username: 'bob',
        email: 'bob@dogfood.local',
        password_hash: userPass,
        role: 'PARTICIPANT',
        full_name: 'Bob Martinez',
        bio: 'Distributed Systems & Database Optimizer',
      },
      {
        id: '44444444-4444-4444-4444-444444444443',
        username: 'charlie',
        email: 'charlie@dogfood.local',
        password_hash: userPass,
        role: 'PARTICIPANT',
        full_name: 'Charlie Zhang',
        bio: 'Frontend Architect & UI Motion Designer',
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        username: 'visitor',
        email: 'visitor@dogfood.local',
        password_hash: userPass,
        role: 'VISITOR',
        full_name: 'Guest Explorer',
        bio: 'Open source observer & community voter',
      },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, username, email, password_hash, role, full_name, bio)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           role = EXCLUDED.role,
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name`,
        [u.id, u.username, u.email, u.password_hash, u.role, u.full_name, u.bio]
      );
    }
    console.log('✅ Users seeded.');

    // 3. Demo Hackathon Event
    const eventId = 'e0000000-0000-0000-0000-000000000001';
    await client.query(
      `INSERT INTO events (id, title, slug, description, start_date, end_date, submission_deadline, status, location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         status = EXCLUDED.status`,
      [
        eventId,
        'Global AI & Open Source Hackathon 2026',
        'global-ai-hackathon-2026',
        'The premier self-hosted engineering hackathon pushing the frontiers of autonomous agents, developer tooling, and distributed systems. Built and evaluated using DOGFOOD platform.',
        new Date(Date.now() - 3 * 86400000).toISOString(),
        new Date(Date.now() + 7 * 86400000).toISOString(),
        new Date(Date.now() + 4 * 86400000).toISOString(),
        'ongoing',
        'Global / Decentralized',
        users[1].id, // Elena (organizer)
      ]
    );
    console.log('✅ Event seeded.');

    // 4. Tracks
    const tracks = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        event_id: eventId,
        name: 'Autonomous AI Agents',
        description: 'Multi-agent frameworks, tool use, reasoning loops, and intelligent local sidecars.',
        prize_pool: '$10,000 + Cloud Credits',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000002',
        event_id: eventId,
        name: 'Developer Tooling & Infrastructure',
        description: 'Compilers, package managers, testing frameworks, and reproducible environments.',
        prize_pool: '$7,500',
      },
      {
        id: 'a0000000-0000-0000-0000-000000000003',
        event_id: eventId,
        name: 'Community & Open Web',
        description: 'Collaborative apps, accessibility, decentralization, and privacy-preserving tools.',
        prize_pool: '$5,000',
      },
    ];

    for (const t of tracks) {
      await client.query(
        `INSERT INTO tracks (id, event_id, name, description, prize_pool)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.event_id, t.name, t.description, t.prize_pool]
      );
    }
    console.log('✅ Tracks seeded.');

    // 5. Rubric and Criteria
    const rubricId = 'e1000000-0000-0000-0000-000000000001';
    await client.query(
      `INSERT INTO rubrics (id, event_id, name, description, max_score)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [rubricId, eventId, 'Official Evaluation Rubric 2026', 'Comprehensive scoring guidelines across 4 pillars', 100]
    );

    const criteria = [
      { id: 'e2000000-0000-0000-0000-000000000001', rubric_id: rubricId, name: 'Innovation & Novelty', description: 'Originality of approach, unique insight, and creative leap', weight: 1.0, max_points: 25 },
      { id: 'e2000000-0000-0000-0000-000000000002', rubric_id: rubricId, name: 'Technical Depth & Architecture', description: 'Code quality, system stability, self-hostability, and engineering rigor', weight: 1.0, max_points: 25 },
      { id: 'e2000000-0000-0000-0000-000000000003', rubric_id: rubricId, name: 'UI / UX & Developer Experience', description: 'Aesthetic polish, intuitive flows, clean error handling, and visual appeal', weight: 1.0, max_points: 25 },
      { id: 'e2000000-0000-0000-0000-000000000004', rubric_id: rubricId, name: 'Real-world Practical Impact', description: 'Utility to developers, problem severity, and open source value', weight: 1.0, max_points: 25 },
    ];

    for (const c of criteria) {
      await client.query(
        `INSERT INTO rubric_criteria (id, rubric_id, name, description, weight, max_points)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.rubric_id, c.name, c.description, c.weight, c.max_points]
      );
    }
    console.log('✅ Rubric & criteria seeded.');

    // 6. Teams
    const teams = [
      {
        id: 'e3000000-0000-0000-0000-000000000001',
        event_id: eventId,
        name: 'Team Antigravity',
        slug: 'team-antigravity',
        description: 'Pioneering recursive autonomous reasoning loops and agentic workflow orchestration.',
        leader_id: users[4].id, // Alice
        invite_code: 'GRAV2026',
      },
      {
        id: 'e3000000-0000-0000-0000-000000000002',
        event_id: eventId,
        name: 'Team ByteForge',
        slug: 'team-byteforge',
        description: 'Building ultra low-latency database engines and real-time streaming consensus.',
        leader_id: users[5].id, // Bob
        invite_code: 'BYTE2026',
      },
      {
        id: 'e3000000-0000-0000-0000-000000000003',
        event_id: eventId,
        name: 'Team NeuralFlow',
        slug: 'team-neuralflow',
        description: 'Designing interactive neural graph visualizers with WebGL shaders and live telemetry.',
        leader_id: users[6].id, // Charlie
        invite_code: 'FLOW2026',
      },
    ];

    for (const tm of teams) {
      await client.query(
        `INSERT INTO teams (id, event_id, name, slug, description, leader_id, invite_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [tm.id, tm.event_id, tm.name, tm.slug, tm.description, tm.leader_id, tm.invite_code]
      );

      // Add leader to team_members
      await client.query(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES ($1, $2, 'leader')
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [tm.id, tm.leader_id]
      );
    }
    console.log('✅ Teams & members seeded.');

    // 7. Submissions
    const submissions = [
      {
        id: 'e4000000-0000-0000-0000-000000000001',
        event_id: eventId,
        team_id: teams[0].id,
        track_id: tracks[0].id, // Autonomous AI Agents
        title: 'Antigravity Autonomous Core',
        tagline: 'Self-correcting pair-programming agent with deterministic execution sandbox',
        description: 'Antigravity Autonomous Core is a zero-latency coding agent environment that runs locally, enforces strict architectural contracts, verifies every migration, and provides interactive browser validation without cloud dependencies.',
        repo_url: 'https://github.com/dogfood-hack/antigravity-core',
        demo_url: 'https://demo.antigravity.local',
        video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        tech_stack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'React'],
        status: 'submitted',
        submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'e4000000-0000-0000-0000-000000000002',
        event_id: eventId,
        team_id: teams[1].id,
        track_id: tracks[1].id, // Developer Tooling
        title: 'ByteForge High-Throughput Log Engine',
        tagline: 'Append-only distributed immutable ledger for real-time audit compliance',
        description: 'ByteForge is an embedded write-ahead logging storage engine built for microsecond audit verifications and self-hosted high-concurrency systems.',
        repo_url: 'https://github.com/dogfood-hack/byteforge-db',
        demo_url: 'https://byteforge.local',
        video_url: null,
        tech_stack: ['Rust', 'PostgreSQL', 'Docker', 'Go'],
        status: 'submitted',
        submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'e4000000-0000-0000-0000-000000000003',
        event_id: eventId,
        team_id: teams[2].id,
        track_id: tracks[2].id, // Community & Open Web
        title: 'NeuralFlow Shader Canvas',
        tagline: 'Interactive 3D graph visualizer for open-source contributor networks',
        description: 'A WebGL shader canvas that visualizes developer interactions, commit topologies, and real-time review dynamics across open-source hackathons.',
        repo_url: 'https://github.com/dogfood-hack/neuralflow',
        demo_url: null,
        video_url: null,
        tech_stack: ['React', 'Three.js', 'Tailwind CSS', 'Vite'],
        status: 'draft',
        submitted_at: null,
      },
    ];

    for (const sub of submissions) {
      await client.query(
        `INSERT INTO submissions (id, event_id, team_id, track_id, title, tagline, description, repo_url, demo_url, video_url, tech_stack, status, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           status = EXCLUDED.status`,
        [
          sub.id,
          sub.event_id,
          sub.team_id,
          sub.track_id,
          sub.title,
          sub.tagline,
          sub.description,
          sub.repo_url,
          sub.demo_url,
          sub.video_url,
          sub.tech_stack,
          sub.status,
          sub.submitted_at,
        ]
      );
    }
    console.log('✅ Submissions seeded.');

    // 8. Judge Assignments (Rule 16: Judging Isolation)
    // Judge 1 assigned to Submissions 1 and 2
    // Judge 2 assigned to Submission 1
    const assignments = [
      {
        id: 'e5000000-0000-0000-0000-000000000001',
        event_id: eventId,
        judge_id: users[2].id, // Judge 1
        submission_id: submissions[0].id, // Antigravity
        status: 'completed',
      },
      {
        id: 'e5000000-0000-0000-0000-000000000002',
        event_id: eventId,
        judge_id: users[2].id, // Judge 1
        submission_id: submissions[1].id, // ByteForge
        status: 'assigned',
      },
      {
        id: 'e5000000-0000-0000-0000-000000000003',
        event_id: eventId,
        judge_id: users[3].id, // Judge 2
        submission_id: submissions[0].id, // Antigravity
        status: 'in_progress',
      },
    ];

    for (const a of assignments) {
      await client.query(
        `INSERT INTO judge_assignments (id, event_id, judge_id, submission_id, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (judge_id, submission_id) DO NOTHING`,
        [a.id, a.event_id, a.judge_id, a.submission_id, a.status]
      );
    }
    console.log('✅ Judge assignments seeded.');

    // 9. Scores for Judge 1 evaluating Antigravity Core
    const scores = [
      { assignment_id: assignments[0].id, judge_id: users[2].id, submission_id: submissions[0].id, criterion_id: criteria[0].id, points: 24, feedback: 'Brilliant innovation on local deterministic loop isolation.' },
      { assignment_id: assignments[0].id, judge_id: users[2].id, submission_id: submissions[0].id, criterion_id: criteria[1].id, points: 25, feedback: 'Extremely clean architecture and robust database migrations.' },
      { assignment_id: assignments[0].id, judge_id: users[2].id, submission_id: submissions[0].id, criterion_id: criteria[2].id, points: 23, feedback: 'Polished dark UI and immediate responsive feedback.' },
      { assignment_id: assignments[0].id, judge_id: users[2].id, submission_id: submissions[0].id, criterion_id: criteria[3].id, points: 24, feedback: 'High developer utility for running offline hackathons.' },
    ];

    for (const s of scores) {
      await client.query(
        `INSERT INTO scores (assignment_id, judge_id, submission_id, criterion_id, points, feedback)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (judge_id, submission_id, criterion_id) DO NOTHING`,
        [s.assignment_id, s.judge_id, s.submission_id, s.criterion_id, s.points, s.feedback]
      );
    }
    console.log('✅ Judging scores seeded.');

    // 10. Community Votes
    await client.query(
      `INSERT INTO votes (event_id, user_id, submission_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [eventId, users[7].id, submissions[0].id] // Visitor voted for Antigravity Core
    );
    console.log('✅ Community votes seeded.');

    // 11. Comments
    await client.query(
      `INSERT INTO comments (submission_id, user_id, content, is_internal)
       VALUES 
       ($1, $2, 'Outstanding submission! The local docker orchestration is seamless.', false),
       ($1, $3, 'Internal note: Code structure cleanly follows all 42 rules. Verified.', true)`,
      [submissions[0].id, users[7].id, users[2].id]
    );
    console.log('✅ Comments seeded.');

    // 12. Audit Logs
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES 
       ($1, 'EVENT_CREATED', 'event', $2, '{"title": "Global AI & Open Source Hackathon 2026"}'),
       ($3, 'TEAM_CREATED', 'team', $4, '{"team": "Team Antigravity"}'),
       ($3, 'SUBMISSION_SUBMITTED', 'submission', $5, '{"title": "Antigravity Autonomous Core"}')`,
      [users[1].id, eventId, users[4].id, teams[0].id, submissions[0].id]
    );
    console.log('✅ Audit logs seeded.');

    await client.query('COMMIT');
    console.log('🎉 Deterministic database seed completed successfully!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Database seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runSeed()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
