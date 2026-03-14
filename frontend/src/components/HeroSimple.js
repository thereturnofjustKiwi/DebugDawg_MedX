import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, HeartPulse, Stethoscope, Microscope, Syringe, Pill, Scan, Dna, Thermometer } from 'lucide-react';

const HeroSimple = () => {
  const [visible, setVisible] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const heroRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleMove = useCallback((e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / innerWidth;
    const y = (e.clientY - innerHeight / 2) / innerHeight;
    setParallax({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, [handleMove]);

  const floatingIcons = [
    { icon: <Brain size={20} />, top: '15%', left: '6%', delay: 0, color: '#7c5cfc' },
    { icon: <Stethoscope size={20} />, top: '20%', right: '8%', delay: 0.5, color: '#3b82f6' },
    { icon: <HeartPulse size={20} />, bottom: '30%', left: '10%', delay: 1, color: '#ec4899' },
    { icon: <Microscope size={18} />, bottom: '22%', right: '6%', delay: 1.5, color: '#10b981' },
    { icon: <Syringe size={18} />, top: '50%', left: '4%', delay: 2, color: '#06b6d4' },
    { icon: <Pill size={18} />, top: '12%', right: '18%', delay: 0.8, color: '#a855f7' },
    { icon: <Scan size={16} />, top: '65%', right: '12%', delay: 1.2, color: '#f59e0b' },
    { icon: <Dna size={16} />, bottom: '40%', left: '18%', delay: 0.3, color: '#22d3ee' },
    { icon: <Thermometer size={16} />, top: '35%', right: '22%', delay: 1.8, color: '#f43f5e' },
  ];

  // Create rising particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    left: `${(i * 3.33) % 100}%`,
    size: 2 + (i % 4),
    duration: 8 + (i % 7) * 2,
    delay: (i % 10) * 1.2,
    color: i % 3 === 0 ? 'rgba(124,92,252,0.6)' : i % 3 === 1 ? 'rgba(56,189,248,0.6)' : 'rgba(236,72,153,0.5)',
  }));

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 100px',
        overflow: 'hidden',
        perspective: '1200px',
      }}
    >
      {/* Morphing Gradient Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '15%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,252,0.25), rgba(124,92,252,0.05) 70%, transparent)',
          filter: 'blur(60px)',
          animation: 'orbFloat1 15s ease-in-out infinite, morphBlob 20s ease-in-out infinite',
          pointerEvents: 'none',
          transform: `translate3d(${parallax.x * -200}px, ${parallax.y * -150}px, 0)`,
          transition: 'transform 0.08s linear',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.2), rgba(6,182,212,0.05) 70%, transparent)',
          filter: 'blur(50px)',
          animation: 'orbFloat2 18s ease-in-out infinite, morphBlob 25s ease-in-out infinite reverse',
          pointerEvents: 'none',
          transform: `translate3d(${parallax.x * 180}px, ${parallax.y * -120}px, 0)`,
          transition: 'transform 0.1s linear',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '30%',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orbFloat3 22s ease-in-out infinite, morphBlob 18s ease-in-out infinite',
          pointerEvents: 'none',
          transform: `translate3d(${parallax.x * 120}px, ${parallax.y * 160}px, 0)`,
          transition: 'transform 0.12s linear',
        }}
      />

      {/* Enhanced Grid with depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(130,130,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(130,130,255,0.06) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
          opacity: 0.5,
          transform: `translate3d(${parallax.x * 80}px, ${parallax.y * 90}px, 0) perspective(800px) rotateX(${parallax.y * 10}deg)`,
          transition: 'transform 0.08s linear',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
        }}
      />

      {/* Rising particles */}
      {particles.map((p, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            bottom: '-5%',
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            animation: `particleDrift ${p.duration}s ease-in-out ${p.delay}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Floating Icons with 3D hover */}
      {floatingIcons.map((item, i) => (
        <div
          key={i}
          className="floating-icon"
          style={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            width: 54,
            height: 54,
            borderRadius: 16,
            background: 'rgba(15,15,35,0.7)',
            border: `1px solid ${item.color}30`,
            boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 20px ${item.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: item.color,
            backdropFilter: 'blur(20px)',
            animation: `floatIcon 6s ease-in-out ${item.delay}s infinite`,
            opacity: visible ? 0.8 : 0,
            transition: 'opacity 1.2s ease, transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'default',
            transform: `translate3d(${parallax.x * (30 + i * 8)}px, ${parallax.y * (25 + i * 6)}px, ${20 + i * 5}px)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = `translate3d(${parallax.x * (30 + i * 8)}px, ${parallax.y * (25 + i * 6)}px, 60px) scale(1.2) rotateY(15deg)`;
            e.currentTarget.style.boxShadow = `0 25px 60px rgba(0,0,0,0.6), 0 0 40px ${item.color}40`;
            e.currentTarget.style.borderColor = `${item.color}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = `translate3d(${parallax.x * (30 + i * 8)}px, ${parallax.y * (25 + i * 6)}px, ${20 + i * 5}px) scale(1) rotateY(0deg)`;
            e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.5), 0 0 20px ${item.color}15`;
            e.currentTarget.style.borderColor = `${item.color}30`;
          }}
        >
          {item.icon}
        </div>
      ))}

      {/* Main Content - 3D Glass Card */}
      <div
        className="hero-glass-card"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1000,
          margin: '0 auto',
          padding: '48px 40px 56px',
          textAlign: 'center',
          borderRadius: 32,
          background:
            'linear-gradient(135deg, rgba(15,15,35,0.88), rgba(20,20,50,0.82), rgba(40,30,90,0.7))',
          border: '1px solid rgba(130,130,255,0.15)',
          boxShadow:
            '0 40px 140px rgba(0,0,0,0.8), 0 0 80px rgba(124,92,252,0.2), 0 0 160px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(40px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
          opacity: visible ? 1 : 0,
          transform: visible
            ? `perspective(1000px) rotateX(${parallax.y * -3}deg) rotateY(${parallax.x * 3}deg) translate3d(${parallax.x * 12}px, ${parallax.y * 8}px, 0)`
            : 'perspective(1000px) rotateX(4deg) translateY(50px)',
          transition: visible ? 'transform 0.15s linear, opacity 0.9s ease' : 'all 0.9s cubic-bezier(0.4,0,0.15,1)',
        }}
      >
        {/* Glowing border effect */}
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 33,
          background: 'linear-gradient(135deg, rgba(124,92,252,0.3), transparent 30%, transparent 70%, rgba(56,189,248,0.3))',
          zIndex: -1,
          opacity: 0.6,
          animation: 'pulseGlow 4s ease-in-out infinite',
        }} />

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 18px 7px 9px',
            borderRadius: '9999px',
            background: 'rgba(124,92,252,0.12)',
            border: '1px solid rgba(124,92,252,0.25)',
            marginBottom: 36,
            fontSize: 13,
            fontWeight: 500,
            color: '#a78bfa',
            animation: visible ? 'fadeInUp 0.8s ease 0.3s both' : 'none',
          }}
        >
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            BETA
          </span>
          Explainable AI for medical imaging
          <ArrowRight size={14} style={{ animation: 'shimmer 2s ease infinite' }} />
        </div>

        {/* Heading with animated gradient */}
        <h1
          style={{
            fontSize: 'clamp(38px, 6vw, 78px)',
            fontWeight: 800,
            lineHeight: 1.04,
            fontFamily: "'Space Grotesk', sans-serif",
            marginBottom: 28,
            letterSpacing: '-0.035em',
            animation: visible ? 'fadeInUp 1s ease 0.4s both' : 'none',
          }}
        >
          Classify & explain{' '}
          <span
            style={{
              background:
                'conic-gradient(from 140deg at 50% 50%, #22d3ee, #a855f7, #4f46e5, #22c55e, #ec4899, #22d3ee)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientRotate 6s ease infinite',
            }}
          >
            medical images
          </span>
          <br />with transparent AI
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 19px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            maxWidth: 640,
            margin: '0 auto 44px',
            fontWeight: 400,
            animation: visible ? 'fadeInUp 1s ease 0.6s both' : 'none',
          }}
        >
          Upload chest X‑rays or dermoscopy images and generate explainable AI outputs,
          including Grad‑CAM heatmaps, SHAP feature attributions, and a clinical‑style narrative.
        </p>

        {/* CTA Button with animated glow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
            animation: visible ? 'fadeInUp 1s ease 0.8s both' : 'none',
          }}
        >
          <button
            onClick={() => navigate('/workspace')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(124,92,252,0.45), 0 0 40px rgba(124,92,252,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,92,252,0.25)';
            }}
            style={{
              padding: '18px 40px',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7, #ec4899)',
              backgroundSize: '200% 200%',
              border: 'none',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 8px 30px rgba(124,92,252,0.25)',
              transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
              animation: 'gradientRotate 4s ease infinite',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              Upload medical image <ArrowRight size={18} />
            </span>
          </button>

          <button
            onClick={() => {
              const el = document.querySelector('.features-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(124,92,252,0.5)';
              e.currentTarget.style.background = 'rgba(124,92,252,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(130,130,255,0.2)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            style={{
              padding: '18px 32px',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid rgba(130,130,255,0.2)',
              borderRadius: '9999px',
              transition: 'all 0.3s ease',
            }}
          >
            Learn more
          </button>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            marginTop: 48,
            paddingTop: 28,
            borderTop: '1px solid rgba(130,130,255,0.08)',
            animation: visible ? 'fadeInUp 1s ease 1s both' : 'none',
          }}
        >
          {[
            { value: '90%+', label: 'Avg Model Accuracy' },
            { value: '< 5s', label: 'Analysis Speed' },
            { value: '23', label: 'Disease Classifications' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #7c5cfc, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: `numberCount 0.8s ease ${0.8 + i * 0.2}s both`,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-tertiary)',
                fontWeight: 500,
                marginTop: 4,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Preview glow strip with 3D */}
      <div
        style={{
          position: 'absolute',
          bottom: -80,
          left: '50%',
          transform: `translateX(-50%) perspective(600px) rotateX(${5 + parallax.y * 15}deg) translate3d(${parallax.x * -60}px, 0, 0)`,
          width: '85%',
          maxWidth: 1100,
          height: 280,
          background:
            'linear-gradient(180deg, rgba(124,92,252,0.2) 0%, rgba(56,189,248,0.1) 30%, transparent 70%)',
          borderRadius: '28px 28px 0 0',
          border: '1px solid rgba(124,92,252,0.2)',
          borderBottom: 'none',
          opacity: visible ? 0.5 : 0,
          transition: 'opacity 1.8s ease 0.8s, transform 0.4s ease-out',
          boxShadow: '0 -15px 100px rgba(124,92,252,0.25)',
        }}
      >
        {/* Mock dots */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            display: 'flex',
            gap: 8,
          }}
        >
          {['#22c55e', '#eab308', '#ef4444'].map((c, i) => (
            <div key={i} style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: c,
              boxShadow: `0 0 8px ${c}50`,
            }} />
          ))}
        </div>

        {/* Scanning line effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-20%',
          width: '10%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.15), transparent)',
          animation: 'glowLine 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      </div>
    </section>
  );
};

export default HeroSimple;
