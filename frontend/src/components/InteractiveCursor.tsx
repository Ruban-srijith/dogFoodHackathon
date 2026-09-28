import React, { useEffect, useState } from 'react';

export const InteractiveCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    let animFrame: number;

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Check if hovering over interactive element
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button') ||
          target.closest('a') ||
          target.classList.contains('theme-card') ||
          target.getAttribute('role') === 'button')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Smooth follower physics loop
    let currentX = -100;
    let currentY = -100;

    const loop = () => {
      currentX += (pos.x - currentX) * 0.15;
      currentY += (pos.y - currentY) * 0.15;
      setFollowerPos({ x: currentX, y: currentY });
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animFrame);
    };
  }, [pos.x, pos.y]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block">
      {/* Precision Core Point */}
      <div
        className={`fixed top-0 left-0 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#ff2a5f] transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 ${
          isClicking ? 'scale-150' : 'scale-100'
        }`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      />

      {/* Lagging Glowing Outer Ring (Immersive Garden Style) */}
      <div
        className={`fixed top-0 left-0 rounded-full border border-cyan-400/40 bg-cyan-500/10 backdrop-blur-[1px] transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2 ${
          isHovered
            ? 'w-14 h-14 border-rose-500/60 bg-rose-500/15 scale-110 shadow-[0_0_20px_rgba(255,42,95,0.3)]'
            : isClicking
            ? 'w-8 h-8 border-cyan-400 scale-90'
            : 'w-10 h-10 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
        }`}
        style={{ transform: `translate3d(${followerPos.x}px, ${followerPos.y}px, 0)` }}
      />
    </div>
  );
};
