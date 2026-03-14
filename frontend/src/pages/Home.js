import React from 'react';
import Hero from '../components/HeroSimple';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Partners from '../components/Partners';

const Home = () => {
  return (
    <main>
      <Hero />
      <Partners />
      <Features />
      <HowItWorks />
    </main>
  );
};

export default Home;

