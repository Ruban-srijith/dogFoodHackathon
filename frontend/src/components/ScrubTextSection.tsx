import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrubTextSectionProps {
  label: string;
  statement: string;
}

export const ScrubTextSection: React.FC<ScrubTextSectionProps> = ({ label, statement }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const words = textRef.current.querySelectorAll('.scrub-word');

    const anim = gsap.fromTo(
      words,
      { color: '#475569', opacity: 0.3 },
      {
        color: '#ffffff',
        opacity: 1,
        stagger: 0.05,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: 0.6,
        },
      }
    );

    return () => {
      anim.kill();
    };
  }, []);

  const words = statement.split(' ');

  return (
    <section ref={containerRef} className="py-24 px-4 text-center border-b border-cyan-500/20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-500">
          [ {label} ]
        </div>
        <p ref={textRef} className="font-serif text-2xl sm:text-4xl lg:text-5xl font-light leading-snug">
          {words.map((word, i) => (
            <span key={i} className="scrub-word inline-block mr-[0.25em]">
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};
