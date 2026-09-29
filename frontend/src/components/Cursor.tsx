import React, { useEffect, useRef } from 'react';

export const Cursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect Touch Devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let isClicking = false;
    let isHoveringInteractive = false;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) ${
          isClicking ? 'scale(1.4)' : 'scale(1)'
        }`;
      }

      // Check interactive targets
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        Boolean(target.closest('button, a, input, select, [role="button"], .cursor-pointer'));

      if (isInteractive !== isHoveringInteractive) {
        isHoveringInteractive = isInteractive;
        if (ringRef.current) {
          if (isHoveringInteractive) {
            ringRef.current.style.borderColor = 'rgba(167, 139, 250, 0.7)';
            ringRef.current.style.backgroundColor = 'rgba(167, 139, 250, 0.12)';
          } else {
            ringRef.current.style.borderColor = 'rgba(167, 139, 250, 0.3)';
            ringRef.current.style.backgroundColor = 'transparent';
          }
        }
      }
    };

    const onMouseDown = () => {
      isClicking = true;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(1.4)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(0.85)`;
      }
    };

    const onMouseUp = () => {
      isClicking = false;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(1)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${
          isHoveringInteractive ? '1.2' : '1'
        })`;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });

    // 90fps+ Hardware accelerated lerp loop with direct GPU transform
    const render = () => {
      // Smooth lerp factor (0.2 for snappy 90-120fps response)
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${
          isClicking ? '0.85' : isHoveringInteractive ? '1.2' : '1'
        })`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block select-none">
      {/* Precision Core Dot - GPU Composited */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#A78BFA] shadow-[0_0_8px_#A78BFA] pointer-events-none"
        style={{ willChange: 'transform', transform: 'translate3d(-100px, -100px, 0)' }}
      />

      {/* Trailing Outer Ring - GPU Composited */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-7 h-7 rounded-full border border-[#A78BFA]/30 pointer-events-none transition-colors duration-150"
        style={{ willChange: 'transform', transform: 'translate3d(-100px, -100px, 0)' }}
      />
    </div>
  );
};
