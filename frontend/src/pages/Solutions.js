import React from 'react';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';

const Solutions = () => {
  return (
    <main>
      <section
        style={{
          padding: '120px 24px 40px',
          maxWidth: 960,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(32px,4vw,48px)',
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            marginBottom: 16,
          }}
        >
          Platform Solutions
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          Opinionated building blocks for AI governance, from secure model hosting to automated
          compliance and policy execution.
        </p>
      </section>
      <Features />
      <HowItWorks />
    </main>
  );
};

export default Solutions;

