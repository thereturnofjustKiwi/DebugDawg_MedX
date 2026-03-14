import React, { useEffect, useRef } from 'react';

/**
 * NeonRays — Lightweight animated neon beams.
 * Reduced to 5 rays with simpler math for better performance.
 */
const NeonRays = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const RAYS = [
      { angle: 0.3, speed: 0.003, width: 120, alpha: 0.035, r: 124, g: 92, b: 252 },
      { angle: 1.2, speed: 0.004, width: 100, alpha: 0.025, r: 168, g: 85, b: 247 },
      { angle: 2.5, speed: 0.002, width: 150, alpha: 0.03, r: 34, g: 211, b: 238 },
      { angle: 3.8, speed: 0.0035, width: 90, alpha: 0.025, r: 59, g: 130, b: 246 },
      { angle: 5.0, speed: 0.0025, width: 110, alpha: 0.03, r: 236, g: 72, b: 153 },
    ];

    let t = 0;

    const animate = () => {
      t++;
      const w = canvas.width, h = canvas.height;
      const cx = w * 0.5, cy = h * 0.5;
      const len = Math.sqrt(w * w + h * h) * 1.2;

      ctx.clearRect(0, 0, w, h);

      for (const ray of RAYS) {
        ray.angle += ray.speed;
        const a = ray.angle + Math.sin(t * 0.005) * 0.1;
        const cosA = Math.cos(a), sinA = Math.sin(a);
        const ex = cx + cosA * len, ey = cy + sinA * len;
        const px = -sinA, py = cosA;
        const hw = ray.width * 0.5;
        const alph = ray.alpha * (0.7 + Math.sin(t * 0.008 + ray.angle) * 0.3);

        const grad = ctx.createLinearGradient(cx, cy, ex, ey);
        grad.addColorStop(0, `rgba(${ray.r},${ray.g},${ray.b},0)`);
        grad.addColorStop(0.2, `rgba(${ray.r},${ray.g},${ray.b},${alph})`);
        grad.addColorStop(0.6, `rgba(${ray.r},${ray.g},${ray.b},${alph * 0.5})`);
        grad.addColorStop(1, `rgba(${ray.r},${ray.g},${ray.b},0)`);

        ctx.beginPath();
        ctx.moveTo(cx + px * hw, cy + py * hw);
        ctx.lineTo(cx - px * hw, cy - py * hw);
        ctx.lineTo(ex - px * hw * 0.2, ey - py * hw * 0.2);
        ctx.lineTo(ex + px * hw * 0.2, ey + py * hw * 0.2);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:0.6 }} />;
};

export default NeonRays;
