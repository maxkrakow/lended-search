import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

export default function CTA() {
  return (
    <section id="cta" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />

          <div className="relative px-8 py-16 sm:px-16 sm:py-20 lg:py-24 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
              Stop Searching. Start Finding.
            </h2>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-4">
              Getting started takes 20 minutes. Book a free strategy session and we'll map out your criteria, show you relevant case studies, and build a custom sourcing plan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-emerald-700 hover:bg-emerald-50 transition-all shadow-lg"
              >
                Book a Free Strategy Session
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <p className="mt-6 text-sm text-emerald-200">
              Free 20-minute call. No commitment. No pitch on the first call.
            </p>

            {/* Three steps mini */}
            <div className="mt-12 grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { num: '1', text: 'Book a Strategy Session' },
                { num: '2', text: 'We Launch Your Campaign' },
                { num: '3', text: 'Meetings Start Booking' },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {step.num}
                  </div>
                  <p className="text-sm text-white font-medium">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
