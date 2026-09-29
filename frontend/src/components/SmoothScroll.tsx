import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // CRITICAL: Overwrite native browser smooth scrolling so it never fights Lenis RAF
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');

    // Initialize Lenis Smooth Scroll Engine calibrated for ultra-smooth 90Hz / 120Hz
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    // Disable lagSmoothing (set to 0) to avoid abrupt frame clamping during scroll
    gsap.ticker.lagSmoothing(0);

    return () => {
      document.documentElement.style.scrollBehavior = '';
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};
