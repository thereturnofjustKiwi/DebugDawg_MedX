import React, { useState, useRef, useCallback } from 'react';
import { Shield, Lock, Eye, Cpu, FileCheck, Users, ArrowRight } from 'lucide-react';

const Features = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePos, setMousePos] = useState({});
  const cardRefs = useRef([]);

  const handleMouseMove = useCallback((e, index) => {
    const card = cardRefs.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setMousePos(prev => ({ ...prev, [index]: { x, y, rotateX, rotateY } }));
  }, []);

  const features = [
    {
      icon: <Shield size={24} />,
      title: 'Explainable Diagnostics',
      description:
        'Generate Grad‑CAM heatmaps and SHAP overlays for every prediction so clinicians can see exactly which regions drove the diagnosis.',
      color: '#7c5cfc',
      tag: 'XAI',
    },
    {
      icon: <Lock size={24} />,
      title: 'Clinical‑grade Privacy',
      description:
        'Process images in secure environments with strict access controls, audit trails, and HIPAA‑friendly data handling patterns.',
      color: '#3b82f6',
      tag: 'Security',
    },
    {
      icon: <Eye size={24} />,
      title: 'Transparent Confidence',
      description:
        'Surface calibrated confidence scores, severity indices, and consensus badges so radiologists can quickly gauge model reliability.',
      color: '#06b6d4',
      tag: 'Trust',
    },
    {
      icon: <Cpu size={24} />,
      title: 'Multi‑disease Support',
      description:
        'Extend from pneumonia to skin cancer and beyond with a common explainability layer for classification and segmentation models.',
      color: '#10b981',
      tag: 'Coverage',
    },
    {
      icon: <FileCheck size={24} />,
      title: 'Report‑ready Outputs',
      description:
        'Export structured PDFs that combine images, heatmaps, SHAP charts, and clinical narratives for downstream documentation.',
      color: '#ec4899',
      tag: 'Reporting',
    },
    {
      icon: <Users size={24} />,
      title: 'Human‑in‑the‑loop Design',
      description:
        'Built for radiologists and clinicians, with controls for view mode, opacity, and commentary that keep experts in control.',
      color: '#f59e0b',
      tag: 'Workflow',
    },
  ];

  return (
    <section className="features-section" style={{ padding: '140px 24px', position: 'relative' }}>
      {/* Background accent orb */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '-10%',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,252,0.08), transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        animation: 'orbFloat1 20s ease-in-out infinite',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 18px', borderRadius: 'var(--radius-full)',
            background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)',
            marginBottom: 24, fontSize: 13, fontWeight: 600, color: '#a78bfa',
            animation: 'fadeInUp 0.8s ease both',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#7c5cfc',
              boxShadow: '0 0 8px rgba(124,92,252,0.6)',
              animation: 'pulseGlow 2s ease infinite',
            }} />
            Platform Features
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: 24,
            letterSpacing: '-0.025em', lineHeight: 1.08,
            animation: 'fadeInUp 0.8s ease 0.1s both',
          }}>
            Everything you need for{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7, #3b82f6)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientRotate 5s ease infinite',
            }}>explainable medical imaging</span>
          </h2>
          <p style={{
            fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600,
            margin: '0 auto', lineHeight: 1.75,
            animation: 'fadeInUp 0.8s ease 0.2s both',
          }}>
            A focused toolkit for turning raw medical images into transparent,
            clinician‑friendly AI explanations in a single workflow.
          </p>
        </div>

        {/* Cards Grid with 3D tilt */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 24,
        }}>
          {features.map((feature, i) => {
            const isHovered = hoveredCard === i;
            const pos = mousePos[i] || { x: 0, y: 0, rotateX: 0, rotateY: 0 };
            return (
              <div
                key={i}
                ref={el => cardRefs.current[i] = el}
                className="feature-card"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => {
                  setHoveredCard(null);
                  setMousePos(prev => ({ ...prev, [i]: { x: 0, y: 0, rotateX: 0, rotateY: 0 } }));
                }}
                onMouseMove={(e) => handleMouseMove(e, i)}
                style={{
                  position: 'relative',
                  padding: 36,
                  background: isHovered
                    ? 'rgba(20,20,50,0.9)'
                    : 'rgba(12,12,30,0.7)',
                  border: `1px solid ${isHovered ? `${feature.color}40` : 'rgba(130,130,255,0.08)'}`,
                  borderRadius: 20,
                  cursor: 'default',
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  transform: isHovered
                    ? `perspective(800px) rotateX(${pos.rotateX}deg) rotateY(${pos.rotateY}deg) translateY(-8px) scale(1.02)`
                    : 'perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isHovered
                    ? `0 30px 80px rgba(0,0,0,0.5), 0 0 40px ${feature.color}15`
                    : '0 10px 40px rgba(0,0,0,0.3)',
                  animation: `fadeInUp 0.8s ease ${0.1 * i}s both`,
                }}
              >
                {/* Spotlight gradient follow */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    top: pos.y - 150,
                    left: pos.x - 150,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${feature.color}12, transparent 70%)`,
                    pointerEvents: 'none',
                    transition: 'none',
                    zIndex: 0,
                  }} />
                )}

                {/* Top glow line on hover */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '10%',
                    right: '10%',
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${feature.color}80, transparent)`,
                  }} />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Tag */}
                  <span style={{
                    display: 'inline-block', padding: '5px 12px', borderRadius: 'var(--radius-full)',
                    background: `${feature.color}15`, color: feature.color,
                    fontSize: 11, fontWeight: 700, marginBottom: 22, letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    border: `1px solid ${feature.color}20`,
                  }}>
                    {feature.tag}
                  </span>

                  {/* Icon with glow */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `${feature.color}10`,
                    border: `1px solid ${feature.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: feature.color, marginBottom: 22,
                    transition: 'all 0.4s ease',
                    transform: isHovered ? 'scale(1.1) translateZ(20px)' : 'scale(1)',
                    boxShadow: isHovered ? `0 8px 30px ${feature.color}25` : 'none',
                  }}>
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 21, fontWeight: 700, marginBottom: 14,
                    fontFamily: "'Space Grotesk', sans-serif",
                    transition: 'color 0.3s ease',
                    color: isHovered ? '#fff' : '#f0f0ff',
                  }}>
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75,
                    marginBottom: 22,
                  }}>
                    {feature.description}
                  </p>

                  {/* Link with slide-in */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 14, fontWeight: 600, color: feature.color,
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateX(0)' : 'translateX(-12px)',
                    transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  }}>
                    Learn more
                    <ArrowRight size={14} style={{
                      transition: 'transform 0.3s ease',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;