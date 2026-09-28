import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface StatementSectionProps {
  text?: string;
}

export const StatementSection: React.FC<StatementSectionProps> = ({
  text = 'Transcend anything seen or felt before by crafting unparalleled experiences for ambitious brands.',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const words = textRef.current.querySelectorAll('.statement-word');

    // GSAP ScrollTrigger scrubbing word-by-word opacity (0.15 to 1.0) and blur (8px to 0px)
    const anim = gsap.fromTo(
      words,
      { opacity: 0.15, filter: 'blur(8px)', y: 10 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 40%',
          scrub: 0.8,
        },
      }
    );

    return () => {
      anim.kill();
    };
  }, []);

  const words = text.split(' ');

  return (
    <section ref={containerRef} className="py-24 px-4 sm:px-8 border-b border-cyan-500/20">
      <div className="max-w-5xl">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-6">
          [ STATEMENT / MISSION ]
        </div>
        <p
          ref={textRef}
          className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light leading-[1.15] text-[var(--text-main)] tracking-tight"
        >
          {words.map((word, i) => (
            <span key={i} className="statement-word inline-block mr-[0.3em] transition-all">
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};
