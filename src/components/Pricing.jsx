import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/20/solid';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

const plans = [
  {
    name: 'Listing Monitor',
    price: '$1,000',
    period: '/mo',
    popular: false,
    features: [
      'All major listing sites scraped daily',
      'Filtered to your exact criteria',
      'Outreach to matching sellers',
      'Meetings booked on your behalf',
    ],
    bestFor: 'Searchers who want full on-market coverage without the grunt work',
  },
  {
    name: 'Off-Market — State',
    price: '$3,000',
    period: '/mo',
    popular: true,
    features: [
      'Dedicated caller + email campaigns',
      'Direct outreach to owners in your state',
      'Off-market — sellers not listed anywhere',
      'Every response screened and qualified',
    ],
    bestFor: 'Searchers with a focused geographic mandate who want deals nobody else sees',
  },
  {
    name: 'Off-Market — National',
    price: '$5,000',
    period: '/mo',
    popular: false,
    features: [
      'Two dedicated callers + nationwide campaigns',
      'Direct owner outreach across multiple states',
      '20-50 qualified conversations per month',
      'Dedicated account manager',
    ],
    bestFor: 'Funds, family offices, and searchers with multi-state mandates',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-emerald-700">Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Every plan includes weekly reporting, dedicated support, and a custom acquisition criteria build. No long-term contracts.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.popular
                  ? 'bg-white border-2 border-emerald-300 shadow-lg shadow-emerald-100/50 ring-1 ring-emerald-100'
                  : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckIcon className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-6 py-3 px-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500">
                  <span className="text-gray-700 font-medium">Best for:</span> {plan.bestFor}
                </p>
              </div>

              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition-all ${
                  plan.popular
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Get Started
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
