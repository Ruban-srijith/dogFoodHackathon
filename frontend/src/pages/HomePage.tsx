import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Event } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { WireframeCanvas } from '../components/WireframeCanvas';
import { CyberpunkGlitchText } from '../components/CyberpunkGlitchText';
import { StatementSection } from '../components/StatementSection';
import { ScrubTextSection } from '../components/ScrubTextSection';
import { ProjectCard } from '../components/ProjectCard';
import { RoyalCrest } from '../components/RoyalCrest';
import { formatDate, formatDaysRemaining } from '../utils/formatters';
import { ShieldCheck, Terminal, Cpu, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getPublicEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hackathon events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const showcaseProjects = [
    {
      title: 'Unstop Flow Studio',
      tagline: 'AI-Powered No-Code Product Development Platform compiling wireframes to production React in real time.',
      category: 'AI & SaaS Product Innovation',
      position: 'left' as const,
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      repoUrl: 'https://github.com/Ruban-srijith/dogFoodHackathon',
      demoUrl: 'https://unstop.com',
      techStack: ['React', 'TypeScript', 'TailwindCSS', 'Node.js'],
    },
    {
      title: 'Telemetry Mesh Pro',
      tagline: 'Self-Hostable Product Analytics & Health Dashboard for microservice telemetry with zero SaaS fees.',
      category: 'Developer Tools & Telemetry',
      position: 'right' as const,
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      repoUrl: 'https://github.com/Ruban-srijith/dogFoodHackathon',
      demoUrl: 'https://unstop.com',
      techStack: ['TypeScript', 'Docker', 'Express', 'PostgreSQL'],
    },
    {
      title: 'FinTech Checkout Core',
      tagline: 'Friction-less merchant payment telemetry and real-time fraud prevention engine.',
      category: 'FinTech & E-Commerce',
      position: 'left' as const,
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      repoUrl: 'https://github.com/Ruban-srijith/dogFoodHackathon',
      demoUrl: 'https://unstop.com',
      techStack: ['React', 'PostgreSQL', 'Docker', 'TailwindCSS'],
    },
    {
      title: 'DOGFOOD Judge Engine',
      tagline: 'Cryptographically isolated judging queue with multi-dimensional weighted rubric evaluations.',
      category: 'Hackathon Architecture',
      position: 'center' as const,
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      repoUrl: 'https://github.com/Ruban-srijith/dogFoodHackathon',
      demoUrl: 'https://unstop.com',
      techStack: ['TypeScript', 'Three.js', 'GSAP', 'Lenis'],
    },
  ];

  return (
    <div className="space-y-16 py-2">
      {/* 1. HERO SECTION (Replicating Screenshot Layout Exactly) */}
      <section className="relative rounded-3xl border border-cyan-500/20 bg-[var(--bg-surface)] p-6 sm:p-12 overflow-hidden blueprint-grid-overlay shadow-2xl">
        <WireframeCanvas />

        <div className="relative z-10 space-y-8 max-w-6xl">
          {/* Telemetry Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono tracking-widest text-slate-400 border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-bold">[ UNIT / DF-01 ]</span>
              <span>51.5310°N 0.0500°E</span>
              <span>REV 2.6</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SYS READY • REGISTRATION OPEN</span>
            </div>
          </div>

          {/* Extruded 3D DOGFOOD Title (With Red 'F' from Screenshot!) */}
          <div className="pt-2 pb-4 select-none">
            <h1 className="text-6xl sm:text-8xl lg:text-9xl extruded-hero-title leading-none">
              DOG<span className="highlight-f">F</span>OOD
            </h1>
          </div>

          {/* Subhead, Telemetry Waveform & Brief Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-cyan-500/20">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--text-main)] font-mono leading-tight">
                <CyberpunkGlitchText text="BUILD THE PLATFORM" /> <br />
                <span className="text-rose-500"><CyberpunkGlitchText text="THAT WILL JUDGE YOU." /></span>
              </h2>

              <div className="text-xs font-mono text-slate-400 space-y-1 font-semibold">
                <p>SEPTEMBER 26-29, 2026 • ONLINE</p>
                <p className="text-cyan-400 font-bold">FREE • $2,500 IN PRIZES</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/events">
                  <button className="px-5 py-2.5 rounded-lg bg-[#ff2a5f] hover:bg-[#e0224f] text-white text-xs font-mono font-black uppercase tracking-wider transition shadow-lg shadow-rose-500/20 cursor-pointer">
                    EXPLORE HACKATHONS →
                  </button>
                </Link>
                <Link to="/gallery">
                  <button className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-900/60 text-slate-200 text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer">
                    SUBMISSIONS
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: [ BRIEF / 00 ] */}
            <div className="lg:col-span-7 space-y-3 p-5 rounded-2xl bg-[#03060c]/80 border border-slate-800 text-xs font-mono">
              <div className="text-cyan-400 font-bold uppercase tracking-widest text-[11px] flex items-center justify-between">
                <span>[ BRIEF / 00 ]</span>
                <span className="text-[10px] text-slate-500 font-normal">SEC_LEVEL_01</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">
                Thirty-five hackathons in, across 85 countries, we know exactly what a submission and judging platform should do. So does every organizer who has ever run one. What none of us has is a modern, open, self-hostable platform that does it. This is the hackathon platform engineered to eliminate cloud SaaS dependency.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">01.</span> Isolated Judging</div>
                <div className="flex items-center gap-1.5"><span className="text-cyan-400 font-bold">02.</span> Weighted Rubric</div>
                <div className="flex items-center gap-1.5"><span className="text-rose-500 font-bold">03.</span> Docker Native</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROYAL IMPERIAL CREST GRAPHICS BANNER */}
      <RoyalCrest />

      {/* 2. STATEMENT SECTION (GSAP Word-by-Word Opacity & Blur Scrubbing) */}
      <StatementSection text="Transcend anything seen or felt before by crafting unparalleled digital experiences for ambitious hackathon builders." />

      {/* 3. "OUR APPROACH" SCRUB SECTION */}
      <ScrubTextSection
        label="OUR APPROACH"
        statement="We combine deterministic server-side judge isolation, weighted scoring rubrics, and real-time project galleries into a single self-hostable engine."
      />

      {/* 4. PROJECT SHOWCASE (16:10 Media Cards, Parallax Scrub, Inset Clip-path Reveals) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">[ PROJECT SHOWCASE ]</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] font-mono mt-1">Curated Engineering Creations</h2>
          </div>
          <Link to="/gallery" className="text-xs font-mono font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 flex items-center gap-1.5 transition">
            See All Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div>
          {showcaseProjects.map((project, idx) => (
            <ProjectCard key={project.title} index={idx} {...project} />
          ))}
        </div>
      </section>

      {/* 5. "OUR MISSION" SCRUB SECTION */}
      <ScrubTextSection
        label="OUR MISSION"
        statement="To empower organizers, judges, and developers globally with open, uncompromised, 100% Docker-native hackathon infrastructure."
      />

      {/* 6. FEATURED COMPETITIONS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-500/20 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">[ SYSTEM COMPETITIONS ]</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] font-mono mt-1">
              <CyberpunkGlitchText text="Featured Hackathons" />
            </h2>
          </div>
          <Link to="/events" className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition">
            View All Competitions →
          </Link>
        </div>

        {loading ? (
          <Loading message="Loading telemetry hackathons..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : events.length === 0 ? (
          <Card className="text-center py-16 font-mono text-xs text-slate-400">
            No active hackathons currently registered in system telemetry.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Card key={evt.id} hover className="flex flex-col justify-between h-full group theme-card border-cyan-500/20 hover:border-rose-500/40">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={evt.status} />
                    <span className="text-xs font-mono font-semibold text-cyan-400 px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {formatDaysRemaining(evt.submission_deadline)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-[var(--text-main)] group-hover:text-rose-500 transition">
                      <Link to={`/events/${evt.slug || evt.id}`}>{evt.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Starts {formatDate(evt.start_date)}</span>
                  <Link to={`/events/${evt.slug || evt.id}`}>
                    <Button size="sm" variant="outline" className="font-mono text-xs">
                      SPEC DETAILS →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 7. ARCHITECTURE HIGHLIGHTS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3 theme-card">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 font-mono font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] font-mono">01. Cryptographic Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Judges access assigned submissions exclusively via cryptographically verified server-side session tokens, eliminating evaluation tampering.
          </p>
        </Card>

        <Card className="space-y-3 theme-card">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] font-mono">02. Weighted Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Configure multi-dimensional rubric criteria with custom weight factors, automatically generating aggregate ranking telemetry.
          </p>
        </Card>

        <Card className="space-y-3 theme-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] font-mono">03. 100% Docker Local</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Deploys with a single command: `docker compose up --build`. Complete governance over your data with zero vendor lock-in.
          </p>
        </Card>
      </section>
    </div>
  );
};
