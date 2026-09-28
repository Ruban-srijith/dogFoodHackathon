import React, { useEffect, useState } from 'react';

export const Cursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
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

      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-cursor]')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
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

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block select-none">
      {/* Precision Core Dot */}
      <div
        className={`fixed top-0 left-0 w-2 h-2 rounded-full bg-[var(--accent-red)] shadow-[0_0_10px_var(--accent-red)] transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 ${
          isClicking ? 'scale-150' : 'scale-100'
        }`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      />

      {/* Trailing Outer Ring */}
      <div
        className={`fixed top-0 left-0 rounded-full transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2 border border-[var(--accent-cyan)]/50 ${
          isHovering
            ? 'w-10 h-10 bg-[var(--accent-cyan)]/10 scale-125'
            : isClicking
            ? 'w-6 h-6 scale-90'
            : 'w-8 h-8 bg-transparent'
        }`}
        style={{ transform: `translate3d(${followerPos.x}px, ${followerPos.y}px, 0)` }}
      />
    </div>
  );
};
