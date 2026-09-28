const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Event, Track, Prize, Team, Submission, RubricCriterion } = require('./models');

// Test accounts to seed
const testCredentials = [
  // 1 Admin
  { username: 'admin', email: 'admin@dogfood.local', password: 'AdminPassword123!', role: 'ADMIN', full_name: 'Platform Administrator', bio: 'Root administrator with total system privileges' },

  // 1 Organizer
  { username: 'organizer', email: 'organizer@dogfood.local', password: 'OrganizerPassword123!', role: 'ORGANIZER', full_name: 'Lead Event Organizer', bio: 'Hackathon coordinator and rubric manager' },

  // 3 Judges
  { username: 'judge1', email: 'judge1@dogfood.local', password: 'JudgeOnePassword123!', role: 'JUDGE', full_name: 'Dr. Sarah Chen', bio: 'Principal AI Researcher & Evaluation Chair' },
  { username: 'judge2', email: 'judge2@dogfood.local', password: 'JudgeTwoPassword123!', role: 'JUDGE', full_name: 'Marcus Vance', bio: 'VP of Infrastructure & Distributed Systems' },
  { username: 'judge3', email: 'judge3@dogfood.local', password: 'JudgeThreePassword123!', role: 'JUDGE', full_name: 'Elena Rostova', bio: 'Lead Design Architect & Product Strategist' },

  // 10 Participants
  { username: 'alice', email: 'alice@dogfood.local', password: 'AlicePassword123!', role: 'PARTICIPANT', full_name: 'Alice Walker', bio: 'Full-stack Engineer and autonomous agent hacker' },
  { username: 'bob', email: 'bob@dogfood.local', password: 'BobPassword123!', role: 'PARTICIPANT', full_name: 'Bob Smith', bio: 'Systems engineer specializing in concurrency and Docker' },
  { username: 'charlie', email: 'charlie@dogfood.local', password: 'CharliePassword123!', role: 'PARTICIPANT', full_name: 'Charlie Zhang', bio: 'Performance optimizer and write-ahead log developer' },
  { username: 'david', email: 'david@dogfood.local', password: 'DavidPassword123!', role: 'PARTICIPANT', full_name: 'David Kim', bio: 'Backend specialist with high-throughput streaming experience' },
  { username: 'emma', email: 'emma@dogfood.local', password: 'EmmaPassword123!', role: 'PARTICIPANT', full_name: 'Emma Watson', bio: 'Neural graph interface designer and data visualization lead' },
  { username: 'frank', email: 'frank@dogfood.local', password: 'FrankPassword123!', role: 'PARTICIPANT', full_name: 'Frank Miller', bio: 'Machine learning infrastructure and deterministic benchmarking' },
  { username: 'grace', email: 'grace@dogfood.local', password: 'GracePassword123!', role: 'PARTICIPANT', full_name: 'Grace Hopper', bio: 'Distributed tracing architect and eBPF explorer' },
  { username: 'henry', email: 'henry@dogfood.local', password: 'HenryPassword123!', role: 'PARTICIPANT', full_name: 'Henry Ford', bio: 'Offline security engineer and secrets vault maintainer' },
  { username: 'isabella', email: 'isabella@dogfood.local', password: 'IsabellaPassword123!', role: 'PARTICIPANT', full_name: 'Isabella Garcia', bio: 'Developer experience engineer and test automation advocate' },
  { username: 'jack', email: 'jack@dogfood.local', password: 'JackPassword123!', role: 'PARTICIPANT', full_name: 'Jack Ryan', bio: 'Observability developer and microservices reliability lead' }
];

function printCredentials() {
  console.log('\n' + '='.repeat(76));
  console.log('🔑  TEST LOGIN ACCOUNTS & CREDENTIALS');
  console.log('='.repeat(76));
  console.log(
    'ROLE'.padEnd(14) + 
    'EMAIL'.padEnd(30) + 
    'PASSWORD'.padEnd(24) + 
    'NAME'
  );
  console.log('-'.repeat(76));
  for (const account of testCredentials) {
    console.log(
      account.role.padEnd(14) + 
      account.email.padEnd(30) + 
      account.password.padEnd(24) + 
      account.full_name
    );
  }
  console.log('='.repeat(76) + '\n');
}

