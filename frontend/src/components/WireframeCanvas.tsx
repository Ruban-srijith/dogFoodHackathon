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
    let height = (canvas.height = 360);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = 360;
    };

    window.addEventListener('resize', handleResize);

    // 3D Wireframe Polyhedron Nodes
    let angleX = 0;
    let angleY = 0;

    const nodes = [
      { x: -120, y: -120, z: -120 },
      { x: 120, y: -120, z: -120 },
      { x: 120, y: 120, z: -120 },
      { x: -120, y: 120, z: -120 },
      { x: -120, y: -120, z: 120 },
      { x: 120, y: -120, z: 120 },
      { x: 120, y: 120, z: 120 },
      { x: -120, y: 120, z: 120 },
      { x: 0, y: -180, z: 0 },
      { x: 0, y: 180, z: 0 },
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
      [8, 0], [8, 1], [8, 4], [8, 5],
      [9, 2], [9, 3], [9, 6], [9, 7],
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      angleX += 0.004;
      angleY += 0.006;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const projectedNodes: { x: number; y: number }[] = [];

      const centerX = width > 768 ? width * 0.72 : width * 0.5;
      const centerY = height * 0.45;

      nodes.forEach((node) => {
        // Rotate Y
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;

        // Rotate X
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.y * sinX;

        // Perspective projection
        const fov = 350;
        const scale = fov / (fov + z2 + 300);
        const px = x1 * scale + centerX;
        const py = y2 * scale + centerY;

        projectedNodes.push({ x: px, y: py });
      });

      // Draw wireframe edges
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;

      edges.forEach(([start, end]) => {
        const p1 = projectedNodes[start];
        const p2 = projectedNodes[end];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw node dots
      projectedNodes.forEach((p, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#ff2a5f' : '#00f0ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 right-0 w-full h-[360px] pointer-events-none z-0 opacity-80"
    />
  );
};
