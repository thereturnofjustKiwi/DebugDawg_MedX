import React, { useEffect, useRef, useCallback } from 'react';

/**
 * CursorGlow — Pixel mosaic dot grid with wide Antigravity-level spread.
 * Square dots like the original mosaic, but scattered across a huge radius.
 */
const CursorGlow = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const glowRef = useRef({ x: -300, y: -300, tx: -300, ty: -300 });
  const dotsRef = useRef(new Map());
  const lastSpawnRef = useRef(0);

  const COLORS = ['#7c5cfc', '#a855f7', '#22d3ee', '#3b82f6', '#ec4899', '#818cf8', '#06b6d4', '#c084fc'];
  const GRID = 12;
  const RADIUS = 400;

  const onMove = useCallback((e) => {
    glowRef.current.tx = e.clientX;
    glowRef.current.ty = e.clientY;

    const now = Date.now();
    if (now - lastSpawnRef.current < 25) return;
    lastSpawnRef.current = now;

    const cx = e.clientX, cy = e.clientY;
    for (let dx = -RADIUS; dx <= RADIUS; dx += GRID) {
      for (let dy = -RADIUS; dy <= RADIUS; dy += GRID) {
        const d2 = dx * dx + dy * dy;
        if (d2 > RADIUS * RADIUS) continue;
        if (Math.random() > 0.35 * (1 - Math.sqrt(d2) / RADIUS)) continue;

        const gx = Math.round((cx + dx) / GRID) * GRID;
        const gy = Math.round((cy + dy) / GRID) * GRID;
        const key = (gx << 16) | (gy & 0xffff);

        dotsRef.current.set(key, {
          x: gx, y: gy,
          r: 1.5 + 2.5 * (1 - Math.sqrt(d2) / RADIUS),
          life: 1,
          ci: Math.floor(Math.random() * 8),
          dist: Math.sqrt(d2) / RADIUS,  // 0 at center, 1 at edge
        });
      }
    }
    if (dotsRef.current.size > 1200) {
      const iter = dotsRef.current.keys();
      for (let i = 0; i < 300; i++) dotsRef.current.delete(iter.next().value);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [onMove]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const g = glowRef.current;
      g.x += (g.tx - g.x) * 0.1;
      g.y += (g.ty - g.y) * 0.1;

      // Soft radial glow
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 280);
      grad.addColorStop(0, 'rgba(124,92,252,0.10)');
      grad.addColorStop(0.3, 'rgba(124,92,252,0.04)');
      grad.addColorStop(0.6, 'rgba(56,189,248,0.02)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(g.x - 280, g.y - 280, 560, 560);

      // Draw dots
      const dead = [];
      dotsRef.current.forEach((dot, key) => {
        dot.life -= 0.012;
        if (dot.life <= 0) { dead.push(key); return; }
        // Gradient: center bright, edges fade out
        const distFade = 1 - dot.dist * dot.dist; // quadratic falloff
        ctx.globalAlpha = dot.life * 0.2 * distFade;
        ctx.fillStyle = COLORS[dot.ci];
        const s = dot.r * dot.life;
        ctx.fillRect(dot.x - s, dot.y - s, s * 2, s * 2);
      });
      ctx.globalAlpha = 1;
      dead.forEach(k => dotsRef.current.delete(k));

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
};

export default CursorGlow;
