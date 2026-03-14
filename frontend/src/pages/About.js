import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  const cards = [
    {
      title: 'Mission',
      body: 'Enable organizations to deploy AI responsibly with verifiable guarantees around security, compliance, and trust.',
      color: '#7c5cfc',
      icon: '🎯',
    },
    {
      title: 'Approach',
      body: 'We blend modern cryptography, secure enclaves, and governance workflows into a cohesive platform tailored for regulated industries.',
      color: '#3b82f6',
      icon: '🧬',
    },
    {
      title: 'Focus',
      body: 'Financial services, healthcare, and public sector teams that need to move fast on AI without compromising risk or compliance.',
      color: '#06b6d4',
      icon: '🔬',
    },
  ];

  return (
    <main
      style={{
        padding: '140px 24px 100px',
        maxWidth: 960,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Background orb */}
      <div style={{
        position: 'fixed',
        top: '20%',
        right: '-5%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,252,0.06), transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        animation: 'orbFloat1 18s ease-in-out infinite',
      }} />

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{
          fontSize: 'clamp(36px,4vw,52px)',
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          marginBottom: 20,
          letterSpacing: '-0.025em',
        }}
      >
        About{' '}
        <span style={{
          background: 'linear-gradient(135deg, #7c5cfc, #a855f7, #3b82f6)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'gradientRotate 5s ease infinite',
        }}>
          ExplainableMed
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          maxWidth: 720,
          marginBottom: 48,
        }}
      >
        ExplainableMed is building the transparent AI layer for medical imaging,
        combining deep learning, explainability frameworks, and clinician-first design
        in a single unified platform.
      </motion.p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}
      >
        {cards.map((card, i) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 30, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: { duration: 0.3 },
            }}
            style={{
              padding: 28,
              borderRadius: 20,
              background: 'rgba(12,12,30,0.8)',
              border: `1px solid ${card.color}15`,
              backdropFilter: 'blur(15px)',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${card.color}40, transparent)`,
              opacity: 0.6,
            }} />

            <div style={{
              fontSize: 28,
              marginBottom: 16,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}>
              {card.icon}
            </div>

            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 10,
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#f0f0ff',
              }}
            >
              {card.title}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
              }}
            >
              {card.body}
            </p>
          </motion.section>
        ))}
      </div>
    </main>
  );
};

export default About;
