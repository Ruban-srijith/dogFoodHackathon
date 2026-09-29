import React, { useEffect, useRef } from 'react';

export const WireframeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = 420);

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Pause animation when hero is offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouse.targetX = (x / rect.width) * 0.8;
      mouse.targetY = (y / rect.height) * 0.8;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = 420;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // 3D Polyhedron Node Matrix
    let angleX = 0;
    let angleY = 0;

    const nodes = [
      { x: -140, y: -140, z: -140 },
      { x: 140, y: -140, z: -140 },
      { x: 140, y: 140, z: -140 },
      { x: -140, y: 140, z: -140 },
      { x: -140, y: -140, z: 140 },
      { x: 140, y: -140, z: 140 },
      { x: 140, y: 140, z: 140 },
      { x: -140, y: 140, z: 140 },
      { x: 0, y: -220, z: 0 },
      { x: 0, y: 220, z: 0 },
      { x: -220, y: 0, z: 0 },
      { x: 220, y: 0, z: 0 },
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
      [8, 0], [8, 1], [8, 4], [8, 5],
      [9, 2], [9, 3], [9, 6], [9, 7],
      [10, 0], [10, 3], [10, 4], [10, 7],
      [11, 1], [11, 2], [11, 5], [11, 6],
    ];

    const render = () => {
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse parallax lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      angleX += 0.005 + mouse.y * 0.01;
      angleY += 0.007 + mouse.x * 0.01;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const projectedNodes: { x: number; y: number; z: number }[] = [];
      const cx = width * 0.72;
      const cy = height * 0.52;
      const fov = 380;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Rotate Y
        const x1 = n.x * cosY + n.z * sinY;
        const z1 = -n.x * sinY + n.z * cosY;

        // Rotate X
        const y2 = n.y * cosX - z1 * sinX;
        const z2 = n.y * sinX + z1 * cosX;

        const distance = fov / (fov + z2 + 200);
        projectedNodes.push({
          x: cx + x1 * distance,
          y: cy + y2 * distance,
          z: z2,
        });
      }

      // Draw wireframe edges
      ctx.lineWidth = 1;
      edges.forEach(([i1, i2]) => {
        const p1 = projectedNodes[i1];
        const p2 = projectedNodes[i2];
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.12, Math.min(0.7, (avgZ + 180) / 360));

        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw lightweight glowing nodes without costly software shadowBlur
      projectedNodes.forEach((p, idx) => {
        const nodeColor = idx % 2 === 0 ? '#ff2a5f' : '#00f0ff';
        const haloColor = idx % 2 === 0 ? 'rgba(255, 42, 95, 0.25)' : 'rgba(0, 240, 255, 0.25)';

        // Outer glow halo
        ctx.fillStyle = haloColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner solid core
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 right-0 w-full h-[420px] pointer-events-none z-0 opacity-85"
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
    />
  );
};