async function seedDatabaseIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Seed] Database already seeded (${userCount} users found). Skipping automatic seeding.`);
      printCredentials();
      return false;
    }

    console.log('[Seed] Database is empty. Starting automatic database seed...');

    // 1. Seed Users (1 Admin, 1 Organizer, 3 Judges, 10 Participants = 15 total)
    const saltRounds = 10;
    const usersMap = {};

    for (const item of testCredentials) {
      const password_hash = await bcrypt.hash(item.password, saltRounds);
      const user = await User.create({
        username: item.username,
        email: item.email,
        password_hash,
        role: item.role,
        full_name: item.full_name,
        bio: item.bio
      });
      usersMap[item.username] = user;
    }
    console.log(`[Seed] ✅ Seeded 15 Users: 1 Admin, 1 Organizer, 3 Judges, 10 Participants.`);

    // 2. Seed 1 Event with Dates
    const organizer = usersMap['organizer'];
    const now = new Date();
    const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);   // 7 days in future
    const deadline = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);  // 4 days in future

    const event = await Event.create({
      title: 'Global AI & Open Source Hackathon 2026',
      slug: 'global-ai-hackathon-2026',
      description: 'The premier self-hosted engineering hackathon pushing the frontiers of autonomous agents, developer tooling, and distributed systems.',
      start_date: startDate,
      end_date: endDate,
      submission_deadline: deadline,
      status: 'ongoing',
      location: 'Global / Decentralized (Air-Gapped & Offline Ready)',
      created_by: organizer._id
    });
    console.log(`[Seed] ✅ Seeded 1 Event with dates: "${event.title}" [${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}].`);

    // 3. Seed 2 Tracks
    const track1 = await Track.create({
      event_id: event._id,
      name: 'Autonomous AI Agents',
      description: 'Multi-agent frameworks, tool use, reasoning loops, and intelligent local sidecars.',
      prize_pool: '$10,000 + Cloud Credits'
    });

    const track2 = await Track.create({
      event_id: event._id,
      name: 'Developer Tooling & Infrastructure',
      description: 'Compilers, package managers, testing frameworks, and reproducible environments.',
      prize_pool: '$7,500'
    });
    console.log(`[Seed] ✅ Seeded 2 Tracks: "${track1.name}" and "${track2.name}".`);

    // 4. Seed 3 Prizes
    await Prize.create([
      {
        event_id: event._id,
        title: 'Grand Prize — 1st Place Overall',
        award_amount: '$10,000',
        description: 'Awarded to the most impactful, technically rigorous open-source platform.'
      },
      {
        event_id: event._id,
        title: 'Runner-Up — 2nd Place Overall',
        award_amount: '$5,000',
        description: 'Awarded to the project demonstrating outstanding engineering depth.'
      },
      {
        event_id: event._id,
        title: 'Community Choice Award',
        award_amount: '$2,500',
        description: 'Voted by the participants and peer evaluators across all active tracks.'
      }
    ]);
    console.log(`[Seed] ✅ Seeded 3 Prizes: Grand Prize ($10,000), Runner-Up ($5,000), Community Choice ($2,500).`);

    // 4.5. Seed Default Configurable Rubric Criteria
    await RubricCriterion.create([
      {
        event_id: event._id,
        name: 'Technical Rigor & Innovation',
        description: 'Algorithmic complexity, novelty, and architectural soundness.',
        weight: 0.4,
        min_score: 0,
        max_score: 10
      },
      {
        event_id: event._id,
        name: 'Execution & Demo Quality',
        description: 'Working demonstration, test coverage, and deployment reliability.',
        weight: 0.4,
        min_score: 0,
        max_score: 10
      },
      {
        event_id: event._id,
        name: 'Impact & Documentation',
        description: 'Practical utility, developer experience, and documentation depth.',
        weight: 0.2,
        min_score: 0,
        max_score: 10
      }
    ]);
    console.log(`[Seed] ✅ Seeded 3 Configurable Judging Rubric Criteria.`);

    // 5. Seed 4 Teams
    const team1 = await Team.create({
      event_id: event._id,
      name: 'Team Antigravity',
      slug: 'team-antigravity',
      description: 'Pioneering recursive autonomous reasoning loops and deterministic agents.',
      leader_id: usersMap['alice']._id,
      invite_code: 'GRAV2026',
      members: [usersMap['alice']._id, usersMap['bob']._id]
    });

    const team2 = await Team.create({
      event_id: event._id,
      name: 'Team ByteForge',
      slug: 'team-byteforge',
      description: 'Building ultra low-latency storage engines and immutable audit ledgers.',
      leader_id: usersMap['charlie']._id,
      invite_code: 'BYTE2026',
      members: [usersMap['charlie']._id, usersMap['david']._id]
    });

    const team3 = await Team.create({
      event_id: event._id,
      name: 'Team NeuralFlow',
      slug: 'team-neuralflow',
      description: 'Designing interactive neural graph visualizers and prompt benchmark harnesses.',
      leader_id: usersMap['emma']._id,
      invite_code: 'FLOW2026',
      members: [usersMap['emma']._id, usersMap['frank']._id]
    });

    const team4 = await Team.create({
      event_id: event._id,
      name: 'Team CyberPulse',
      slug: 'team-cyberpulse',
      description: 'Developing kernel-level observability systems and air-gapped secret brokers.',
      leader_id: usersMap['grace']._id,
      invite_code: 'PULSE2026',
      members: [usersMap['grace']._id, usersMap['henry']._id]
    });
    console.log(`[Seed] ✅ Seeded 4 Teams: Team Antigravity, Team ByteForge, Team NeuralFlow, Team CyberPulse.`);

    // 6. Seed 8 Submitted Projects
    const projects = [
      // Projects by Team Antigravity
      {
        event_id: event._id,
        team_id: team1._id,
        track_id: track1._id,
        title: 'Antigravity Autonomous Core',
        tagline: 'Self-correcting pair-programming agent with deterministic execution sandbox',
        description: 'Zero-latency coding agent environment that runs locally, enforces strict architectural contracts, and provides interactive browser validation without cloud dependencies.',
        repo_url: 'https://github.com/dogfood-hack/antigravity-core',
        demo_url: 'http://localhost:5173',
        tech_stack: ['TypeScript', 'Node.js', 'React', 'MongoDB', 'Docker'],
        status: 'submitted'
      },
      {
        event_id: event._id,
        team_id: team1._id,
        track_id: track1._id,
        title: 'Agentic Workflow Orchestrator',
        tagline: 'Hierarchical DAG coordinator for complex multi-agent reasoning tasks',
        description: 'A distributed workflow engine enabling multi-agent coordination with resilient fault recovery and local queue isolation.',
        repo_url: 'https://github.com/dogfood-hack/agent-orchestrator',
        demo_url: 'http://localhost:5173/orchestrator',
        tech_stack: ['Python', 'FastAPI', 'Redis', 'Docker'],
        status: 'submitted'
      },

      // Projects by Team ByteForge
      {
        event_id: event._id,
        team_id: team2._id,
        track_id: track2._id,
        title: 'ByteForge High-Throughput Log Engine',
        tagline: 'Append-only distributed immutable ledger for real-time audit compliance',
        description: 'Embedded write-ahead logging storage engine built for microsecond audit verifications and self-hosted high-concurrency systems.',
        repo_url: 'https://github.com/dogfood-hack/byteforge-db',
        demo_url: 'http://localhost:5173/byteforge',
        tech_stack: ['Rust', 'MongoDB', 'C++', 'Docker'],
        status: 'submitted'
      },
      {
        event_id: event._id,
        team_id: team2._id,
        track_id: track2._id,
        title: 'HotReload Micro-Bundler',
        tagline: 'Sub-millisecond Rust-based asset compiler for offline edge containers',
        description: 'An ultra-fast, offline web asset bundler that compiles ECMAScript and TypeScript with incremental tree-shaking.',
        repo_url: 'https://github.com/dogfood-hack/hotreload-bundler',
        demo_url: 'http://localhost:5173/bundler',
        tech_stack: ['Rust', 'WebAssembly', 'JavaScript'],
        status: 'submitted'
      },

      // Projects by Team NeuralFlow
      {
        event_id: event._id,
        team_id: team3._id,
        track_id: track1._id,
        title: 'NeuralGraph Semantic Visualizer',
        tagline: 'Interactive 3D representation of latent attention heads and vector databases',
        description: 'Real-time WebGL visualization matrix rendering multi-dimensional embedding clusters for air-gapped model audits.',
        repo_url: 'https://github.com/dogfood-hack/neural-graph',
        demo_url: 'http://localhost:5173/neuralgraph',
        tech_stack: ['Three.js', 'React', 'WebGL', 'TypeScript'],
        status: 'submitted'
      },
      {
        event_id: event._id,
        team_id: team3._id,
        track_id: track1._id,
        title: 'Cognitive Prompt Sandbox',
        tagline: 'Deterministic benchmark playground for local LLM inference validation',
        description: 'Automated evaluation suite testing prompt regressions against local model weight quantizations with statistical significance.',
        repo_url: 'https://github.com/dogfood-hack/prompt-sandbox',
        demo_url: 'http://localhost:5173/sandbox',
        tech_stack: ['Node.js', 'Express', 'SQLite', 'React'],
        status: 'submitted'
      },

      // Projects by Team CyberPulse
      {
        event_id: event._id,
        team_id: team4._id,
        track_id: track2._id,
        title: 'CyberPulse Distributed Tracer',
        tagline: 'Zero-overhead eBPF request tracing across multi-container topologies',
        description: 'Kernel-space telemetry daemon capturing TCP socket handshakes, DNS resolutions, and HTTP payload latencies with 0% overhead.',
        repo_url: 'https://github.com/dogfood-hack/cyberpulse-trace',
        demo_url: 'http://localhost:5173/cyberpulse',
        tech_stack: ['C', 'eBPF', 'Go', 'Prometheus'],
        status: 'submitted'
      },
      {
        event_id: event._id,
        team_id: team4._id,
        track_id: track2._id,
        title: 'EdgeGuard Offline Secrets Vault',
        tagline: 'Hardware-encrypted local secret broker for air-gapped development stacks',
        description: 'Local KMS replacement utilizing hardware security modules and encrypted memory buffers for zero-trust microservice networks.',
        repo_url: 'https://github.com/dogfood-hack/edgeguard-vault',
        demo_url: 'http://localhost:5173/edgeguard',
        tech_stack: ['Go', 'Cryptography', 'Linux Security Modules'],
        status: 'submitted'
      }
    ];

    await Submission.create(projects);
    console.log(`[Seed] ✅ Seeded 8 Submitted Projects across all 4 teams.`);

    console.log('\n[Seed] 🎉 Automatic database seeding completed successfully!');
    printCredentials();
    return true;
  } catch (error) {
    console.error('[Seed] ❌ Seeding failed:', error);
    throw error;
  }
}

// Allow running standalone: `node src/seed.js`
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/app_db';
  mongoose.connect(MONGO_URI)
    .then(async () => {
      await seedDatabaseIfEmpty();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed connection failed:', err);
      process.exit(1);
    });
}

module.exports = {
  seedDatabaseIfEmpty,
  printCredentials,
  testCredentials
};
