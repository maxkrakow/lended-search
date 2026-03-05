import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Tell Us Your Criteria',
    desc: 'Sector, geography, deal size, revenue range. We build a custom sourcing plan tailored to your exact acquisition mandate.',
  },
  {
    num: '02',
    title: 'We Find the Deals',
    desc: 'On-market listings scraped daily. Off-market owners contacted directly through multi-channel outreach. Or both.',
  },
  {
    num: '03',
    title: 'We Qualify & Screen',
    desc: 'Every lead is vetted against your criteria. You only talk to sellers who actually fit and are interested in having a conversation.',
  },
  {
    num: '04',
    title: 'You Show Up to Meetings',
    desc: 'Qualified conversations booked on your calendar. You focus on evaluating deals and closing. We keep the pipeline full.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-emerald-700">Simple 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            You tell us what you're looking for. We fill your pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative rounded-2xl bg-white border border-gray-100 p-8 lg:p-10 shadow-sm hover:shadow-md transition-all group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-6">
                <span className="text-xl font-bold text-white">{step.num}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
