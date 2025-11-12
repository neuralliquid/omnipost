import React from 'react';
import Header from '../components/shared/Header';
import Hero from '../components/shared/Hero';
import Footer from '../components/shared/Footer';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div>
      <Header />
      <Hero />
      <Footer />
    </div>
  );
};

export default Home;