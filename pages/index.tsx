import React from 'react';
import Header from '../components/ui/Header';
import Hero from '../components/ui/Hero';
import Footer from '../components/ui/Footer';
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
