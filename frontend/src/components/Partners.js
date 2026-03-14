import React, { useState } from 'react';
import { Building2, Landmark, Globe2, Cpu, Shield, Boxes } from 'lucide-react';

const Partners = () => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const partners = [
    { name: 'Teaching Hospitals', icon: <Building2 size={22} />, color: '#7c5cfc' },
    { name: 'Radiology Labs', icon: <Cpu size={22} />, color: '#3b82f6' },
    { name: 'Academic Centers', icon: <Landmark size={22} />, color: '#06b6d4' },
    { name: 'AI Research Groups', icon: <Globe2 size={22} />, color: '#10b981' },
    { name: 'Regulatory Sandboxes', icon: <Shield size={22} />, color: '#ec4899' },
    { name: 'Digital Health Startups', icon: <Boxes size={22} />, color: '#f59e0b' },
  ];

  // Duplicate for infinite scroll
  const allPartners = [...partners, ...partners];

  return (
    <section style={{
      padding: '80px 24px',
      borderTop: '1px solid rgba(130,130,255,0.06)',
      borderBottom: '1px solid rgba(130,130,255,0.06)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Gradient edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 120,
        background: 'linear-gradient(90deg, var(--bg-primary), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 120,
        background: 'linear-gradient(270deg, var(--bg-primary), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{
          textAlign: 'center',
          fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: 3, color: 'var(--text-tertiary)', marginBottom: 44,
        }}>
          Built for clinical teams and researchers
        </p>

        {/* Marquee container */}
        <div style={{
          display: 'flex',
          animation: 'marquee 30s linear infinite',
          width: 'max-content',
        }}>
          {allPartners.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 32px',
                  marginRight: 24,
                  borderRadius: 16,
                  background: isHovered ? 'rgba(130,130,255,0.06)' : 'transparent',
                  border: `1px solid ${isHovered ? `${p.color}30` : 'transparent'}`,
                  color: isHovered ? p.color : 'var(--text-tertiary)',
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  cursor: 'default',
                  transform: isHovered ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
                  boxShadow: isHovered ? `0 15px 40px ${p.color}15` : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  transition: 'transform 0.3s ease',
                  transform: isHovered ? 'rotate(-10deg) scale(1.15)' : 'rotate(0) scale(1)',
                }}>
                  {p.icon}
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: isHovered ? '#f0f0ff' : 'var(--text-tertiary)',
                  transition: 'color 0.3s ease',
                }}>
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Partners;