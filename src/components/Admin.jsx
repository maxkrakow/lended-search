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
  { id: 'motivation', label: 'Situation' },
  { id: 'searcher_type', label: 'Type' },
  { id: 'industry', label: 'Industry' },
  { id: 'deal_size', label: 'Deal Size' },
  { id: 'location', label: 'Location' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'current_search', label: 'Sourcing' },
  { id: 'program', label: 'Program' },
  { id: 'contact', label: 'Contact' },
];

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
            <span className="text-sm font-semibold text-gray-900">Lead Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{leads.length} leads</span>
            <button
              onClick={fetchLeads}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>
    </div>
  );
}
