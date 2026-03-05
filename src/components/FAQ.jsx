import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

const faqs = [
  {
    q: 'How fast will I see results?',
    a: 'Most clients see first qualified meetings within 14-21 days. Full pipeline momentum within 30-60 days.',
  },
  {
    q: 'What if my sector or geography is too niche?',
    a: 'We validate your target market before we launch. If the pool is too small, we\'ll tell you and help adjust your criteria.',
  },
  {
    q: 'Is this just another lead gen service?',
    a: 'No. We\'re not handing you a list and wishing you luck. We do the outreach, screen every response, and book the meetings. You just show up.',
  },
  {
    q: 'Can I switch tiers or cancel anytime?',
    a: 'Yes. No long-term contracts. Upgrade, downgrade, or cancel month to month.',
  },
  {
    q: 'How do I know this will work for my sector?',
    a: 'We\'ve worked across healthcare, manufacturing, business services, industrials, and more. Before we launch anything, we validate that your target pool has sufficient addressable contacts. We\'ll tell you upfront if the math doesn\'t work for your niche.',
  },
  {
    q: 'Can you guarantee results?',
    a: 'We can\'t guarantee a closed deal — no one can. What we can guarantee is a consistent volume of direct, pre-qualified conversations with motivated sellers. Our clients typically see 10-50 qualified conversations per month at scale.',
  },
];

function FAQItem({ faq, isOpen, onClick }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-gray-900 pr-8">{faq.q}</span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-500 leading-relaxed">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Common Questions
          </h2>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-8">
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.q}
              faq={faq}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
