import React, { useEffect, useRef } from 'react';

/**
 * PixelMosaic — Lightweight dot grid background.
 * Larger cell size, no mouse tracking, simpler color math.
 */
const PixelMosaic = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const COLORS = [
    [124,92,252],[168,85,247],[34,211,238],[59,130,246],
    [236,72,153],[129,140,248],[6,182,212],[192,132,252],
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    const CELL = 24; // larger cells = fewer dots
    let cols, rows, grid;

    const init = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.offsetWidth : window.innerWidth;
      canvas.height = parent ? parent.offsetHeight : window.innerHeight;
      cols = Math.ceil(canvas.width / CELL) + 1;
      rows = Math.ceil(canvas.height / CELL) + 1;
      grid = new Float32Array(cols * rows * 4); // phase, speed, radius, colorIdx
      for (let i = 0; i < cols * rows; i++) {
        const off = i * 4;
        grid[off] = Math.random() * 6.28;     // phase
        grid[off+1] = 0.3 + Math.random() * 0.6; // speed
        grid[off+2] = 1.5 + Math.random() * 2;   // base radius
        grid[off+3] = Math.floor(Math.random() * 8); // color index
      }
    };
    init();
    window.addEventListener('resize', init);

    let t = 0;
    const animate = () => {
      t += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < cols * rows; i++) {
        const off = i * 4;
        const phase = grid[off];
        const speed = grid[off+1];
        const baseR = grid[off+2];
        const ci = grid[off+3];

        const wave = Math.sin(t * speed + phase);
        const r = baseR + wave * 1.2;
        if (r < 0.5) continue;

        const alpha = 0.07 + wave * 0.025;
        const col = i % cols;
        const row = (i / cols) | 0;
        const x = col * CELL;
        const y = row * CELL;

        const c = COLORS[ci];
        ctx.globalAlpha = Math.max(0.02, alpha);
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.fillRect(x - r, y - r, r * 2, r * 2); // squares = faster
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => { window.removeEventListener('resize', init); cancelAnimationFrame(animRef.current); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:-1, opacity:0.5 }} />;
};

export default PixelMosaic;
