import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const pains = [
  {
    icon: ClockIcon,
    stat: '12-24 mo',
    title: 'Average time to get under LOI',
    desc: 'Most searchers burn through a year before they even find something worth pursuing.',
  },
  {
    icon: UsersIcon,
    stat: '50+',
    title: 'Buyers per listed deal',
    desc: 'Every listing on BizBuySell gets flooded. You\'re competing with dozens of people for the same businesses.',
  },
  {
    icon: MagnifyingGlassIcon,
    stat: '15-20 hrs',
    title: 'Per week on sourcing',
    desc: 'Time you should be spending on diligence and relationships is wasted scrolling listings and writing cold emails.',
  },
];

export default function PainPoints() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Searching for a Business Is a{' '}
            <span className="text-gradient">Full-Time Job</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            If you're a self-funded searcher, you already know the pain. You're spending hours every week chasing leads that go nowhere.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((pain, i) => (
            <motion.div
              key={pain.title}
              className="group rounded-2xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 mb-6">
                <pain.icon className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{pain.stat}</div>
              <div className="text-base font-semibold text-gray-700 mb-3">{pain.title}</div>
              <p className="text-sm text-gray-500 leading-relaxed">{pain.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
