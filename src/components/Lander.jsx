import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/20/solid';
import { InlineWidget } from 'react-calendly';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

const questions = [
  {
    id: 'contact',
    question: 'Get your custom sourcing plan — enter your info below.',
    type: 'contact',
  },
  {
    id: 'motivation',
    question: 'What best describes your situation?',
    type: 'select',
    options: [
      { label: 'I\'m actively searching for a business to acquire', value: 'active' },
      { label: 'I\'m exploring acquisition as a path but haven\'t started yet', value: 'exploring' },
      { label: 'I already own a business and want to acquire another', value: 'add-on' },
      { label: 'I\'m a fund or family office looking for deal flow', value: 'fund' },
    ],
  },
  {
    id: 'searcher_type',
    question: 'Which best describes you?',
    type: 'select',
    options: [
      { label: 'Self-funded searcher', value: 'self-funded' },
      { label: 'Search fund (traditional or accelerator)', value: 'search-fund' },
      { label: 'Independent sponsor', value: 'independent-sponsor' },
      { label: 'PE firm / Family office', value: 'pe-family' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    id: 'industry',
    question: 'What type of business are you looking for?',
    type: 'select',
    options: [
      { label: 'Home services (HVAC, plumbing, electrical, etc.)', value: 'home-services' },
      { label: 'Business services (staffing, IT, consulting, etc.)', value: 'business-services' },
      { label: 'Healthcare services', value: 'healthcare' },
      { label: 'Manufacturing / Industrial', value: 'manufacturing' },
      { label: 'Other / Multiple sectors', value: 'other' },
    ],
  },
  {
    id: 'deal_size',
    question: 'What purchase price are you targeting?',
    type: 'select',
    options: [
      { label: 'Under $500K', value: 'under-500k' },
      { label: '$500K – $1M', value: '500k-1m' },
      { label: '$1M – $3M', value: '1m-3m' },
      { label: '$3M – $5M', value: '3m-5m' },
      { label: '$5M+', value: '5m+' },
    ],
  },
  {
    id: 'readiness',
    question: 'How soon are you looking to close a deal?',
    type: 'select',
    options: [
      { label: 'As soon as possible — I\'m ready now', value: 'asap' },
      { label: 'Within 3-6 months', value: '3-6mo' },
      { label: 'Within 6-12 months', value: '6-12mo' },
      { label: 'Just exploring for now', value: 'exploring' },
    ],
  },
  {
    id: 'program',
    question: 'Which program are you most interested in?',
    type: 'program',
    options: [
      {
        label: 'Listing Monitor',
        price: '$1,000/mo',
        description: 'All major listing sites scraped daily, filtered to your criteria. We reach out to matching sellers and book meetings on your behalf.',
        value: 'listing-monitor',
      },
      {
        label: 'Off-Market — State',
        price: '$3,000/mo',
        description: 'Dedicated caller + email campaigns targeting owners in your state. Off-market sellers not listed anywhere.',
        value: 'off-market-state',
        popular: true,
      },
      {
        label: 'Off-Market — National',
        price: '$5,000/mo',
        description: 'Two dedicated callers + nationwide campaigns across multiple states. 20-50 qualified conversations per month.',
        value: 'off-market-national',
      },
    ],
  },
];

const caseStudies = [
  {
    tag: 'Self-Funded Searcher',
    sector: 'Home Services, Texas',
    headline: 'LOI in 4 Months',
    desc: 'Was 8 months in with no pipeline. 37 qualified conversations in 90 days. Under LOI on a $3.5M HVAC business.',
    stats: [
      { value: '37', label: 'Conversations' },
      { value: '90', label: 'Days' },
      { value: '$3.5M', label: 'Deal' },
    ],
  },
  {
    tag: 'Search Fund',
    sector: 'Manufacturing, Midwest',
    headline: '47 Conversations in 90 Days',
    desc: 'Traditional search fund relying on brokers for 6 months. First meeting in 11 days. 3 deals in active diligence.',
    stats: [
      { value: '47', label: 'Conversations' },
      { value: '11', label: 'Days to First' },
      { value: '3', label: 'In Diligence' },
    ],
  },
  {
    tag: 'Independent Sponsor',
    sector: 'Business Services, SE',
    headline: '22 Meetings in 30 Days',
    desc: 'Had capital committed but no deal flow. 22 owner meetings in first month. Closed acquisition within 6 months.',
    stats: [
      { value: '22', label: 'Meetings' },
      { value: '30', label: 'Days' },
      { value: '6mo', label: 'To Close' },
    ],
  },
];

function genSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function Lander() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [sessionId] = useState(() => genSessionId());
  const [trackedSteps] = useState(() => new Set());
  const leadDocIdRef = useRef(null);

  const totalSteps = questions.length;

  // Track step views in Firestore
  const trackStep = useCallback(async (stepIndex, questionId) => {
    if (trackedSteps.has(stepIndex)) return;
    trackedSteps.add(stepIndex);
    try {
      const ref = doc(db, 'funnel_sessions', sessionId);
      if (stepIndex === 0) {
        await setDoc(ref, {
          startedAt: serverTimestamp(),
          source: 'lander',
          steps: [questionId],
          lastStep: questionId,
          completed: false,
        });
      } else {
        await updateDoc(ref, {
          steps: arrayUnion(questionId),
          lastStep: questionId,
        });
      }
    } catch (err) {
      console.error('Track step error:', err);
    }
  }, [sessionId, trackedSteps]);

  // Track first step on mount
  useEffect(() => {
    trackStep(0, questions[0].id);
  }, [trackStep]);

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

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
      setValidationErrors({});
    }
  }, [currentStep]);

  const handleSelect = useCallback((questionId, value) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);

    // Update lead doc with this answer
    if (leadDocIdRef.current) {
      updateDoc(doc(db, 'leads', leadDocIdRef.current), { [questionId]: value }).catch(() => {});
    }

    const nextStep = currentStep + 1;
    if (nextStep < questions.length) {
      trackStep(nextStep, questions[nextStep].id);
      setTimeout(() => {
        setDirection(1);
        setCurrentStep((s) => s + 1);
      }, 300);
    } else {
      // Last question — mark funnel complete and show Calendly
      updateDoc(doc(db, 'funnel_sessions', sessionId), {
        completed: true,
        completedAt: serverTimestamp(),
      }).catch(() => {});
      setTimeout(() => setSubmitted(true), 300);
    }
  }, [answers, currentStep, trackStep, sessionId]);

  const handleContactSubmit = useCallback((e) => {
    e.preventDefault();
    const errors = {};
    if (!contactForm.name.trim()) errors.name = 'Name is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) errors.email = 'Please enter a valid email';
    const digits = contactForm.phone.replace(/\D/g, '');
    if (digits.length < 10) errors.phone = 'Please enter a valid phone number';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Advance to next step immediately
    const nextStep = currentStep + 1;
    setDirection(1);
    setCurrentStep(nextStep);

    // Save lead to Firebase in background (triggers GHL webhook)
    const formatted = formatAnswers({
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
    });
    addDoc(collection(db, 'leads'), {
      ...formatted,
      source: 'lander',
      createdAt: serverTimestamp(),
    }).then((docRef) => {
      leadDocIdRef.current = docRef.id;
    }).catch((err) => {
      console.error('Error saving lead:', err);
    });
    trackStep(nextStep, questions[nextStep].id).catch(() => {});
  }, [contactForm, currentStep, trackStep]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  // Fire Google Ads conversion on form completion
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <motion.div
          className="text-center px-4 pt-10 pb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">You're In.</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Based on your answers, you look like a great fit. Pick a time below and we'll build a custom sourcing plan for your criteria.
          </p>
        </motion.div>
        <div className="flex-1 px-4 pb-8">
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
            <InlineWidget
              url={CALENDLY}
              prefill={{
                name: contactForm.name || '',
                email: contactForm.email || '',
              }}
              styles={{ height: '660px', minWidth: '320px' }}
            />
          </div>
        </div>
        <LanderFooter />
      </div>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky header with progress */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Lended Search" className="h-8 w-auto" />
          </a>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Hero text */}
      <div className="text-center px-4 pt-8 pb-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
          We Find, Vet & Book Meetings With{' '}
          <span className="text-emerald-600">Motivated Sellers</span>
        </h1>
        <p className="text-gray-500 text-base max-w-2xl mx-auto">
          Answer a few quick questions to see if off-market deal sourcing is right for your search.
        </p>
      </div>

      {/* Main content: form + case studies */}
      <div className="flex-1 px-4 pt-4 pb-8">
        <div className="max-w-6xl mx-auto flex gap-8 items-start">
          {/* Case studies - left side, hidden on mobile */}
          <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0 pt-4">
            {caseStudies.slice(0, 2).map((study) => (
              <CaseStudyCard key={study.headline} study={study} />
            ))}
          </div>

          {/* Form area - center */}
          <div className="flex-1 max-w-xl mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
                  {currentQuestion.question}
                </p>

                {currentQuestion.type === 'select' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isSelected = answers[currentQuestion.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelect(currentQuestion.id, opt.value)}
                          className={`w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-gray-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-sm sm:text-base font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'program' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelect(currentQuestion.id, opt.value)}
                          className={`w-full rounded-xl border px-5 py-5 text-left transition-all relative ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          {opt.popular && (
                            <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                              Most Popular
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-base font-semibold text-gray-900">{opt.label}</span>
                            <span className={`text-sm font-bold ${isSelected ? 'text-emerald-600' : 'text-gray-900'}`}>{opt.price}</span>
                          </div>
                          <p className="text-sm text-gray-500 leading-relaxed">{opt.description}</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'contact' && (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => { setContactForm(f => ({ ...f, name: e.target.value })); setValidationErrors(v => ({ ...v, name: '' })); }}
                        placeholder="Full name"
                        autoFocus
                        className={`w-full rounded-xl border bg-white px-5 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                        }`}
                      />
                      {validationErrors.name && <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>}
                    </div>
                    <div>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => { setContactForm(f => ({ ...f, email: e.target.value })); setValidationErrors(v => ({ ...v, email: '' })); }}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border bg-white px-5 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                        }`}
                      />
                      {validationErrors.email && <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>}
                    </div>
                    <div>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => { setContactForm(f => ({ ...f, phone: e.target.value })); setValidationErrors(v => ({ ...v, phone: '' })); }}
                        placeholder="(555) 123-4567"
                        className={`w-full rounded-xl border bg-white px-5 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                          validationErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                        }`}
                      />
                      {validationErrors.phone && <p className="mt-1 text-sm text-red-500">{validationErrors.phone}</p>}
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      Submit & Book Your Call
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Back button */}
            {currentStep > 0 && (
              <button
                onClick={goBack}
                className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          {/* Case studies - right side, hidden on mobile */}
          <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0 pt-4">
            <CaseStudyCard study={caseStudies[2]} />
            <CaseStudyCard study={{
              tag: 'PE-Backed',
              headline: '$500M+ Pipeline Sourced',
              desc: 'Across 400+ searchers, we\'ve sourced over $500M in deal pipeline with an average time to LOI of 3-6 months.',
              stats: [
                { value: '400+', label: 'Searchers' },
                { value: '$500M+', label: 'Pipeline' },
                { value: '3-6 mo', label: 'Avg to LOI' },
              ],
            }} />
          </div>
        </div>

        {/* Case studies on mobile - shown below form */}
        <div className="lg:hidden mt-8">
          <p className="text-sm font-semibold text-gray-500 mb-3 text-center">Real Results</p>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {caseStudies.map((study) => (
              <div key={study.headline} className="min-w-[280px] snap-start">
                <CaseStudyCard study={study} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works - fills bottom space */}
      <div className="border-t border-gray-200 bg-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-center text-lg font-bold text-gray-900 mb-8">How It Works</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Apply', desc: 'Tell us your acquisition criteria and goals' },
              { step: '02', title: 'Strategy Call', desc: 'We build a custom sourcing plan for your search' },
              { step: '03', title: 'Launch Campaign', desc: 'Our team starts outreach to matching owners' },
              { step: '04', title: 'Get Meetings', desc: 'We book qualified meetings on your calendar' },
            ].map((item, i) => (
              <div key={item.step} className="text-center">
                <div className={`w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.step}
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Trusted by <span className="font-semibold text-gray-900">400+ searchers</span> across the country
            </p>
          </div>
        </div>
      </div>

      <LanderFooter />
    </div>
  );
}

function CaseStudyCard({ study }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{study.tag}</span>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{study.headline}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{study.desc}</p>
      </div>
      <div className="grid grid-cols-3 border-t border-gray-100 bg-gray-50/50">
        {study.stats.map((stat) => (
          <div key={stat.label} className="p-2.5 text-center border-r last:border-r-0 border-gray-100">
            <div className="text-sm font-bold text-emerald-600">{stat.value}</div>
            <div className="text-[10px] text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LanderFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Lended Search. All rights reserved. | lendedsearch.com
        </p>
        <p className="text-xs text-gray-400 mt-2">
          This is not an offer to lend. Results vary based on market conditions, criteria, and other factors.
        </p>
      </div>
    </footer>
  );
}
