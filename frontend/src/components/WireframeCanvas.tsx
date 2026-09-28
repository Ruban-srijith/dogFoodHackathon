import React, { useEffect, useRef } from 'react';

export const WireframeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = 420);

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

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

      const centerX = width > 768 ? width * 0.75 : width * 0.5;
      const centerY = height * 0.48;

      nodes.forEach((node) => {
        // Rotate Y
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;

        // Rotate X
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.y * sinX;

        // Perspective projection
        const fov = 400;
        const scale = fov / (fov + z2 + 350);
        const px = x1 * scale + centerX;
        const py = y2 * scale + centerY;

        projectedNodes.push({ x: px, y: py, z: z2 });
      });

      // Draw wireframe edges
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
      ctx.lineWidth = 1;

      edges.forEach(([start, end]) => {
        const p1 = projectedNodes[start];
        const p2 = projectedNodes[end];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw glowing nodes
      projectedNodes.forEach((p, idx) => {
        const nodeColor = idx % 2 === 0 ? '#ff2a5f' : '#00f0ff';
        ctx.fillStyle = nodeColor;

        // Node Glow Halo
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 right-0 w-full h-[420px] pointer-events-none z-0 opacity-85"
    />
  );
};
