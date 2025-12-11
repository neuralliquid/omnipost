import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>OmniPost</h1>
        <p>AI-powered multi-platform content publishing. Publish everywhere, manage anywhere.</p>
        <Link href="/series" className="hero-button">
          Explore Series
        </Link>
      </div>
    </section>
  );
};

export default Hero;
