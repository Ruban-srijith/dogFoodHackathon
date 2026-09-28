import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink, Github } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface ProjectCardProps {
  title: string;
  tagline: string;
  category: string;
  position: 'left' | 'center' | 'right';
  imageUrl: string;
  repoUrl?: string;
  demoUrl?: string;
  techStack?: string[];
  index: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  tagline,
  category,
  position,
  imageUrl,
  repoUrl,
  demoUrl,
  techStack,
  index,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !mediaRef.current) return;

    // Clip-path inset reveal & scale reveal with ScrollTrigger
    const anim = gsap.fromTo(
      mediaRef.current,
      { clipPath: 'inset(100% 0 0 0)', scale: 1.15 },
      {
        clipPath: 'inset(0% 0 0 0)',
        scale: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 80%',
        },
      }
    );

    // Parallax translation during scroll
    const parallaxAnim = gsap.to(mediaRef.current, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: cardRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      anim.kill();
      parallaxAnim.kill();
    };
  }, []);

  const positionClasses = {
    left: 'lg:flex-row',
    center: 'lg:flex-col lg:items-center text-center max-w-4xl mx-auto',
    right: 'lg:flex-row-reverse',
  }[position];

  return (
    <div
      ref={cardRef}
      className={`flex flex-col gap-8 py-16 border-b border-cyan-500/20 ${positionClasses}`}
    >
      {/* Media Card (16:10 aspect ratio) */}
      <div
        ref={mediaRef}
        data-cursor-text="VIEW"
        className="w-full lg:w-[42vw] aspect-[16/10] bg-slate-900 border border-cyan-500/30 overflow-hidden relative group cursor-pointer shadow-2xl shrink-0"
      >
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark Telemetry Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060911] via-transparent to-transparent opacity-80" />

        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest bg-[#060911]/80 px-2.5 py-1 rounded border border-cyan-500/30">
          PROJ / 0{index + 1} • {category}
        </div>
      </div>

      {/* Caption & Metadata */}
      <div className="flex-1 space-y-4 max-w-xl">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">
          [ 0{index + 1} // {category} ]
        </div>

        <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[var(--text-main)] leading-tight">
          {title}
        </h3>

        <p className="text-xs font-mono text-slate-300 leading-relaxed">
          {tagline}
        </p>

        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 font-mono text-xs">
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider"
            >
              <Github className="w-4 h-4" /> REPOSITORY →
            </a>
          )}
          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-400 font-bold uppercase tracking-wider"
            >
              <ExternalLink className="w-4 h-4" /> LIVE DEMO →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
