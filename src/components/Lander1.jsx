import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/20/solid';
import { InlineWidget } from 'react-calendly';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

// Only 4 steps: Acquisition Criteria → Program → Contact Info → Calendly
const steps = [
  { id: 'criteria', label: 'Your Search' },
  { id: 'program', label: 'Program' },
  { id: 'contact', label: 'Contact Info' },
];

export default function Lander1() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);

  // Step 1: Criteria
  const [industry, setIndustry] = useState('');
  const [dealSize, setDealSize] = useState('');
  const [location, setLocation] = useState('');
  const [readiness, setReadiness] = useState('');

  // Step 2: Program
  const [program, setProgram] = useState('');

  // Step 3: Contact
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactErrors, setContactErrors] = useState({});

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const formatAnswers = (raw) => {
    const formatted = { ...raw };
    if (formatted.phone) {
      const digits = formatted.phone.replace(/\D/g, '');
      formatted.phone = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
    }
    if (formatted.name) {
      const full = formatted.name.trim();
      formatted.fullName = full;
      formatted.name = full.split(/\s+/)[0];
    }
    return formatted;
  };

  const submitToFirebase = async () => {
    try {
      const raw = { industry, deal_size: dealSize, location, readiness, program, name, email, phone };
      const formatted = formatAnswers(raw);
      await addDoc(collection(db, 'leads'), {
        ...formatted,
        source: 'lander1',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const canAdvanceStep0 = industry && dealSize && location && readiness;
  const canAdvanceStep1 = program;

  const validateContact = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Required';
    if (!email.trim()) {
      errors.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email';
    }
    if (!phone.trim()) {
      errors.phone = 'Required';
    } else if (phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Enter a valid phone number';
    }
    return errors;
  };

  const handleNext = () => {
    if (currentStep === 2) {
      const errors = validateContact();
      if (Object.keys(errors).length > 0) {
        setContactErrors(errors);
        return;
      }
      submitToFirebase();
      setSubmitted(true);
      return;
    }
    setDirection(1);
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((s) => s - 1);
  };

  // Fire Google Ads conversion
  useEffect(() => {
    if (!submitted) return;
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-17995555560/e37BCPuanoMcEOjF-YRD',
        value: 1.0,
        currency: 'USD',
      });
    }
  }, [submitted]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center">
            <a href="/"><img src="/logo.png" alt="Lended Search" className="h-8" /></a>
          </div>
        </header>
        <motion.div className="text-center px-4 pt-10 pb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckIcon className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">You're In.</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Pick a time below and we'll build a custom sourcing plan for your criteria.</p>
        </motion.div>
        <div className="flex-1 px-4 pb-8">
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
            <InlineWidget url={CALENDLY} prefill={{ name: name || '', email: email || '' }} styles={{ height: '660px', minWidth: '320px' }} />
          </div>
        </div>
        <Lander1Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-8 py-4">
          <a href="/"><img src="/logo.png" alt="Lended Search" className="h-8" /></a>
        </div>
        <div className="h-1 bg-gray-100">
          <motion.div className="h-full bg-emerald-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </header>

      {/* Hero — outcome-focused headline + social proof */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
            Get Under LOI in <span className="text-emerald-600">3-6 Months</span>, Not 12-24
          </h1>
          <p className="text-gray-500 text-base max-w-2xl mx-auto mb-6">
            See if you qualify for off-market deal flow. Takes 60 seconds. Get a free custom sourcing strategy on the call.
          </p>
          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900">400+</p>
              <p className="text-xs text-gray-500">Deals Sourced</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-emerald-600">3-6 mo</p>
              <p className="text-xs text-gray-500">Avg. Time to LOI</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900">$500M+</p>
              <p className="text-xs text-gray-500">Pipeline Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-8">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Acquisition Criteria */}
            {currentStep === 0 && (
              <motion.div key="criteria" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Tell us about your search</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">What type of business?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Home Services', value: 'home-services' },
                        { label: 'Business Services', value: 'business-services' },
                        { label: 'Healthcare', value: 'healthcare' },
                        { label: 'Manufacturing', value: 'manufacturing' },
                        { label: 'Other / Multiple', value: 'other' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setIndustry(opt.value)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            industry === opt.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Target purchase price?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Under $500K', value: 'under-500k' },
                        { label: '$500K – $1M', value: '500k-1m' },
                        { label: '$1M – $3M', value: '1m-3m' },
                        { label: '$3M – $5M', value: '3m-5m' },
                        { label: '$5M+', value: '5m+' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setDealSize(opt.value)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            dealSize === opt.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Where are you looking?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Specific Area', value: 'specific' },
                        { label: 'Regional', value: 'regional' },
                        { label: 'Nationwide', value: 'nationwide' },
                        { label: 'Anywhere', value: 'anywhere' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setLocation(opt.value)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            location === opt.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">How soon do you want to close?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'ASAP', value: 'asap' },
                        { label: '3-6 months', value: '3-6mo' },
                        { label: '6-12 months', value: '6-12mo' },
                        { label: 'Exploring', value: 'exploring' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setReadiness(opt.value)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            readiness === opt.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!canAdvanceStep0}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:hover:bg-emerald-600"
                >
                  Continue
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Program Selection */}
            {currentStep === 1 && (
              <motion.div key="program" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Which program fits your search?</p>

                <div className="space-y-3">
                  {[
                    {
                      label: 'Listing Monitor',
                      price: '$1,000/mo',
                      desc: 'All major listing sites scraped daily, filtered to your criteria. We outreach and book meetings for you.',
                      value: 'listing-monitor',
                    },
                    {
                      label: 'Off-Market — State',
                      price: '$3,000/mo',
                      desc: 'Dedicated caller + email campaigns in your state. Off-market sellers not listed anywhere.',
                      value: 'off-market-state',
                      popular: true,
                    },
                    {
                      label: 'Off-Market — National',
                      price: '$5,000/mo',
                      desc: 'Two dedicated callers + nationwide campaigns. 20-50 qualified conversations per month.',
                      value: 'off-market-national',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setProgram(opt.value)}
                      className={`w-full rounded-xl border px-5 py-5 text-left transition-all relative ${
                        program === opt.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {opt.popular && (
                        <span className="absolute -top-2.5 right-4 inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-semibold text-gray-900">{opt.label}</span>
                        <span className={`text-sm font-bold ${program === opt.value ? 'text-emerald-600' : 'text-gray-900'}`}>{opt.price}</span>
                      </div>
                      <p className="text-sm text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={handleBack} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!canAdvanceStep1}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:hover:bg-emerald-600"
                  >
                    Continue
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact Info — all on one page */}
            {currentStep === 2 && (
              <motion.div key="contact" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Almost done — where should we reach you?</p>
                <p className="text-sm text-gray-500 mb-6">We'll send you a free custom sourcing plan after your strategy call.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setContactErrors((prev) => ({ ...prev, name: '' })); }}
                      placeholder="John Smith"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                        contactErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                      }`}
                    />
                    {contactErrors.name && <p className="mt-1 text-xs text-red-500">{contactErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setContactErrors((prev) => ({ ...prev, email: '' })); }}
                      placeholder="you@example.com"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                        contactErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                      }`}
                    />
                    {contactErrors.email && <p className="mt-1 text-xs text-red-500">{contactErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setContactErrors((prev) => ({ ...prev, phone: '' })); }}
                      placeholder="(555) 123-4567"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                        contactErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                      }`}
                    />
                    {contactErrors.phone && <p className="mt-1 text-xs text-red-500">{contactErrors.phone}</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={handleBack} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition-all"
                  >
                    Book My Free Strategy Call
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Testimonial */}
      <div className="border-t border-gray-200 bg-white py-6 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-sm text-gray-600 italic">"We went from zero off-market conversations to 30+ qualified meetings in our first two months. Lended Search changed the game for our fund."</p>
          <p className="text-xs text-gray-400 mt-2">— PE-backed searcher, Southeast</p>
        </div>
      </div>

      <Lander1Footer />
    </div>
  );
}

function Lander1Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Lended Search. All rights reserved. | lendedsearch.com
        </p>
      </div>
    </footer>
  );
}
