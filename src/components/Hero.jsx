import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

const stats = [
  { value: '3-6', unit: 'Months', label: 'Avg. Time to LOI' },
  { value: '400+', unit: '', label: 'Deals Sourced' },
  { value: '$500M+', unit: '', label: 'Pipeline Generated' },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-to-b from-emerald-50/50 to-white">
      {/* Subtle background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-teal-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 mb-8">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-700">Off-market deal origination for acquisition entrepreneurs</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Find Your Business{' '}
            <span className="text-gradient">Faster.</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            The average searcher spends 12-24 months looking for a deal.{' '}
            <span className="text-gray-900 font-semibold">Our clients get under LOI in 3-6.</span>
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              Book a Free Strategy Session
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-8 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          className="mt-20 grid grid-cols-3 gap-4 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center px-4 py-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600">
                {stat.value}{stat.unit}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
