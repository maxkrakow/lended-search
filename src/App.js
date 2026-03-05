import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import HowItWorks from './components/HowItWorks';
import BuiltFor from './components/BuiltFor';
import CaseStudies from './components/CaseStudies';
import Comparison from './components/Comparison';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Header />
      <Hero />
      <PainPoints />
      <HowItWorks />
      <BuiltFor />
      <CaseStudies />
      <Comparison />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

export default App;
