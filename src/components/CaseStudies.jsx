import React from 'react';
import { motion } from 'framer-motion';

const studies = [
  {
    tag: 'Self-Funded Searcher',
    sector: 'Home Services, Texas',
    headline: 'LOI in 4 Months',
    desc: 'Was 8 months into a search with no pipeline. We launched off-market outreach across Texas. 37 qualified conversations in 90 days. Under LOI on a $3.5M HVAC business by month 4.',
    stats: [
      { value: '37', label: 'Qualified Conversations' },
      { value: '90', label: 'Days to Pipeline' },
      { value: '$3.5M', label: 'Business Value' },
    ],
  },
  {
    tag: 'Search Fund',
    sector: 'Manufacturing, Midwest',
    headline: '47 Conversations in 90 Days',
    desc: 'Traditional search fund had been relying on brokers for 6 months. We added direct-to-owner outreach in IL, OH, and IN. First meeting in 11 days. 3 deals in active diligence.',
    stats: [
      { value: '47', label: 'Conversations' },
      { value: '11', label: 'Days to First Meeting' },
      { value: '3', label: 'Deals in Diligence' },
    ],
  },
  {
    tag: 'Independent Sponsor',
    sector: 'Business Services, Southeast',
    headline: '22 Meetings in 30 Days',
    desc: 'Had capital committed but no deal flow. Launched multi-state campaign targeting B2B services. 22 owner meetings in first month. Closed acquisition within 6 months.',
    stats: [
      { value: '22', label: 'Owner Meetings' },
      { value: '30', label: 'Days' },
      { value: '6mo', label: 'To Close' },
    ],
  },
];

export default function CaseStudies() {
  return (
    <section id="case-studies" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-emerald-700">Proven Results</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Real Results From Real Searchers
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {studies.map((study, i) => (
            <motion.div
              key={study.headline}
              className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{study.tag}</span>
                  <span className="text-xs text-gray-400">{study.sector}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{study.headline}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{study.desc}</p>
              </div>
              <div className="grid grid-cols-3 border-t border-gray-100 bg-gray-50/50">
                {study.stats.map((stat) => (
                  <div key={stat.label} className="p-4 text-center border-r last:border-r-0 border-gray-100">
                    <div className="text-lg font-bold text-emerald-600">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
