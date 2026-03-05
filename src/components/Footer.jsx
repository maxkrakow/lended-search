import React from 'react';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

const footerLinks = [
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Who We Serve', href: '#built-for' },
  { name: 'Results', href: '#case-studies' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'FAQ', href: '#faq' },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Lended Search" className="h-10 w-auto" />
          </a>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                {link.name}
              </a>
            ))}
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              Book a Call
            </a>
          </div>

          <div className="text-sm text-gray-400">
            max@lended.ai
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Lended Search. All rights reserved. | lendedsearch.com
          </p>
        </div>
      </div>
    </footer>
  );
}
