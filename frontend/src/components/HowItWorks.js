import React, { useState } from 'react';
import { Upload, Settings, ShieldCheck, BarChart3, CheckCircle2, ChevronRight } from 'lucide-react';

const HowItWorks = () => {
  const [active, setActive] = useState(0);
  const steps = [
    {
      icon: <Upload size={24} />,
      number: '01',
      title: 'Upload medical image',
      description:
        'Drag and drop a chest X‑ray or dermoscopy image and optionally add patient age and gender for richer context.',
      details: ['JPG / PNG support', 'Optional clinical metadata', 'Secure upload channel', 'Instant preview'],
      color: '#7c5cfc',
    },
    {
      icon: <Settings size={24} />,
      number: '02',
      title: 'Run explainable analysis',
      description:
        'The model generates a diagnosis, confidence score, Grad‑CAM heatmap, SHAP contributions, and an LLM‑powered narrative.',
      details: ['Diagnosis + confidence', 'Severity scoring', 'Grad‑CAM + SHAP outputs', 'LLM clinical summary'],
      color: '#3b82f6',
    },
    {
      icon: <ShieldCheck size={24} />,
      number: '03',
      title: 'Inspect what the AI saw',
      description:
        'Use the workspace to explore overlays, adjust heatmap opacity, and compare original vs. explanation side by side.',
      details: ['View mode toggles', 'Opacity and colormaps', 'Consensus badge', 'Clinician‑first layout'],
      color: '#06b6d4',
    },
    {
      icon: <BarChart3 size={24} />,
      number: '04',
      title: 'Share a printable report',
      description:
        'Export a PDF that combines images, explanations, SHAP chart, and narrative for documentation or case discussions.',
      details: ['One‑click report view', 'Printable white layout', 'Embedded charts', 'Clear disclaimer text'],
      color: '#10b981',
    },
  ];

  return (
    <section className="hiw-section" style={{
      padding: '140px 24px',
      background: 'rgba(8,8,20,0.6)',
      borderTop: '1px solid rgba(130,130,255,0.06)',
      borderBottom: '1px solid rgba(130,130,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orb */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '-10%',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        animation: 'orbFloat2 25s ease-in-out infinite',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 18px', borderRadius: 9999,
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
            marginBottom: 24, fontSize: 13, fontWeight: 600, color: '#22d3ee',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#06b6d4',
              boxShadow: '0 0 8px rgba(6,182,212,0.6)',
            }} />
            How It Works
          </div>
          <h2 style={{
            fontSize: 'clamp(32px,4vw,56px)', fontWeight: 800,
            fontFamily: "'Space Grotesk',sans-serif", marginBottom: 24,
            letterSpacing: '-0.025em', lineHeight: 1.08,
          }}>
            From image upload to{' '}
            <span style={{
              background: 'linear-gradient(135deg,#06b6d4,#3b82f6,#7c5cfc)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientRotate 5s ease infinite',
            }}>explainable report</span>
          </h2>
          <p style={{
            fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560,
            margin: '0 auto', lineHeight: 1.75,
          }}>
            Four simple steps to turn raw medical images into transparent AI outputs
            that clinicians can interrogate and trust.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr',
          gap: 40,
          alignItems: 'start',
        }} className="hiw-grid">
          {/* Step selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((s, i) => {
              const isActive = active === i;
              return (
                <div
                  key={i}
                  className="hiw-step"
                  onClick={() => setActive(i)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(130,130,255,0.04)';
                      e.currentTarget.style.transform = 'translateX(6px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                  style={{
                    padding: '22px 24px',
                    borderRadius: 16,
                    background: isActive ? `${s.color}10` : 'transparent',
                    border: `1px solid ${isActive ? `${s.color}35` : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left animated bar */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    bottom: '15%',
                    width: 3,
                    borderRadius: 999,
                    background: isActive ? s.color : 'transparent',
                    boxShadow: isActive ? `0 0 10px ${s.color}60` : 'none',
                    transition: 'all 0.4s ease',
                  }} />

                  <span style={{
                    fontSize: 14, fontWeight: 800,
                    color: isActive ? s.color : 'var(--text-tertiary)',
                    fontFamily: "'Space Grotesk',sans-serif",
                    transition: 'color 0.3s ease',
                  }}>{s.number}</span>

                  <h4 style={{
                    fontSize: 15, fontWeight: 600,
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    transition: 'color 0.3s ease',
                  }}>{s.title}</h4>

                  {isActive && (
                    <ChevronRight size={16} color={s.color} style={{ marginLeft: 'auto' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail card with 3D entrance */}
          <div className="hiw-detail-card" style={{
            padding: 48,
            borderRadius: 24,
            background: 'rgba(12,12,30,0.85)',
            border: '1px solid rgba(130,130,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 400,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            transition: 'all 0.4s ease',
          }}>
            {/* Background glow */}
            <div style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `${steps[active].color}08`,
              filter: 'blur(80px)',
              pointerEvents: 'none',
              transition: 'background 0.5s ease',
            }} />

            {/* Bottom border glow */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '10%',
              right: '10%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${steps[active].color}50, transparent)`,
              transition: 'background 0.5s ease',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Icon with glow ring */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: `${steps[active].color}10`,
                border: `1px solid ${steps[active].color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: steps[active].color,
                marginBottom: 32,
                boxShadow: `0 10px 30px ${steps[active].color}15`,
                transition: 'all 0.4s ease',
                animation: 'fadeInScale 0.5s ease both',
              }}>{steps[active].icon}</div>

              <h3 style={{
                fontSize: 30, fontWeight: 700, marginBottom: 18,
                fontFamily: "'Space Grotesk',sans-serif",
              }}>{steps[active].title}</h3>

              <p style={{
                fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.75,
                marginBottom: 36, maxWidth: 500,
              }}>{steps[active].description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {steps[active].details.map((d, j) => (
                  <div
                    className="hiw-detail-item"
                    key={j}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      fontSize: 14, color: 'var(--text-secondary)',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(130,130,255,0.03)',
                      border: '1px solid rgba(130,130,255,0.06)',
                      transition: 'all 0.3s ease',
                      animation: `fadeInUp 0.4s ease ${j * 0.1}s both`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${steps[active].color}08`;
                      e.currentTarget.style.borderColor = `${steps[active].color}20`;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(130,130,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(130,130,255,0.06)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <CheckCircle2 size={16} color={steps[active].color} />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;