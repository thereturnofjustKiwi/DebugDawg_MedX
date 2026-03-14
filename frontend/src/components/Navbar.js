import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut, LogIn, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { activeScreen, setActiveScreen, isDarkMode, toggleDarkMode } = useAppStore();
  const { isAuthenticated, doctor, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handlePillHover = useCallback((e, isEnter, active) => {
    if (active) return;
    const el = e.currentTarget;
    if (isEnter) {
      el.style.transform = 'translateY(-2px) scale(1.05)';
      el.style.borderColor = 'rgba(124,92,252,0.5)';
      el.style.boxShadow = '0 8px 30px rgba(124,92,252,0.3)';
      el.style.background = isDarkMode ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.08)';
    } else {
      el.style.transform = 'translateY(0) scale(1)';
      el.style.borderColor = 'rgba(130,130,255,0.15)';
      el.style.boxShadow = isDarkMode ? '0 4px 14px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.08)';
      el.style.background = isDarkMode ? 'rgba(15,15,35,0.5)' : 'rgba(255,255,255,0.6)';
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navBg = isDarkMode
    ? (scrolled ? 'rgba(5,5,16,0.92)' : 'rgba(5,5,16,0.7)')
    : (scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)');

  const pillBg = isDarkMode ? 'rgba(15,15,35,0.4)' : 'rgba(240,240,255,0.6)';

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 24px',
        background: navBg,
        backdropFilter: 'blur(24px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderBottom: scrolled
          ? `1px solid ${isDarkMode ? 'rgba(130,130,255,0.1)' : 'rgba(130,130,255,0.15)'}`
          : '1px solid transparent',
        transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: scrolled
          ? isDarkMode
            ? '0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(124,92,252,0.05)'
            : '0 4px 24px rgba(100,80,200,0.08)'
          : 'none',
      }}
    >
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 72,
      }}>
        {/* Logo */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 19, fontWeight: 700,
            color: isDarkMode ? '#f0f0ff' : '#1a1040',
            fontFamily: "'Space Grotesk', sans-serif",
            cursor: 'pointer', transition: 'transform 0.3s ease',
          }}
          onClick={() => navigate('/')}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04) translateX(2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateX(0)'; }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c5cfc, #3b82f6, #06b6d4)',
            backgroundSize: '200% 200%', animation: 'gradientRotate 4s ease infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(124,92,252,0.35)',
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <span style={{
            background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>MedX</span>
        </div>

        {/* Center: Navigation pills */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, padding: '4px', borderRadius: 999,
          background: pillBg,
          border: `1px solid ${isDarkMode ? 'rgba(130,130,255,0.08)' : 'rgba(124,92,252,0.12)'}`,
        }}>
          {['upload', 'analysis', 'report'].map((id) => {
            const active = activeScreen === id;
            return (
              <button key={id} type="button"
                onClick={() => {
                  if (!isAuthenticated && id !== 'upload') {
                    navigate('/login');
                    return;
                  }
                  setActiveScreen(id);
                  navigate('/workspace');
                }}
                onMouseEnter={e => handlePillHover(e, true, active)}
                onMouseLeave={e => handlePillHover(e, false, active)}
                style={{
                  padding: '8px 18px', borderRadius: 999,
                  border: active ? '1px solid rgba(124,92,252,0.7)' : '1px solid rgba(130,130,255,0.15)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(56,189,248,0.1))'
                    : isDarkMode ? 'rgba(15,15,35,0.5)' : 'rgba(255,255,255,0.6)',
                  color: active ? (isDarkMode ? '#f0f0ff' : '#5b21b6') : 'var(--text-secondary)',
                  boxShadow: active
                    ? '0 8px 30px rgba(124,92,252,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : isDarkMode ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  transform: active ? 'translateY(-1px)' : 'translateY(0)',
                  fontWeight: active ? 600 : 400,
                  letterSpacing: active ? 0.3 : 0,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {active && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: '20%', right: '20%',
                    height: 2, background: 'linear-gradient(90deg, transparent, #7c5cfc, transparent)',
                    borderRadius: 999,
                  }} />
                )}
                {id === 'upload' ? 'Upload' : id === 'analysis' ? 'Workspace' : 'Report'}
              </button>
            );
          })}
        </div>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* ── Dark / Light toggle ── */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.5)'; e.currentTarget.style.background = 'rgba(124,92,252,0.1)'; }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(130,130,255,0.15)' : 'rgba(130,130,255,0.2)';
              e.currentTarget.style.background = isDarkMode ? 'rgba(15,15,35,0.5)' : 'rgba(255,255,255,0.6)';
            }}
            style={{
              width: 38, height: 38, borderRadius: 11,
              border: `1px solid ${isDarkMode ? 'rgba(130,130,255,0.15)' : 'rgba(130,130,255,0.2)'}`,
              background: isDarkMode ? 'rgba(15,15,35,0.5)' : 'rgba(255,255,255,0.6)',
              color: isDarkMode ? '#a78bfa' : '#7c5cfc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated && doctor ? (
            <>
              {/* Doctor avatar + name */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 14px 6px 6px', borderRadius: 999,
                background: isDarkMode ? 'rgba(15,15,35,0.5)' : 'rgba(240,235,255,0.7)',
                border: `1px solid ${isDarkMode ? 'rgba(130,130,255,0.1)' : 'rgba(130,130,255,0.2)'}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  boxShadow: '0 2px 10px rgba(124,92,252,0.3)',
                }}>
                  {doctor.avatar || doctor.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? '#f0f0ff' : '#1a1040', lineHeight: 1.2 }}>
                    {doctor.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {doctor.specialization || 'Doctor'}
                  </div>
                </div>
              </div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDarkMode ? 'rgba(130,130,255,0.15)' : 'rgba(130,130,255,0.2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                style={{
                  padding: '8px 12px', borderRadius: 10,
                  border: `1px solid ${isDarkMode ? 'rgba(130,130,255,0.15)' : 'rgba(130,130,255,0.2)'}`,
                  background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', transition: 'all 0.3s ease',
                }}
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(124,92,252,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                padding: '8px 18px', borderRadius: 999,
                border: '1px solid rgba(124,92,252,0.4)',
                background: 'rgba(124,92,252,0.08)',
                color: '#a78bfa', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', transition: 'all 0.3s ease',
              }}
            >
              <LogIn size={14} /> Doctor Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;