import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/20/solid';

const withoutItems = [
  '12-24 months to find a deal',
  'Competing with 50+ buyers on every listing',
  '15-20 hours/week on sourcing',
  'Inconsistent, broker-dependent pipeline',
  'Scrambling for deal flow',
];

const withItems = [
  '3-6 months to LOI',
  'First-mover access — off-market or early on-market',
  'Meetings booked on your calendar',
  'Consistent pipeline every week',
  'Focus on diligence and closing',
];

export default function Comparison() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Your Search <span className="text-gradient">With Us</span> vs. Without Us
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Without */}
          <div className="rounded-2xl bg-white border border-red-100 p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 mb-8">
              <XMarkIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600">Without Lended Search</span>
            </div>
            <ul className="space-y-4">
              {withoutItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <XMarkIcon className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-gray-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div className="rounded-2xl bg-white border-2 border-emerald-200 p-8 shadow-sm ring-1 ring-emerald-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 mb-8">
              <CheckIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">With Lended Search</span>
            </div>
            <ul className="space-y-4">
              {withItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-900 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
