import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Sections/Header';
import Footer from '../components/Sections/Footer';
import { RevealOnScroll, Button, Label } from '../components/Common/UI';
import Icons from '../components/Icons';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatPopulation = (n) => {
  if (!n) return 'N/A';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
};

const riskConfig = {
  HIGH:     { color: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'High Risk' },
  MODERATE: { color: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', label: 'Moderate Risk' },
  LOW:      { color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', label: 'Low Risk' },
  MINIMAL:  { color: 'bg-emerald-400',text: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200',label: 'Minimal Risk' },
};

const multiplierBadge = (x) => {
  if (!x) return null;
  if (x >= 50) return 'bg-red-900 text-white';
  if (x >= 5) return 'bg-red-100 text-red-700';
  return 'bg-orange-100 text-orange-700';
};

// ── Skeleton Loader ──────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="bg-[#FCFBF9] min-h-screen">
    <div className="bg-[#1C1917] pt-28 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="h-4 w-32 bg-white/10 rounded mb-4 animate-pulse" />
        <div className="h-10 w-80 bg-white/10 rounded mb-3 animate-pulse" />
        <div className="h-5 w-64 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-stone-100 p-8 animate-pulse">
          <div className="h-5 w-48 bg-stone-200 rounded mb-4" />
          <div className="h-4 w-full bg-stone-100 rounded mb-2" />
          <div className="h-4 w-3/4 bg-stone-100 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// ── Not Found State ──────────────────────────────────────────────────────────

const NotFound = ({ zip, onRetry }) => (
  <div className="bg-[#FCFBF9] min-h-screen">
    <div className="bg-[#1C1917] pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-6">
          <Icons.MapPin className="w-3 h-3" /> ZIP {zip}
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">No Data Available</h1>
        <p className="text-stone-400 text-base max-w-md mx-auto mb-8">
          We don't have water quality records for this ZIP code. This area may be served by a small private system not in our database.
        </p>
        <SearchInline onSearch={onRetry} dark />
      </div>
    </div>
  </div>
);

// ── Location index (shared with IntegratedScanner) ──────────────────────────

let _locationsCache = null;
const loadLocations = async () => {
  if (_locationsCache) return _locationsCache;
  try {
    const res = await fetch('/locations.json');
    if (res.ok) _locationsCache = await res.json();
  } catch { /* silent */ }
  return _locationsCache || [];
};

const fuzzyMatch = (query, locations, limit = 6) => {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  if (/^\d+$/.test(q)) {
    return locations.filter(([zip]) => zip.startsWith(q)).slice(0, limit);
  }

  const parts = q.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const scored = [];

  for (const loc of locations) {
    const [, city, state] = loc;
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();
    let score = 0;

    if (cityLower === q) score = 100;
    else if (cityLower.startsWith(q)) score = 80;
    else if (parts.length >= 2) {
      const cityMatch = cityLower.startsWith(parts[0]);
      const stateMatch = stateLower.startsWith(parts[parts.length - 1]) || stateLower === parts[parts.length - 1];
      if (cityMatch && stateMatch) score = 90;
      else if (cityMatch) score = 60;
    }
    else if (cityLower.includes(q)) score = 50;
    else if (q.length === 2 && stateLower === q) score = 30;

    if (score > 0) scored.push({ loc, score });
  }

  scored.sort((a, b) => b.score - a.score || a.loc[1].localeCompare(b.loc[1]));

  const seen = new Set();
  const results = [];
  for (const { loc } of scored) {
    const key = `${loc[1]}|${loc[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(loc);
    if (results.length >= limit) break;
  }
  return results;
};

// ── Inline Search ────────────────────────────────────────────────────────────

const SearchInline = ({ onSearch, dark = false }) => {
  const [input, setInput] = useState('');
  const [zip, setZip] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [locations, setLocations] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => { loadLocations().then(setLocations); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateInput = useCallback((value) => {
    setInput(value);
    setHighlightIdx(-1);

    const digits = value.replace(/\D/g, '');
    if (/^\d{5}$/.test(digits)) {
      setZip(digits);
      setShowSuggestions(false);
      return;
    }
    setZip('');

    if (value.trim().length >= 2 && locations.length > 0) {
      const matches = fuzzyMatch(value, locations);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [locations]);

  const selectSuggestion = (loc) => {
    const [selectedZip, city, state] = loc;
    setInput(`${city}, ${state} ${selectedZip}`);
    setZip(selectedZip);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(prev => Math.min(prev + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[highlightIdx]); }
    else if (e.key === 'Escape') { setShowSuggestions(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = zip.trim();
    if (cleaned.length === 5 && /^\d+$/.test(cleaned)) {
      onSearch(cleaned);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2 max-w-sm mx-auto">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="ZIP or city name"
          value={input}
          onChange={(e) => updateInput(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full h-11 px-5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f2663b]/40 transition-all ${
            dark
              ? 'bg-white/10 text-white placeholder:text-stone-500 border border-white/20'
              : 'bg-white text-[#2A2422] placeholder:text-stone-400 border border-stone-200'
          }`}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50"
          >
            {suggestions.map((loc, i) => {
              const [sZip, city, state] = loc;
              return (
                <button
                  key={sZip}
                  type="button"
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors text-sm ${
                    i === highlightIdx ? 'bg-[#FFF7ED]' : 'hover:bg-stone-50'
                  }`}
                  onClick={() => selectSuggestion(loc)}
                  onMouseEnter={() => setHighlightIdx(i)}
                >
                  <span className="text-[#2A2422]">
                    <span className="font-medium">{city}</span>
                    <span className="text-stone-400">, {state}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">{sZip}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <Button variant={dark ? 'outline' : 'primary'} className="h-11 px-5 text-[10px] shrink-0" disabled={!zip}>
        Search
      </Button>
    </form>
  );
};

// ── Contaminant Card ─────────────────────────────────────────────────────────

const ContaminantCard = ({ item, index }) => {
  const [expanded, setExpanded] = useState(index < 3);
  const badge = multiplierBadge(item.ewg_multiplier);
  const borderColor = item.exceeds_epa ? 'border-l-red-500' : 'border-l-[#f2663b]';

  return (
    <RevealOnScroll delay={index * 80}>
      <div className={`bg-white rounded-2xl border border-stone-100 shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer hover:bg-stone-50/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <Icons.AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-[#2A2422] uppercase tracking-wide truncate">{item.name}</h4>
              <span className="text-xs text-stone-400 font-mono">{item.value} {item.unit}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {badge && item.ewg_multiplier && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${badge}`}>
                {item.ewg_multiplier}× EWG
              </span>
            )}
            {expanded ? <Icons.ChevronUp className="w-4 h-4 text-stone-400" /> : <Icons.ChevronDown className="w-4 h-4 text-stone-400" />}
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0 space-y-4 border-t border-stone-100">
            {/* Bar comparison */}
            <div className="space-y-2.5 pt-4">
              {/* Detected value bar */}
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                  <span className="text-[#2A2422]">Detected</span>
                  <span className="font-mono text-[#2A2422]">{item.value} {item.unit}</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, 85)}%` }} />
                </div>
              </div>

              {/* EWG limit bar */}
              {item.ewg_limit_str && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-[#f2663b]">EWG Health Guideline</span>
                    <span className="font-mono text-[#f2663b]">{item.ewg_limit_str}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#f2663b]/30 rounded-full" style={{ width: `${Math.min(100, item.ewg_multiplier ? Math.max(3, 85 / item.ewg_multiplier) : 50)}%` }} />
                  </div>
                </div>
              )}

              {/* EPA limit bar */}
              {item.epa_limit_str && item.epa_limit_str !== 'No legal limit' && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-stone-400">EPA Legal Limit</span>
                    <span className="font-mono text-stone-400">{item.epa_limit_str}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-300 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              {item.exceeds_epa ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide border border-red-100">
                  <Icons.Close className="w-3 h-3" strokeWidth={3} /> Exceeds EPA Limit
                </span>
              ) : item.epa_limit_str !== 'No legal limit' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                  <Icons.Check className="w-3 h-3" strokeWidth={3} /> EPA Compliant
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-50 text-stone-500 text-[10px] font-bold uppercase tracking-wide border border-stone-200">
                  No EPA Limit Set
                </span>
              )}

              {item.exceeds_ewg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wide border border-orange-100">
                  <Icons.Close className="w-3 h-3" strokeWidth={3} /> Exceeds EWG Guideline
                </span>
              )}
            </div>

            {/* Health effects */}
            {item.health_effects && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1.5">Health Risks</span>
                <div className="flex flex-wrap gap-1.5">
                  {item.health_effects.split('; ').map((effect, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-50/80 text-red-700/80 text-[11px] font-medium rounded-md">
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
};

// ── Violation Contaminant Card (enriched with measured values) ───────────────

const ViolationContaminantCard = ({ item, index }) => {
  const [expanded, setExpanded] = useState(index < 3);
  const badge = multiplierBadge(item.ewg_multiplier);
  const isOpen = item.status !== 'Resolved' && item.status !== 'Returned to Compliance';
  const borderColor = isOpen ? 'border-l-red-500' : item.exceeds_ewg ? 'border-l-[#f2663b]' : 'border-l-stone-300';

  return (
    <RevealOnScroll delay={index * 80}>
      <div className={`bg-white rounded-2xl border border-stone-100 shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer hover:bg-stone-50/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'bg-red-50' : 'bg-orange-50'}`}>
              <Icons.AlertTriangle className={`w-4 h-4 ${isOpen ? 'text-red-500' : 'text-orange-500'}`} />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-[#2A2422] uppercase tracking-wide truncate">{item.contaminant_name}</h4>
              <div className="flex items-center gap-2">
                {item.measured_value != null && (
                  <span className="text-xs text-stone-400 font-mono">{item.measured_value} {item.measured_unit}</span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isOpen ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>
                  {item.status}
                </span>
                {item.is_major && <span className="px-1.5 py-0.5 rounded bg-red-900 text-white text-[8px] font-bold uppercase tracking-wider">Major</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {badge && item.ewg_multiplier && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${badge}`}>
                {item.ewg_multiplier}× EWG
              </span>
            )}
            {expanded ? <Icons.ChevronUp className="w-4 h-4 text-stone-400" /> : <Icons.ChevronDown className="w-4 h-4 text-stone-400" />}
          </div>
        </button>

        {expanded && (
          <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0 space-y-4 border-t border-stone-100">
            {/* Bar comparison — only if we have measured values */}
            {item.measured_value != null && (
              <div className="space-y-2.5 pt-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-[#2A2422]">Detected in Violation</span>
                    <span className="font-mono text-[#2A2422]">{item.measured_value} {item.measured_unit}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, 85)}%` }} />
                  </div>
                </div>

                {item.ewg_limit_str && (
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                      <span className="text-[#f2663b]">EWG Health Guideline</span>
                      <span className="font-mono text-[#f2663b]">{item.ewg_limit_str}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#f2663b]/30 rounded-full" style={{ width: `${Math.min(100, item.ewg_multiplier ? Math.max(3, 85 / item.ewg_multiplier) : 50)}%` }} />
                    </div>
                  </div>
                )}

                {item.epa_limit_str && item.epa_limit_str !== 'No legal limit' && (
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                      <span className="text-stone-400">EPA Legal Limit</span>
                      <span className="font-mono text-stone-400">{item.epa_limit_str}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-300 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              {item.exceeds_epa && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide border border-red-100">
                  <Icons.Close className="w-3 h-3" strokeWidth={3} /> Exceeds EPA Limit
                </span>
              )}
              {item.exceeds_ewg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wide border border-orange-100">
                  <Icons.Close className="w-3 h-3" strokeWidth={3} /> Exceeds EWG Guideline
                </span>
              )}
            </div>

            {/* Violation date range */}
            <div className="text-xs text-stone-400 font-mono">
              {item.begin_date && <span>Violation period: {item.begin_date}</span>}
              {item.end_date && <span> — {item.end_date}</span>}
            </div>

            {/* Health effects */}
            {item.health_effects && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1.5">Health Risks</span>
                <div className="flex flex-wrap gap-1.5">
                  {item.health_effects.split('; ').map((effect, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-50/80 text-red-700/80 text-[11px] font-medium rounded-md">
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

const DataCheckPage = () => {
  const { zip } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReport = async (zipcode) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/${zipcode}.json`);
      if (!res.ok) throw new Error('not found');
      const json = await res.json();
      setData(json);
    } catch {
      setData({ found: false, zip: zipcode });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zip) {
      fetchReport(zip);
      document.title = `Water Quality Report — ZIP ${zip} | Viven`;
    }
  }, [zip]);

  const handleSearch = (newZip) => {
    navigate(`/datacheck/${newZip}`);
  };

  if (loading) return <><Header /><Skeleton /></>;
  if (!data || !data.found) return <><Header /><NotFound zip={zip} onRetry={handleSearch} /><Footer /></>;

  const { system, risk_level, summary, contaminants = [], other_contaminants = [], violations = [] } = data;
  const risk = riskConfig[risk_level] || riskConfig.MINIMAL;
  const allContaminantNames = [
    ...contaminants.map(c => c.name),
    ...other_contaminants.map(c => c.name),
    ...violations.map(v => v.contaminant_name),
  ];

  return (
    <div className="bg-[#FCFBF9] text-[#2A2422] font-sans antialiased">
      <Header />

      {/* ── Hero Band ──────────────────────────────────────────────── */}
      <section className="bg-[#1C1917] pt-28 pb-12 md:pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <Icons.Shield className="w-64 h-64 text-white" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                <Icons.MapPin className="w-3 h-3" /> EPA Database Report
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight mb-3">
                {system.city || 'Water Report'}{system.state ? `, ${system.state}` : ''}
              </h1>
              <p className="text-stone-400 text-sm md:text-base max-w-lg">
                {system.name} · Serves {formatPopulation(system.population)} people · {system.source_type}
              </p>
            </div>
            <div className="shrink-0">
              <SearchInline onSearch={handleSearch} dark />
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk Score Band ────────────────────────────────────────── */}
      <section className="bg-[#FCFBF9] py-10 md:py-14 px-6 border-b border-stone-100">
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Risk badge */}
              <div className={`${risk.bg} ${risk.border} border rounded-2xl p-5 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1`}>
                <div className={`w-3 h-3 rounded-full ${risk.color} mb-2`} />
                <span className={`text-lg font-bold ${risk.text}`}>{risk.label}</span>
              </div>

              {/* Total contaminants */}
              <div className="bg-white border border-stone-100 rounded-2xl p-5 text-center">
                <span className="text-3xl font-bold text-[#f2663b] block">{summary.ewg_exceedances}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1 block">Exceed EWG</span>
              </div>

              {/* PFAS */}
              <div className="bg-white border border-stone-100 rounded-2xl p-5 text-center">
                <span className="text-3xl font-bold text-[#2A2422] block">
                  {summary.pfas_detected}<span className="text-base font-normal text-stone-400">/{summary.pfas_total_tested}</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1 block">PFAS Found</span>
              </div>

              {/* EPA violations */}
              <div className="bg-white border border-stone-100 rounded-2xl p-5 text-center">
                <span className="text-3xl font-bold text-[#2A2422] block">{summary.epa_health_violations}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1 block">EPA Violations</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ── PFAS Section ────────────────────────────────────────────── */}
      {contaminants.length > 0 && (
        <section className="py-14 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <RevealOnScroll>
              <Label className="text-[#f2663b]">PFAS "Forever Chemicals"</Label>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-3">
                {summary.pfas_detected} PFAS compound{summary.pfas_detected !== 1 ? 's' : ''} detected in your water
              </h2>
              <p className="text-stone-500 text-sm md:text-base max-w-2xl mb-10">
                PFAS are synthetic chemicals that never break down in the environment.
                They're linked to cancer, immune system harm, and developmental issues. Most have no federal legal limit.
              </p>
            </RevealOnScroll>

            <div className="space-y-3">
              {contaminants.map((item, i) => (
                <ContaminantCard key={item.name} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Other Contaminants (UCMR3/4, Lead & Copper) ─────────── */}
      {other_contaminants.length > 0 && (
        <section className="py-14 md:py-20 px-6 bg-white border-y border-stone-100">
          <div className="max-w-4xl mx-auto">
            <RevealOnScroll>
              <Label className="text-[#f2663b]">Additional Contaminants Detected</Label>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-3">
                {other_contaminants.filter(c => c.exceeds_ewg).length > 0
                  ? `${other_contaminants.filter(c => c.exceeds_ewg).length} more contaminant${other_contaminants.filter(c => c.exceeds_ewg).length !== 1 ? 's' : ''} exceed health guidelines`
                  : `${other_contaminants.length} additional contaminant${other_contaminants.length !== 1 ? 's' : ''} detected`}
              </h2>
              <p className="text-stone-500 text-sm md:text-base max-w-2xl mb-10">
                EPA monitoring programs have detected these contaminants in your water system, including
                disinfection byproducts, heavy metals, and industrial chemicals.
              </p>
            </RevealOnScroll>

            <div className="space-y-3">
              {other_contaminants.map((item, i) => (
                <ContaminantCard key={item.name} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EPA Violations Section (enriched with measured values) ── */}
      {violations.length > 0 && (
        <section className="py-14 md:py-20 px-6 bg-white border-y border-stone-100">
          <div className="max-w-4xl mx-auto">
            <RevealOnScroll>
              <Label>EPA Violations & Regulated Contaminants</Label>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-3">
                {violations.length} contaminant{violations.length !== 1 ? 's' : ''} with health-based violations
              </h2>
              <p className="text-stone-500 text-sm md:text-base max-w-2xl mb-10">
                Your water system has been formally cited for exceeding federal safety standards.
                {violations.some(v => v.ewg_multiplier) && ' Several of these contaminants far exceed independent health guidelines.'}
              </p>
            </RevealOnScroll>

            <div className="space-y-3">
              {violations.map((item, i) => (
                <ViolationContaminantCard key={`${item.contaminant_code}-${i}`} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Minimal Risk State ─────────────────────────────────────── */}
      {contaminants.length === 0 && other_contaminants.length === 0 && violations.length === 0 && (
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <RevealOnScroll>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <Icons.Check className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4">
                Good news for your area
              </h2>
              <p className="text-stone-500 text-base md:text-lg max-w-lg mx-auto mb-8">
                No EPA violations or contaminant exceedances were found for this water system.
                However, many common contaminants like lead from aging pipes, microplastics, and pharmaceutical residues
                are not routinely tested.
              </p>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* ── Filter Recommendation Section ──────────────────────────── */}
      {(contaminants.length > 0 || violations.length > 0) && (
        <section className="py-14 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <RevealOnScroll>
              <Label className="text-[#f2663b]">Filtration Analysis</Label>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-3">
                What it takes to clean your water
              </h2>
              <p className="text-stone-500 text-sm md:text-base max-w-2xl mb-10">
                Different filtration technologies remove different contaminants. Here's how common methods compare
                for the contaminants found in your water.
              </p>
            </RevealOnScroll>

            <RevealOnScroll>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Activated Carbon */}
                <div className="bg-white rounded-2xl border border-stone-100 p-6">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                    <span className="text-lg">1</span>
                  </div>
                  <h4 className="font-semibold text-base mb-2">Activated Carbon</h4>
                  <p className="text-stone-500 text-sm mb-4">Removes chlorine taste, some organic chemicals, and some PFAS compounds.</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-400">PFAS removal</span>
                      <span className="text-orange-500">Partial</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-400">Heavy metals</span>
                      <span className="text-red-500">Limited</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-400">Radionuclides</span>
                      <span className="text-red-500">No</span>
                    </div>
                  </div>
                </div>

                {/* Reverse Osmosis */}
                <div className="bg-white rounded-2xl border border-stone-100 p-6">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                    <span className="text-lg">2</span>
                  </div>
                  <h4 className="font-semibold text-base mb-2">Reverse Osmosis</h4>
                  <p className="text-stone-500 text-sm mb-4">Effective against most contaminants but wastes water and strips beneficial minerals.</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-400">PFAS removal</span>
                      <span className="text-emerald-500">Yes</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-400">Heavy metals</span>
                      <span className="text-emerald-500">Yes</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-400">Radionuclides</span>
                      <span className="text-emerald-500">Yes</span>
                    </div>
                  </div>
                </div>

                {/* Viven */}
                <div className="bg-[#1C1917] rounded-2xl border border-stone-800 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full bg-[#f2663b] text-white text-[9px] font-bold uppercase tracking-wider">Recommended</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#f2663b] flex items-center justify-center mb-4">
                    <Icons.Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <h4 className="font-semibold text-base mb-2">Viven Multi-Stage</h4>
                  <p className="text-stone-400 text-sm mb-4">Combines RO, activated carbon, and remineralization. Removes 99.9% of contaminants.</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-500">PFAS removal</span>
                      <span className="text-emerald-400">99.9%</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-500">Heavy metals</span>
                      <span className="text-emerald-400">99.9%</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-500">Radionuclides</span>
                      <span className="text-emerald-400">99.9%</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-stone-500">Minerals added</span>
                      <span className="text-emerald-400">Yes</span>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Dynamic contaminant removal list */}
            <RevealOnScroll>
              <div className="mt-8 bg-white rounded-2xl border border-stone-100 p-6 md:p-8">
                <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">
                  Contaminants in your water that Viven removes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(allContaminantNames)].map((name) => (
                    <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                      <Icons.Check className="w-3 h-3" strokeWidth={3} />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* ── CTA Section ────────────────────────────────────────────── */}
      <section className="bg-[#1C1917] py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <Label className="text-[#f2663b]">The Solution</Label>
            <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight leading-tight mb-6">
              Viven removes 99.9% of<br className="hidden md:block" /> what's in your water.
            </h2>

            {/* Contaminant tags */}
            {allContaminantNames.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-2xl mx-auto">
                {[...new Set(allContaminantNames)].slice(0, 12).map((name) => (
                  <span key={name} className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10">
                    {name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a href="https://buy.stripe.com/9B6dR978Fem9byOe5824003" target="_blank" rel="noopener noreferrer">
                <Button variant="primary" className="h-14 px-10 text-xs">
                  Reserve Your Viven
                  <Icons.ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link to="/science">
                <Button variant="outline" className="h-14 px-10 text-xs">
                  View the Science
                </Button>
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <Footer />
    </div>
  );
};

export default DataCheckPage;
