import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/20/solid';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

const questions = [
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
    id: 'target_sde',
    question: 'What\'s your target SDE (Seller\'s Discretionary Earnings) range?',
    type: 'select',
    options: [
      { label: '$250K – $500K', value: '250-500' },
      { label: '$500K – $1M', value: '500-1m' },
      { label: '$1M – $3M', value: '1m-3m' },
      { label: '$3M+', value: '3m+' },
      { label: 'Not sure yet', value: 'unsure' },
    ],
  },
  {
    id: 'target_revenue',
    question: 'What annual revenue range are you targeting?',
    type: 'select',
    options: [
      { label: '$1M – $3M', value: '1-3m' },
      { label: '$3M – $5M', value: '3-5m' },
      { label: '$5M – $10M', value: '5-10m' },
      { label: '$10M+', value: '10m+' },
      { label: 'Flexible / Not sure', value: 'flexible' },
    ],
  },
  {
    id: 'deal_size',
    question: 'What\'s your total deal size budget?',
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
    id: 'liquid_cash',
    question: 'How much liquid cash do you have available for a down payment?',
    type: 'select',
    showIf: (answers) => {
      const ds = answers.deal_size;
      return ds && ds !== 'under-500k';
    },
    options: [
      { label: 'Under $100K', value: 'under-100k' },
      { label: '$100K – $250K', value: '100-250k' },
      { label: '$250K – $500K', value: '250-500k' },
      { label: '$500K – $1M', value: '500k-1m' },
      { label: '$1M+', value: '1m+' },
    ],
  },
  {
    id: 'location',
    question: 'Where are you looking to acquire?',
    type: 'select',
    options: [
      { label: 'Specific state or metro area', value: 'specific' },
      { label: 'Regional (multi-state)', value: 'regional' },
      { label: 'Nationwide', value: 'nationwide' },
      { label: 'Open to anywhere', value: 'anywhere' },
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
    id: 'us_resident',
    question: 'Are you a US citizen or permanent resident?',
    type: 'select',
    showIf: (answers) => {
      const r = answers.readiness;
      return r === 'asap' || r === '3-6mo';
    },
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'current_search',
    question: 'How are you currently sourcing deals?',
    type: 'select',
    options: [
      { label: 'Brokers and listing sites only', value: 'brokers' },
      { label: 'Some direct outreach on my own', value: 'some-outreach' },
      { label: 'Working with another sourcing firm', value: 'other-firm' },
      { label: 'Haven\'t started yet', value: 'not-started' },
    ],
  },
  {
    id: 'name',
    question: 'What\'s your name?',
    type: 'text',
    placeholder: 'Full name',
  },
  {
    id: 'email',
    question: 'What\'s the best email to reach you?',
    type: 'email',
    placeholder: 'you@example.com',
  },
];

const processSteps = [
  { label: 'Apply', icon: '01' },
  { label: 'Strategy Call', icon: '02' },
  { label: 'Launch Campaign', icon: '03' },
  { label: 'Get Meetings', icon: '04' },
];

export default function Lander() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [textValue, setTextValue] = useState('');

  // Filter questions based on conditional logic
  const activeQuestions = questions.filter(
    (q) => !q.showIf || q.showIf(answers)
  );

  const currentQuestion = activeQuestions[currentStep];
  const totalSteps = activeQuestions.length;
  const progress = ((currentStep) / totalSteps) * 100;

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
      setTextValue('');
    } else {
      setSubmitted(true);
    }
  }, [currentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
      setTextValue('');
    }
  }, [currentStep]);

  const handleSelect = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setTimeout(() => goNext(), 300);
  }, [goNext]);

  const handleTextSubmit = useCallback((e) => {
    e.preventDefault();
    if (textValue.trim()) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: textValue.trim() }));
      goNext();
    }
  }, [textValue, currentQuestion, goNext]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            className="text-center max-w-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <CheckIcon className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">You're In.</h2>
            <p className="text-gray-400 mb-8">
              Based on your answers, you look like a great fit. Book your free strategy session below and we'll build a custom sourcing plan for your criteria.
            </p>
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
            >
              Book Your Free Strategy Session
              <ArrowRightIcon className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
        <LanderFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-800">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <header className="pt-6 pb-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Lended Search" className="h-8 w-auto" />
          </a>
          <span className="text-xs text-slate-500">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Hero text (only on first step) */}
      <AnimatePresence>
        {currentStep === 0 && (
          <motion.div
            className="text-center px-4 pt-6 pb-2"
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3">
              We Find, Vet & Book Meetings With{' '}
              <span className="text-emerald-400">Motivated Sellers</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Answer a few quick questions to see if off-market deal sourcing is right for your search.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
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
              <p className="text-2xl sm:text-3xl font-bold text-white mb-8">
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
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-slate-700 bg-slate-900/50 text-gray-300 hover:border-slate-500 hover:bg-slate-800/50'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {(currentQuestion.type === 'text' || currentQuestion.type === 'email') && (
                <form onSubmit={handleTextSubmit}>
                  <input
                    type={currentQuestion.type}
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    autoFocus
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-5 py-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!textValue.trim()}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:hover:bg-emerald-500"
                  >
                    Continue
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {currentStep > 0 && (
            <button
              onClick={goBack}
              className="mt-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
      </div>

      {/* Process steps bar */}
      <div className="border-t border-slate-800 bg-slate-900/50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {processSteps.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs font-medium ${
                    i === 0 ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < processSteps.length - 1 && (
                  <div className="flex-1 h-px bg-slate-800 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <LanderFooter />
    </div>
  );
}

function LanderFooter() {
  return (
    <footer className="border-t border-slate-800 py-6 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Lended Search. All rights reserved. | lendedsearch.com
        </p>
        <p className="text-xs text-slate-700 mt-2">
          This is not an offer to lend. Results vary based on market conditions, criteria, and other factors.
        </p>
      </div>
    </footer>
  );
}
