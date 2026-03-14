import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Solutions from './pages/Solutions';
import Contact from './pages/Contact';
import UploadScreen from './components/UploadScreen';
import AnalysisWorkspace from './components/AnalysisWorkspace';
import ReportView from './components/ReportView';
import DoctorLogin from './components/DoctorLogin';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';
import CursorGlow from './components/CursorGlow';
import NeonRays from './components/NeonRays';

/* ========================================================================
   NEURAL PRELOADER — animated brain network with synapse firing
   ======================================================================== */
function NeuralPreloader({ onFinish }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading');

  const drawNetwork = useCallback((ctx, w, h, t, prog) => {
    ctx.clearRect(0, 0, w, h);
    const nodes = [];
    const nodeCount = 48;
    const cx = w / 2;
    const cy = h / 2;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 + Math.sin(t * 0.3 + i) * 0.15;
      const layer = Math.floor(i / 12);
      const baseR = 50 + layer * 55;
      const wobble = Math.sin(t * 0.5 + i * 0.8) * 12;
      const r = baseR + wobble;
      nodes.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        layer,
        pulse: Math.sin(t * 2.5 + i * 0.6) * 0.5 + 0.5,
        active: (prog / 100) > (i / nodeCount),
      });
    }

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + t * 0.2;
      nodes.push({
        x: cx + Math.cos(angle) * 22,
        y: cy + Math.sin(angle) * 22,
        layer: -1,
        pulse: Math.sin(t * 3 + i * 1.2) * 0.5 + 0.5,
        active: true,
      });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const bothActive = nodes[i].active && nodes[j].active;
          const signalPos = ((t * 80 + i * 30) % dist) / dist;
          const alpha = bothActive ? 0.15 + nodes[i].pulse * 0.2 : 0.03;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = bothActive ? `rgba(124,92,252,${alpha})` : `rgba(100,100,180,${alpha})`;
          ctx.lineWidth = bothActive ? 1.5 : 0.5;
          ctx.stroke();

          if (bothActive && Math.random() > 0.92) {
            const sx = nodes[i].x + dx * signalPos;
            const sy = nodes[i].y + dy * signalPos;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56,189,248,0.8)';
            ctx.fill();
          }
        }
      }
    }

    nodes.forEach((node) => {
      const glowSize = node.active ? 12 + node.pulse * 10 : 4;
      const coreSize = node.active ? node.layer === -1 ? 5 : 3.5 : 2;
      if (node.active) {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
        const hue = node.layer === -1 ? 'rgba(236,72,153,' : node.layer < 2 ? 'rgba(124,92,252,' : 'rgba(56,189,248,';
        gradient.addColorStop(0, hue + (0.3 * node.pulse) + ')');
        gradient.addColorStop(1, hue + '0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = node.active
        ? node.layer === -1
          ? `rgba(236,72,153,${0.6 + node.pulse * 0.4})`
          : `rgba(167,139,250,${0.5 + node.pulse * 0.5})`
        : 'rgba(100,100,180,0.2)';
      ctx.fill();
    });

    const centralGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + Math.sin(t) * 10);
    centralGlow.addColorStop(0, `rgba(124,92,252,${0.12 + Math.sin(t * 2) * 0.06})`);
    centralGlow.addColorStop(0.5, `rgba(56,189,248,${0.04 + Math.sin(t * 1.5) * 0.02})`);
    centralGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 60 + Math.sin(t) * 10, 0, Math.PI * 2);
    ctx.fillStyle = centralGlow;
    ctx.fill();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame;
    let startTime = Date.now();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const prog = Math.min(100, elapsed * 33);
      setProgress(Math.round(prog));
      drawNetwork(ctx, canvas.width, canvas.height, elapsed, prog);
      if (prog >= 100) {
        setPhase('fadeout');
        setTimeout(() => { setPhase('done'); onFinish(); }, 800);
      } else {
        frame = requestAnimationFrame(loop);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, [drawNetwork, onFinish]);

  if (phase === 'done') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#050510',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fadeout' ? 0 : 1, transition: 'opacity 0.8s ease-out',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      {/* Content sits in the lower half, well clear of the fixed navbar (72px) */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', paddingTop: 100, width: '100%' }}>
        <div style={{
          fontSize: 36, fontWeight: 800, marginBottom: 12,
          fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #7c5cfc, #a855f7, #22d3ee)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'gradientRotate 3s ease infinite',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 20px rgba(124,92,252,0.4))',
          }}>ExplainableMed</span>
        </div>
        <div style={{
          fontSize: 12, color: 'rgba(167,139,250,0.5)',
          letterSpacing: 4, textTransform: 'uppercase', marginBottom: 36,
          fontWeight: 500,
        }}>Transparent Medical AI</div>
        <div style={{
          width: 280, height: 4, borderRadius: 999,
          background: 'rgba(130,130,255,0.06)', overflow: 'hidden', margin: '0 auto',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, #7c5cfc, #22d3ee, #ec4899)',
            backgroundSize: '200% 100%', animation: 'gradientRotate 2s ease infinite',
            width: `${progress}%`, transition: 'width 0.3s ease',
            boxShadow: '0 0 16px rgba(124,92,252,0.5), 0 0 32px rgba(34,211,238,0.2)',
          }} />
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(130,130,255,0.35)',
          marginTop: 16, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 1,
        }}>
          {progress < 25
            ? '◈ Initializing neural pathways…'
            : progress < 50
            ? '◈ Loading medical classification models…'
            : progress < 75
            ? '◈ Calibrating explainable AI engine…'
            : '◈ Preparing diagnostic workspace…'
          }
          {'  '}{progress}%
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   ANALYSIS LOADING — neurological scan animation
   ======================================================================== */
