import React, { useEffect, useRef } from 'react';

export const WaveformVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let step = 0;

    const width = (canvas.width = 300);
    const height = (canvas.height = 40);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += 0.05;

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#00f0ff';

      for (let x = 0; x < width; x += 4) {
        const y =
          Math.sin(x * 0.05 + step) * 8 +
          Math.cos(x * 0.1 - step * 1.5) * 4 +
          height / 2;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Secondary Hot Pink sine wave
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 42, 95, 0.7)';

      for (let x = 0; x < width; x += 4) {
        const y =
          Math.cos(x * 0.08 - step * 1.2) * 6 +
          Math.sin(x * 0.03 + step * 2) * 5 +
          height / 2;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrame);
  }, []);

  return <canvas ref={canvasRef} className="w-[300px] h-[40px] opacity-80" />;
};
