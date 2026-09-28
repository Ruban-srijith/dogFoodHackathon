import React, { useEffect, useState } from 'react';

export const Cursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [hoverText, setHoverText] = useState<string | null>(null);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect Touch Devices (Disable custom cursor on mobile touch screens)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Check target elements for cursor states
      const target = e.target as HTMLElement;
      if (!target) return;

      const projectCard = target.closest('[data-cursor-text]');
      if (projectCard) {
        const text = projectCard.getAttribute('data-cursor-text') || 'VIEW';
        setHoverText(text);
      } else if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setHoverText('');
      } else {
        setHoverText(null);
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Smooth follower lerp physics (factor ~0.15)
    let currentX = -100;
    let currentY = -100;
    let animFrame: number;

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

  if (isTouchDevice) return null;

  const isCardHover = hoverText !== null && hoverText !== '';
  const isLinkHover = hoverText === '';

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block select-none">
      {/* Precision Core Dot */}
      <div
        className={`fixed top-0 left-0 w-2 h-2 rounded-full bg-[#ff2a5f] shadow-[0_0_10px_#ff2a5f] transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 ${
          isClicking ? 'scale-150' : 'scale-100'
        }`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      />

      {/* Trailing Outer Ring / Card Media Circle */}
      <div
        className={`fixed top-0 left-0 rounded-full flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2 ${
          isCardHover
            ? 'w-16 h-16 bg-[#ff2a5f] text-white shadow-[0_0_25px_rgba(255,42,95,0.5)] border-none scale-110'
            : isLinkHover
            ? 'w-12 h-12 border border-cyan-400 bg-cyan-500/10 backdrop-blur-[1px] scale-110'
            : isClicking
            ? 'w-8 h-8 border border-rose-500 scale-90'
            : 'w-10 h-10 border border-cyan-400/40 bg-cyan-500/5'
        }`}
        style={{ transform: `translate3d(${followerPos.x}px, ${followerPos.y}px, 0)` }}
      >
        {isCardHover && hoverText}
      </div>
    </div>
  );
};
