import React from 'react';
import { Twitter, Linkedin, Github, Activity } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(130,130,255,0.08)',
        padding: '40px 24px 48px',
        background: 'rgba(5,5,16,0.95)',
        marginTop: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top gradient line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(56,189,248,0.3), transparent)',
      }} />

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          fontSize: 13,
          color: 'var(--text-tertiary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(56,189,248,0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Activity size={14} color="#a78bfa" />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>ExplainableMed</span>
          <span>© {year} Prototype for transparent medical AI.</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <a
            href="#privacy"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            Privacy & data use
          </a>
          <a
            href="#terms"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            Responsible AI
          </a>
          <div
            style={{
              width: 1,
              height: 16,
              background: 'rgba(130,130,255,0.1)',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {[
              { Icon: Twitter, color: '#1DA1F2' },
              { Icon: Linkedin, color: '#0A66C2' },
              { Icon: Github, color: '#a78bfa' },
            ].map(({ Icon, color }, i) => (
              <button
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: '1px solid rgba(130,130,255,0.1)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${color}50`;
                  e.currentTarget.style.color = color;
                  e.currentTarget.style.background = `${color}10`;
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.1)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${color}25`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(130,130,255,0.1)';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
