import React, { useState, useEffect } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const CALENDLY = 'https://calendly.com/lended/lended-search-off-market-deal-sourcing';

const navigation = [
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Who We Serve', href: '#built-for' },
  { name: 'Results', href: '#case-studies' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'FAQ', href: '#faq' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
    }`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Lended Search" className="h-10 w-auto" />
          </a>

          <div className="hidden lg:flex lg:items-center lg:gap-x-8">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                {item.name}
              </a>
            ))}
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="ml-4 inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
              Book Strategy Session
            </a>
          </div>

          <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden pb-6 pt-2 bg-white rounded-b-2xl shadow-lg">
            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  {item.name}
                </a>
              ))}
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="mt-4 block rounded-full bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white">
                Book Strategy Session
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
