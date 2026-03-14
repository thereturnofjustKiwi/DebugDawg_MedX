import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

const Contact = () => {
  const [focusedField, setFocusedField] = useState(null);

  const fields = [
    { label: 'Full name', type: 'text', id: 'name' },
    { label: 'Work email', type: 'email', id: 'email' },
    { label: 'Company', type: 'text', id: 'company' },
    { label: 'Role', type: 'text', id: 'role' },
  ];

  const inputStyle = (isFocused) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: `1px solid ${isFocused ? 'rgba(124,92,252,0.5)' : 'rgba(130,130,255,0.1)'}`,
    background: isFocused ? 'rgba(124,92,252,0.05)' : 'rgba(12,12,30,0.8)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: isFocused ? '0 0 20px rgba(124,92,252,0.15)' : 'none',
  });

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
        top: '30%',
        left: '10%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        animation: 'orbFloat3 20s ease-in-out infinite',
      }} />

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          fontSize: 'clamp(36px,4vw,52px)',
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          marginBottom: 20,
          letterSpacing: '-0.025em',
        }}
      >
        Talk to{' '}
        <span style={{
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #7c5cfc)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'gradientRotate 5s ease infinite',
        }}>
          our team
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          maxWidth: 720,
          marginBottom: 40,
        }}
      >
        Share a bit about your use case and we'll follow up with a tailored walkthrough of
        the ExplainableMed platform.
      </motion.p>

      <motion.form
        initial={{ opacity: 0, y: 30, rotateX: 5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          background: 'rgba(12,12,30,0.7)',
          borderRadius: 24,
          border: '1px solid rgba(130,130,255,0.1)',
          padding: 32,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,252,0.06), transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        {/* Sparkle icon */}
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'rgba(124,92,252,0.2)',
          animation: 'spinSlow 20s linear infinite',
        }}>
          <Sparkles size={24} />
        </div>

        {fields.map((field, i) => (
          <label
            key={i}
            style={{
              fontSize: 13,
              color: focusedField === field.id ? '#a78bfa' : 'var(--text-secondary)',
              transition: 'color 0.3s ease',
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'block', marginBottom: 8 }}>{field.label}</span>
            <input
              type={field.type}
              onFocus={() => setFocusedField(field.id)}
              onBlur={() => setFocusedField(null)}
              style={inputStyle(focusedField === field.id)}
            />
          </label>
        ))}

        <label
          style={{
            gridColumn: '1 / -1',
            fontSize: 13,
            color: focusedField === 'message' ? '#a78bfa' : 'var(--text-secondary)',
            transition: 'color 0.3s ease',
            fontWeight: 500,
          }}
        >
          <span style={{ display: 'block', marginBottom: 8 }}>What would you like to explore?</span>
          <textarea
            rows={4}
            onFocus={() => setFocusedField('message')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...inputStyle(focusedField === 'message'),
              resize: 'vertical',
            }}
          />
        </label>

        <div
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 8,
          }}
        >
          <button
            type="submit"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(124,92,252,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(124,92,252,0.2)';
            }}
            style={{
              padding: '14px 32px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7, #ec4899)',
              backgroundSize: '200% 200%',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 8px 25px rgba(124,92,252,0.2)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              animation: 'gradientRotate 4s ease infinite',
            }}
          >
            Submit <Send size={16} />
          </button>
        </div>
      </motion.form>

      <style>{`
        @media(max-width:768px) {
          form { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
};

export default Contact;
