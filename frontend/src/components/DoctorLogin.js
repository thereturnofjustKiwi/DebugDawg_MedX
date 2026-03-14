import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Stethoscope, ArrowRight, Eye, EyeOff } from 'lucide-react';

const PARTICLES = Array.from({ length: 20 }).map((_, i) => ({
  size: 2 + ((i * 5) % 6),
  top: 5 + (Math.floor(i / 5)) * 20 + (i % 4) * 5,
  left: 5 + (i % 5) * 18 + ((i * 3) % 10),
  duration: 12 + (i % 5) * 3,
  delay: (i % 8) * 0.6,
  color: i % 3 === 0 ? 'rgba(124,92,252,0.35)' : i % 3 === 1 ? 'rgba(56,189,248,0.35)' : 'rgba(16,185,129,0.3)',
}));

const DoctorLogin = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate brief network delay
    await new Promise(r => setTimeout(r, 600));

    let result;
    if (mode === 'login') {
      result = login(email, password);
    } else {
      if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
      result = register(name, email, password, specialization);
    }

    setLoading(false);
    if (result.success) {
      navigate('/workspace');
    } else {
      setError(result.error);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 18px 14px 48px',
    borderRadius: 14,
    border: '1px solid rgba(130,130,255,0.12)',
    background: 'rgba(12,12,30,0.8)',
    color: '#f0f0ff',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const iconWrap = {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(167,139,250,0.5)',
    pointerEvents: 'none',
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
    }}>
      {/* Particle background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {PARTICLES.map((p, idx) => (
          <div key={idx} style={{
            position: 'absolute', top: `${p.top}%`, left: `${p.left}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.color, filter: 'blur(1px)',
            animation: `particleDrift ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.08), transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
        animation: 'morphBlob 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '15%', width: 350, height: 350,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.06), transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
        animation: 'morphBlob 25s ease-in-out infinite reverse',
      }} />

      {/* Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 440,
        borderRadius: 28,
        background: 'rgba(12,12,30,0.88)',
        border: '1px solid rgba(130,130,255,0.1)',
        backdropFilter: 'blur(40px)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 60px rgba(124,92,252,0.06)',
        padding: '48px 40px 40px',
        animation: 'fadeInUp 0.7s ease both',
      }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.4), transparent)',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'linear-gradient(135deg, #7c5cfc, #3b82f6, #06b6d4)',
            backgroundSize: '200% 200%',
            animation: 'gradientRotate 4s ease infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 30px rgba(124,92,252,0.35)',
          }}>
            <Activity size={26} color="#fff" />
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            marginBottom: 6,
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #f0f0ff, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>ExplainableMed</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', letterSpacing: 1 }}>
            {mode === 'login' ? 'Doctor Portal Login' : 'Create Doctor Account'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: 13, textAlign: 'center',
            animation: 'fadeInUp 0.3s ease both',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><User size={18} /></span>
                <input
                  type="text" placeholder="Full Name (e.g. Dr. John Smith)"
                  value={name} onChange={e => setName(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,92,252,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><Stethoscope size={18} /></span>
                <input
                  type="text" placeholder="Specialization (e.g. Radiology)"
                  value={specialization} onChange={e => setSpecialization(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,92,252,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <span style={iconWrap}><Mail size={18} /></span>
            <input
              type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,92,252,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <span style={iconWrap}><Lock size={18} /></span>
            <input
              type={showPassword ? 'text' : 'password'} placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              required minLength={4}
              style={{ ...inputStyle, paddingRight: 48 }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,92,252,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'rgba(167,139,250,0.5)',
                cursor: 'pointer', padding: 4,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'login' && (
            <div style={{
              fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 14px',
              borderRadius: 10, background: 'rgba(130,130,255,0.03)',
              border: '1px solid rgba(130,130,255,0.06)',
            }}>
              💡 Demo: <strong style={{ color: '#a78bfa' }}>doctor@explainablemed.com</strong> / <strong style={{ color: '#a78bfa' }}>demo1234</strong>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px 24px', borderRadius: 16, border: 'none',
              fontSize: 15, fontWeight: 700, color: '#020617',
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7, #3b82f6)',
              backgroundSize: '200% 200%',
              animation: 'gradientRotate 4s ease infinite',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 30px rgba(124,92,252,0.3)',
              transition: 'all 0.3s ease',
              marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(124,92,252,0.45)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,92,252,0.3)'; }}
          >
            {loading ? (
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'spinSlow 0.8s linear infinite',
              }} />
            ) : (
              <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-tertiary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none', color: '#a78bfa',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default DoctorLogin;
