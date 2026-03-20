import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';

const ACCESS_CODE = '54245';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'met', label: 'Met With', color: 'bg-purple-100 text-purple-700' },
  { value: 'moving_forward', label: 'Moving Forward', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-800' },
  { value: 'not_qualified', label: 'Not Qualified', color: 'bg-gray-100 text-gray-500' },
];

function getStatusStyle(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-gray-100 text-gray-500';
}

function getStatusLabel(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status || 'New';
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const FIELD_LABELS = {
  motivation: 'Situation',
  searcher_type: 'Type',
  industry: 'Industry',
  target_sde: 'Target SDE',
  target_revenue: 'Target Revenue',
  deal_size: 'Deal Size',
  liquid_cash: 'Liquid Cash',
  location: 'Location',
  readiness: 'Readiness',
  us_resident: 'US Resident',
  current_search: 'Current Search',
  program: 'Program',
  name: 'First Name',
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
};

const FUNNEL_STEPS = [
  { id: 'page_visit', label: 'Page Visit' },
  { id: 'contact', label: 'Submitted Info' },
  { id: 'motivation', label: 'Situation' },
  { id: 'searcher_type', label: 'Type' },
  { id: 'industry', label: 'Industry' },
  { id: 'deal_size', label: 'Deal Size' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'program', label: 'Program' },
];

// --- Demo Data ---

const ON_MARKET_STEPS = [
  { key: 'scraped', label: 'Listing Scraped' },
  { key: 'texted', label: 'Text Sent' },
  { key: 'no_response', label: 'No Response (10 min)' },
  { key: 'called', label: 'Called' },
  { key: 'meeting_booked', label: 'Meeting Booked' },
  { key: 'loi_submitted', label: 'LOI Submitted' },
];

const OFF_MARKET_STEPS = [
  { key: 'identified', label: 'Owner Identified' },
  { key: 'called', label: 'Call Made' },
  { key: 'conversation_had', label: 'Conversation Had' },
  { key: 'meeting_booked', label: 'Meeting Booked' },
  { key: 'loi_submitted', label: 'LOI Submitted' },
];

const DEMO_OFF_MARKET = [
  {
    id: 'off1',
    name: 'Precision Metal Fabrication Co.',
    industry: 'Manufacturing',
    revenue: '$4.2M',
    sde: '$1.1M',
    location: 'Columbus, OH',
    askingPrice: '$3.8M',
    ownerAge: '67',
    status: 'meeting_booked',
    searcher: 'Jake P.',
    timeline: [
      { step: 'identified', date: 'Mar 3', note: 'Found via SOS database — owner registered 1987' },
      { step: 'called', date: 'Mar 4', note: 'Cold call, spoke with receptionist, owner callback scheduled' },
      { step: 'conversation_had', date: 'Mar 5', note: 'Owner interested in retiring within 12 months, no broker yet' },
      { step: 'meeting_booked', date: 'Mar 7', note: 'In-person meeting set for Mar 14 at facility' },
    ],
  },
  {
    id: 'off2',
    name: 'Greenfield Landscaping & Irrigation',
    industry: 'Home Services',
    revenue: '$2.8M',
    sde: '$720K',
    location: 'Austin, TX',
    askingPrice: 'Not listed — exploring',
    ownerAge: '59',
    status: 'conversation_had',
    searcher: 'Sarah M.',
    timeline: [
      { step: 'identified', date: 'Mar 6', note: 'Email campaign — owner responded to direct mail' },
      { step: 'called', date: 'Mar 7', note: 'Follow-up call, owner open to discussion' },
      { step: 'conversation_had', date: 'Mar 10', note: 'Owner exploring options, wants to stay on 6 months post-close' },
    ],
  },
  {
    id: 'off3',
    name: 'Summit HVAC Services',
    industry: 'HVAC',
    revenue: '$5.1M',
    sde: '$1.4M',
    location: 'Denver, CO',
    askingPrice: '$4.5M',
    ownerAge: '62',
    status: 'loi_submitted',
    searcher: 'Jake P.',
    timeline: [
      { step: 'identified', date: 'Feb 15', note: 'Targeted outreach — 30+ year owner, no succession plan' },
      { step: 'called', date: 'Feb 16', note: 'Connected directly, very motivated seller' },
      { step: 'conversation_had', date: 'Feb 18', note: 'Detailed financials shared, clean books' },
      { step: 'meeting_booked', date: 'Feb 21', note: 'On-site tour and meeting with owner + bookkeeper' },
      { step: 'loi_submitted', date: 'Mar 5', note: 'LOI submitted at $4.5M, 60-day diligence period' },
    ],
  },
  {
    id: 'off4',
    name: 'Reliable Plumbing Group',
    industry: 'Plumbing',
    revenue: '$3.5M',
    sde: '$900K',
    location: 'Phoenix, AZ',
    askingPrice: 'TBD',
    ownerAge: '71',
    status: 'called',
    searcher: 'Sarah M.',
    timeline: [
      { step: 'identified', date: 'Mar 12', note: 'Owner flagged via aging owner filter, in business 40+ years' },
      { step: 'called', date: 'Mar 13', note: 'Left voicemail, follow-up call scheduled for Mar 15' },
    ],
  },
  {
    id: 'off5',
    name: 'Cascade Environmental Services',
    industry: 'Environmental Services',
    revenue: '$6.2M',
    sde: '$1.6M',
    location: 'Portland, OR',
    askingPrice: '$5.8M',
    ownerAge: '64',
    status: 'meeting_booked',
    searcher: 'Jake P.',
    timeline: [
      { step: 'identified', date: 'Feb 28', note: 'Referral from industry contact' },
      { step: 'called', date: 'Mar 1', note: 'Initial call, owner receptive' },
      { step: 'conversation_had', date: 'Mar 3', note: 'Owner wants full exit, recurring municipal contracts in place' },
      { step: 'meeting_booked', date: 'Mar 8', note: 'Meeting scheduled Mar 18 with owner and his attorney' },
    ],
  },
];

const DEMO_ON_MARKET = [
  {
    id: 'on1',
    name: 'Pacific Coast Commercial Cleaning',
    industry: 'Janitorial / Commercial Cleaning',
    revenue: '$1.9M',
    sde: '$480K',
    location: 'San Diego, CA',
    askingPrice: '$1.6M',
    source: 'BizBuySell',
    listedDate: 'Mar 8',
    status: 'meeting_booked',
    searcher: 'Jake P.',
    timeToContact: '7 min after listing',
    timeline: [
      { step: 'scraped', date: 'Mar 8, 9:02 AM', note: 'Listing detected on BizBuySell — matched criteria' },
      { step: 'texted', date: 'Mar 8, 9:09 AM', note: 'Text sent to broker, 7 min after post' },
      { step: 'no_response', date: 'Mar 8, 9:19 AM', note: 'No response after 10 min' },
      { step: 'called', date: 'Mar 8, 9:20 AM', note: 'Called broker directly, got through' },
      { step: 'meeting_booked', date: 'Mar 8, 9:35 AM', note: 'Meeting booked for Mar 11 — broker said we were first caller' },
    ],
  },
  {
    id: 'on2',
    name: 'Northeast Auto Body & Repair',
    industry: 'Automotive Services',
    revenue: '$3.1M',
    sde: '$750K',
    location: 'Hartford, CT',
    askingPrice: '$2.4M',
    source: 'BizBuySell',
    listedDate: 'Mar 5',
    status: 'loi_submitted',
    searcher: 'Sarah M.',
    timeToContact: '4 min after listing',
    timeline: [
      { step: 'scraped', date: 'Mar 5, 11:15 AM', note: 'Listing detected on BizBuySell' },
      { step: 'texted', date: 'Mar 5, 11:19 AM', note: 'Text sent to broker, 4 min after post' },
      { step: 'called', date: 'Mar 5, 11:22 AM', note: 'Called broker, confirmed details, strong match' },
      { step: 'meeting_booked', date: 'Mar 6', note: 'Zoom meeting scheduled, financials shared' },
      { step: 'loi_submitted', date: 'Mar 14', note: 'LOI submitted at $2.4M asking price' },
    ],
  },
  {
    id: 'on3',
    name: 'Sunshine Pool & Spa Maintenance',
    industry: 'Pool Services',
    revenue: '$1.2M',
    sde: '$350K',
    location: 'Tampa, FL',
    askingPrice: '$950K',
    source: 'BizBuySell',
    listedDate: 'Mar 11',
    status: 'called',
    searcher: 'Jake P.',
    timeToContact: '12 min after listing',
    timeline: [
      { step: 'scraped', date: 'Mar 11, 2:30 PM', note: 'Listing detected on BizBuySell' },
      { step: 'texted', date: 'Mar 11, 2:42 PM', note: 'Text sent to broker' },
      { step: 'no_response', date: 'Mar 11, 2:52 PM', note: 'No response after 10 min' },
      { step: 'called', date: 'Mar 11, 2:53 PM', note: 'Called broker, left voicemail — callback pending' },
    ],
  },
  {
    id: 'on4',
    name: 'Apex Electrical Contractors',
    industry: 'Electrical Services',
    revenue: '$2.6M',
    sde: '$620K',
    location: 'Charlotte, NC',
    askingPrice: '$1.9M',
    source: 'BizBuySell',
    listedDate: 'Mar 10',
    status: 'meeting_booked',
    searcher: 'Sarah M.',
    timeToContact: '5 min after listing',
    timeline: [
      { step: 'scraped', date: 'Mar 10, 8:45 AM', note: 'Listing detected on BizBuySell — strong match for criteria' },
      { step: 'texted', date: 'Mar 10, 8:50 AM', note: 'Text sent to broker, 5 min after post' },
      { step: 'called', date: 'Mar 10, 8:55 AM', note: 'Called broker, connected immediately' },
      { step: 'meeting_booked', date: 'Mar 10, 9:10 AM', note: 'In-person meeting booked for Mar 13' },
    ],
  },
  {
    id: 'on5',
    name: 'Tri-State Pest Control',
    industry: 'Pest Control',
    revenue: '$1.5M',
    sde: '$410K',
    location: 'Philadelphia, PA',
    askingPrice: '$1.2M',
    source: 'BizBuySell',
    listedDate: 'Mar 12',
    status: 'texted',
    searcher: 'Jake P.',
    timeToContact: '3 min after listing',
    timeline: [
      { step: 'scraped', date: 'Mar 12, 10:22 AM', note: 'Listing detected on BizBuySell' },
      { step: 'texted', date: 'Mar 12, 10:25 AM', note: 'Text sent to broker, 3 min after post — awaiting response' },
    ],
  },
  {
    id: 'on6',
    name: 'Mountain View Roofing Co.',
    industry: 'Roofing',
    revenue: '$3.8M',
    sde: '$880K',
    location: 'Salt Lake City, UT',
    askingPrice: '$2.9M',
    source: 'BizBuySell',
    listedDate: 'Mar 7',
    status: 'meeting_booked',
    searcher: 'Sarah M.',
    timeToContact: '9 min after listing',
    timeline: [
      { step: 'scraped', date: 'Mar 7, 3:15 PM', note: 'Listing detected on BizBuySell' },
      { step: 'texted', date: 'Mar 7, 3:24 PM', note: 'Text sent to broker, 9 min after post' },
      { step: 'no_response', date: 'Mar 7, 3:34 PM', note: 'No response after 10 min' },
      { step: 'called', date: 'Mar 7, 3:35 PM', note: 'Called broker, got through, very motivated seller' },
      { step: 'meeting_booked', date: 'Mar 9', note: 'Meeting booked — broker sending CIM ahead of time' },
    ],
  },
  {
    id: 'on7',
    name: 'Coastal Lawn & Garden Services',
    industry: 'Lawn Care',
    revenue: '$2.1M',
    sde: '$540K',
    location: 'Jacksonville, FL',
    askingPrice: '$1.7M',
    source: 'BizBuySell',
    listedDate: 'Mar 13',
    status: 'called',
    searcher: 'Jake P.',
    timeToContact: '6 min after listing',
    timeline: [
      { step: 'scraped', date: 'Mar 13, 11:08 AM', note: 'Listing detected on BizBuySell — recurring revenue model' },
      { step: 'texted', date: 'Mar 13, 11:14 AM', note: 'Text sent to broker, 6 min after post' },
      { step: 'no_response', date: 'Mar 13, 11:24 AM', note: 'No response after 10 min' },
      { step: 'called', date: 'Mar 13, 11:25 AM', note: 'Called broker, scheduled callback for tomorrow' },
    ],
  },
];

function getStepColor(step, steps, currentStatus) {
  const currentIdx = steps.findIndex(s => s.key === currentStatus);
  const stepIdx = steps.findIndex(s => s.key === step.key);
  if (stepIdx < currentIdx) return 'bg-emerald-500';
  if (stepIdx === currentIdx) return 'bg-emerald-500';
  return 'bg-gray-200';
}

function getStepTextColor(step, steps, currentStatus) {
  const currentIdx = steps.findIndex(s => s.key === currentStatus);
  const stepIdx = steps.findIndex(s => s.key === step.key);
  if (stepIdx <= currentIdx) return 'text-emerald-700';
  return 'text-gray-400';
}

function ListingPopup({ listing, onClose, type }) {
  const steps = type === 'off_market' ? OFF_MARKET_STEPS : ON_MARKET_STEPS;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{listing.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{listing.industry} &middot; {listing.location}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-400">Revenue</p>
              <p className="text-sm font-semibold text-gray-900">{listing.revenue}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">SDE</p>
              <p className="text-sm font-semibold text-gray-900">{listing.sde}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Asking Price</p>
              <p className="text-sm font-semibold text-gray-900">{listing.askingPrice}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Searcher</p>
              <p className="text-sm font-semibold text-gray-900">{listing.searcher}</p>
            </div>
            {type === 'on_market' && listing.timeToContact && (
              <div>
                <p className="text-xs text-gray-400">Time to Contact</p>
                <p className="text-sm font-semibold text-emerald-600">{listing.timeToContact}</p>
              </div>
            )}
            {type === 'off_market' && listing.ownerAge && (
              <div>
                <p className="text-xs text-gray-400">Owner Age</p>
                <p className="text-sm font-semibold text-gray-900">{listing.ownerAge}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Progress */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pipeline</p>
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-3 h-3 rounded-full ${getStepColor(step, steps, listing.status)}`} />
                  <span className={`text-[10px] mt-1 text-center leading-tight ${getStepTextColor(step, steps, listing.status)}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-3 ${
                    i < steps.findIndex(s => s.key === listing.status) ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">How We Got Here</p>
          <div className="space-y-4">
            {listing.timeline.map((event, i) => {
              const stepLabel = steps.find(s => s.key === event.step)?.label || event.step;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5" />
                    {i < listing.timeline.length - 1 && <div className="w-0.5 flex-1 bg-emerald-200 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">{stepLabel}</span>
                      <span className="text-xs text-gray-400">{event.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{event.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoStatusBadge({ status, steps }) {
  const step = steps.find(s => s.key === status);
  if (!step) return null;
  const idx = steps.findIndex(s => s.key === status);
  const total = steps.length;
  const colors = idx >= total - 1
    ? 'bg-green-100 text-green-700'
    : idx >= total - 2
      ? 'bg-emerald-100 text-emerald-700'
      : idx >= total - 3
        ? 'bg-purple-100 text-purple-700'
        : 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`text-xs font-medium rounded-full px-3 py-1 ${colors}`}>
      {step.label}
    </span>
  );
}

const SEARCH_MESSAGES = [
  'Scanning listing databases...',
  'Matching to your criteria...',
  'Checking outreach pipeline...',
  'Loading results...',
];

function DemoSection() {
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [phase, setPhase] = useState('filter'); // 'filter' | 'searching' | 'results'
  const [searchMsgIdx, setSearchMsgIdx] = useState(0);

  const handleSearch = (e) => {
    e.preventDefault();
    setPhase('searching');
    setSearchMsgIdx(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx >= SEARCH_MESSAGES.length) {
        clearInterval(interval);
        setTimeout(() => setPhase('results'), 400);
      } else {
        setSearchMsgIdx(idx);
      }
    }, 700);
  };

  if (phase === 'filter') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={handleSearch} className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Search Criteria</h2>
              <p className="text-sm text-gray-500 mt-1">See results from the past 2 weeks</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Industries</option>
                  <option value="Home Services">Home Services</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical Services">Electrical Services</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="Roofing">Roofing</option>
                  <option value="Lawn Care">Lawn Care</option>
                  <option value="Pool Services">Pool Services</option>
                  <option value="Automotive Services">Automotive Services</option>
                  <option value="Janitorial / Commercial Cleaning">Commercial Cleaning</option>
                  <option value="Environmental Services">Environmental Services</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Locations</option>
                  <option value="Northeast">Northeast</option>
                  <option value="Southeast">Southeast</option>
                  <option value="Midwest">Midwest</option>
                  <option value="Southwest">Southwest</option>
                  <option value="West">West</option>
                  <option value="Northwest">Northwest</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
            >
              Search Listings
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (phase === 'searching') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-700">{SEARCH_MESSAGES[searchMsgIdx]}</p>
          <div className="flex justify-center gap-1.5 mt-4">
            {SEARCH_MESSAGES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${i <= searchMsgIdx ? 'bg-emerald-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Results — Past 2 Weeks</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {DEMO_OFF_MARKET.length} off-market &middot; {DEMO_ON_MARKET.length} on-market listings
            {(industry || location) && <span> &middot; Filtered by {[industry, location].filter(Boolean).join(', ')}</span>}
          </p>
        </div>
        <button
          onClick={() => setPhase('filter')}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          New Search
        </button>
      </div>

      {/* Off Market Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900">Off Market</h3>
          <span className="text-xs text-gray-400">{DEMO_OFF_MARKET.length} listings from direct outreach</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Industry</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SDE</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Searcher</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_OFF_MARKET.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-50 hover:bg-emerald-50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedListing(listing); setSelectedType('off_market'); }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{listing.name}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.industry}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.revenue}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.sde}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.location}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.searcher}</td>
                    <td className="px-4 py-3">
                      <DemoStatusBadge status={listing.status} steps={OFF_MARKET_STEPS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* On Market Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900">On Market</h3>
          <span className="text-xs text-gray-400">{DEMO_ON_MARKET.length} active listings our searchers are engaged with</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Industry</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SDE</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Searcher</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ON_MARKET.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-50 hover:bg-emerald-50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedListing(listing); setSelectedType('on_market'); }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{listing.name}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.industry}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.revenue}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.sde}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.location}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.source}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.searcher}</td>
                    <td className="px-4 py-3">
                      <DemoStatusBadge status={listing.status} steps={ON_MARKET_STEPS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Popup */}
      {selectedListing && (
        <ListingPopup
          listing={selectedListing}
          type={selectedType}
          onClose={() => { setSelectedListing(null); setSelectedType(null); }}
        />
      )}
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [funnelData, setFunnelData] = useState(null);
  const [showFunnel, setShowFunnel] = useState(false);
  const [activeTab, setActiveTab] = useState('demo');

  const handleLogin = (e) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      setAuthed(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let snapshot;
      try {
        const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        snapshot = await getDocs(q);
      } catch (indexErr) {
        // Fallback if index doesn't exist yet
        snapshot = await getDocs(collection(db, 'leads'));
      }
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort client-side as fallback
      data.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
    setLoading(false);
  };

  const fetchFunnel = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'funnel_sessions'));
      const sessions = snapshot.docs.map((d) => d.data());
      const total = sessions.length;
      const completed = sessions.filter((s) => s.completed).length;
      const stepCounts = {};
      FUNNEL_STEPS.forEach((s) => { stepCounts[s.id] = 0; });
      sessions.forEach((session) => {
        (session.steps || []).forEach((stepId) => {
          if (stepCounts[stepId] !== undefined) stepCounts[stepId]++;
        });
        if (session.completed) stepCounts['contact'] = (stepCounts['contact'] || 0) + 1;
      });
      setFunnelData({ total, completed, stepCounts });
    } catch (err) {
      console.error('Error fetching funnel:', err);
    }
  };

  useEffect(() => {
    if (authed) { fetchLeads(); fetchFunnel(); }
  }, [authed]);

  const updateStatus = async (leadId, newStatus) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <img src="/logo.png" alt="Lended Search" className="h-10 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your access code</p>
            </div>
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(false); }}
              placeholder="Access code"
              autoFocus
              className={`w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-1 transition-all ${
                codeError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
            />
            {codeError && (
              <p className="text-sm text-red-500 text-center mt-2">Wrong code</p>
            )}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    );
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter((l) => (l.status || 'new') === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Lended Search" className="h-8" />
            <span className="text-sm font-semibold text-gray-900">Admin</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'demo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'leads' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Leads
            </button>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'leads' && (
              <>
                <span className="text-sm text-gray-500">{leads.length} leads</span>
                <button
                  onClick={fetchLeads}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'demo' ? (
          <DemoSection />
        ) : (
          <>
            {/* Funnel toggle */}
            <div className="mb-6">
              <button
                onClick={() => setShowFunnel(!showFunnel)}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                {showFunnel ? 'Hide' : 'Show'} Funnel Analytics
              </button>
              {showFunnel && funnelData && (
                <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Lander Funnel</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{funnelData.total} started</span>
                      <span className="text-emerald-600 font-semibold">{funnelData.completed} completed</span>
                      <span className="text-gray-500">
                        {funnelData.total > 0 ? Math.round((funnelData.completed / funnelData.total) * 100) : 0}% conversion
                      </span>
                      <button onClick={fetchFunnel} className="text-emerald-600 hover:text-emerald-700 font-medium">Refresh</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {FUNNEL_STEPS.map((step, i) => {
                      const count = funnelData.stepCounts[step.id] || 0;
                      const pct = funnelData.total > 0 ? (count / funnelData.total) * 100 : 0;
                      const prevCount = i === 0 ? funnelData.total : (funnelData.stepCounts[FUNNEL_STEPS[i - 1].id] || 0);
                      const dropoff = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
                      return (
                        <div key={step.id} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 text-right">{step.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                              {count}
                            </span>
                          </div>
                          {i > 0 && dropoff > 0 && (
                            <span className="text-xs text-red-400 w-16">-{dropoff}%</span>
                          )}
                          {i === 0 && <span className="w-16" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                All ({leads.length})
              </button>
              {STATUS_OPTIONS.map((s) => {
                const count = leads.filter((l) => (l.status || 'new') === s.value).length;
                return (
                  <button
                    key={s.value}
                    onClick={() => setFilter(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filter === s.value ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s.label} ({count})
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No leads yet</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Industry</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Deal Size</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Program</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Readiness</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <React.Fragment key={lead.id}>
                          <tr
                            className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">{lead.name || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.email || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.phone || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.searcher_type || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.industry || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.deal_size || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.program || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{lead.readiness || '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(lead.createdAt)}</td>
                            <td className="px-4 py-3">
                              <select
                                value={lead.status || 'new'}
                                onChange={(e) => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${getStatusStyle(lead.status || 'new')}`}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          {expandedId === lead.id && (
                            <tr className="bg-gray-50">
                              <td colSpan={9} className="px-4 py-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {Object.entries(FIELD_LABELS).map(([key, label]) => (
                                    lead[key] ? (
                                      <div key={key}>
                                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                        <p className="text-sm text-gray-900">{lead[key]}</p>
                                      </div>
                                    ) : null
                                  ))}
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Source</p>
                                    <p className="text-sm text-gray-900">{lead.source || '—'}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