function AnalysisLoader() {
  const canvasRef = useRef(null);
  const [statusText, setStatusText] = useState('Preparing image tensor…');
  const isDarkMode = useAppStore(s => s.isDarkMode);

  useEffect(() => {
    const statuses = [
      'Preparing image tensor…', 'Running classification model…',
      'Computing Grad-CAM heatmap…', 'Extracting SHAP attributions…',
      'Generating clinical narrative…', 'Finalizing explainable outputs…',
    ];
    let idx = 0;
    const interval = setInterval(() => { idx = (idx + 1) % statuses.length; setStatusText(statuses[idx]); }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const t = Date.now() / 1000;
      const w = canvas.width; const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2; const cy = h / 2;
      for (let ring = 0; ring < 5; ring++) {
        const r = 40 + ring * 40 + Math.sin(t * 1.5 + ring) * 8;
        const alpha = 0.08 + Math.sin(t * 2 + ring * 0.8) * 0.05;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ring % 2 === 0 ? `rgba(124,92,252,${alpha})` : `rgba(56,189,248,${alpha})`;
        ctx.lineWidth = 1; ctx.stroke();
        const arcStart = t * (0.5 + ring * 0.15) + ring;
        ctx.beginPath(); ctx.arc(cx, cy, r, arcStart, arcStart + 0.8);
        ctx.strokeStyle = ring % 2 === 0
          ? `rgba(124,92,252,${0.4 + Math.sin(t * 3) * 0.2})`
          : `rgba(56,189,248,${0.4 + Math.sin(t * 3 + 1) * 0.2})`;
        ctx.lineWidth = 2; ctx.stroke();
      }
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + t * 0.3;
        const dist = 80 + Math.sin(t + i * 0.7) * 60;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const size = 1.5 + Math.sin(t * 2 + i) * 1;
        ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0
          ? `rgba(236,72,153,${0.3 + Math.sin(t * 2.5 + i) * 0.3})`
          : `rgba(124,92,252,${0.2 + Math.sin(t * 2 + i) * 0.2})`;
        ctx.fill();
      }
      for (let i = 0; i < 24; i++) {
        const y = cy - 100 + i * 9;
        const xOff1 = Math.sin(t * 2 + i * 0.4) * 16;
        const xOff2 = Math.sin(t * 2 + i * 0.4 + Math.PI) * 16;
        const alpha = 0.25 + Math.sin(t * 3 + i * 0.5) * 0.15;
        ctx.beginPath(); ctx.arc(cx + xOff1, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124,92,252,${alpha})`; ctx.fill();
        ctx.beginPath(); ctx.arc(cx + xOff2, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${alpha})`; ctx.fill();
        if (i % 3 === 0) {
          ctx.beginPath(); ctx.moveTo(cx + xOff1, y); ctx.lineTo(cx + xOff2, y);
          ctx.strokeStyle = `rgba(130,130,255,${alpha * 0.4})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      backgroundColor: isDarkMode ? '#050510' : '#f0eeff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Text block — always clears the 72px fixed navbar */}
      <div style={{
        position: 'absolute', top: 90, left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center',
        zIndex: 2, whiteSpace: 'nowrap',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: isDarkMode ? '#c4b5fd' : '#5b21b6',
          marginBottom: 6, letterSpacing: 0.5,
          animation: 'fadeInUp 0.4s ease both',
        }}>{statusText}</div>
        <div style={{
          fontSize: 10,
          color: isDarkMode ? 'rgba(130,130,255,0.4)' : 'rgba(91,33,182,0.45)',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
        }}>ExplainableMed · AI Pipeline Running</div>
      </div>

      {/* Spinner — centered below animation rings */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: 280 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid rgba(130,130,255,0.08)',
          borderTopColor: '#7c5cfc', borderRightColor: '#22d3ee',
          animation: 'spinSlow 1.2s linear infinite',
        }} />
      </div>
    </div>
  );
}

/* ========================================================================
   AUTH GUARD — redirects to /login if not authenticated
   ======================================================================== */
function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

/* ========================================================================
   WORKSPACE SHELL
   ======================================================================== */
function WorkspaceShell() {
  const { activeScreen, isLoading } = useAppStore();

  if (isLoading && activeScreen === 'analysis') {
    return <AnalysisLoader />;
  }

  if (activeScreen === 'upload') return <UploadScreen />;
  if (activeScreen === 'analysis') return <AnalysisWorkspace />;
  return <ReportView />;
}

/* ========================================================================
   APP
   ======================================================================== */
function App() {
  const [loaded, setLoaded] = useState(false);
  const activeScreen = useAppStore(s => s.activeScreen);
  const isDarkMode = useAppStore(s => s.isDarkMode);
  const isWorkspaceScreen = activeScreen === 'report' || activeScreen === 'analysis';

  return (
    <Router>
      {!loaded && <NeuralPreloader onFinish={() => setLoaded(true)} />}
      <div
        className="App"
        data-theme={isDarkMode ? 'dark' : 'light'}
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        {loaded && !isWorkspaceScreen && <CursorGlow />}
        {loaded && !isWorkspaceScreen && <NeonRays />}
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<DoctorLogin />} />
          <Route path="/workspace" element={
            <RequireAuth>
              <WorkspaceShell />
            </RequireAuth>
          } />
        </Routes>
        {!isWorkspaceScreen && <Footer />}
      </div>
    </Router>
  );
}

export default App;