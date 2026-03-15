import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icons from '../Icons';
import { Button } from '../Common/UI';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// Lazy-loaded location index: [[zip, city, state], ...]
let _locationsCache = null;
const loadLocations = async () => {
  if (_locationsCache) return _locationsCache;
  try {
    const res = await fetch('/locations.json');
    if (res.ok) _locationsCache = await res.json();
  } catch { /* silent */ }
  return _locationsCache || [];
};

const fuzzyMatch = (query, locations, limit = 8) => {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  // If it looks like a ZIP prefix, match ZIP codes
  if (/^\d+$/.test(q)) {
    return locations
      .filter(([zip]) => zip.startsWith(q))
      .slice(0, limit);
  }

  // Split query for "city state" or "city, state" patterns
  const parts = q.replace(/,/g, ' ').split(/\s+/).filter(Boolean);

  const scored = [];
  for (const loc of locations) {
    const [zip, city, state] = loc;
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();
    const full = `${cityLower} ${stateLower}`;

    let score = 0;

    // Exact city match
    if (cityLower === q) { score = 100; }
    // City starts with query
    else if (cityLower.startsWith(q)) { score = 80; }
    // Multi-word: first part matches city, second matches state
    else if (parts.length >= 2) {
      const cityMatch = cityLower.startsWith(parts[0]);
      const stateMatch = stateLower.startsWith(parts[parts.length - 1]) ||
                         stateLower === parts[parts.length - 1];
      if (cityMatch && stateMatch) score = 90;
      else if (cityMatch) score = 60;
    }
    // City contains query
    else if (cityLower.includes(q)) { score = 50; }
    // State code match (2 chars)
    else if (q.length === 2 && stateLower === q) { score = 30; }
    // Full string contains
    else if (full.includes(q)) { score = 20; }

    if (score > 0) scored.push({ loc, score });
  }

  // Sort by score desc, then city name
  scored.sort((a, b) => b.score - a.score || a.loc[1].localeCompare(b.loc[1]));

  // Deduplicate by city+state (show first ZIP only)
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

const IntegratedScanner = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('input');  // input | scanning | error
  const [query, setQuery] = useState('');
  const [zip, setZip] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [locations, setLocations] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load locations index on mount
  useEffect(() => {
    loadLocations().then(setLocations);
  }, []);

  // Close dropdown on outside click
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

  const updateQuery = useCallback((value) => {
    setQuery(value);
    setHighlightIdx(-1);

    // If it's exactly 5 digits, set as ZIP directly
    const digits = value.replace(/\D/g, '');
    if (/^\d{5}$/.test(digits)) {
      setZip(digits);
      setShowSuggestions(false);
      return;
    }

    // Clear zip if user is typing something else
    setZip('');

    // Fuzzy search
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
    setQuery(`${city}, ${state} ${selectedZip}`);
    setZip(selectedZip);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    const cleaned = zip.trim();
    if (!cleaned || cleaned.length !== 5 || !/^\d{5}$/.test(cleaned)) return;

    setStep('scanning');
    setScanProgress(0);
    setErrorMsg('');
    setShowSuggestions(false);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 2;
      });
    }, 30);

    try {
      const res = await fetch(`${API_BASE}/${cleaned}.json`);
      clearInterval(interval);

      if (!res.ok) {
        setScanProgress(100);
        setStep('error');
        setErrorMsg('No water quality data found for this location.');
        return;
      }

      const data = await res.json();
      if (!data.found) {
        setScanProgress(100);
        setStep('error');
        setErrorMsg('No water quality data found for this location.');
        return;
      }

      setScanProgress(100);
      setTimeout(() => {
        navigate(`/datacheck/${cleaned}`);
      }, 400);

    } catch {
      clearInterval(interval);
      setScanProgress(100);
      setStep('error');
      setErrorMsg('Could not reach the server. Please try again.');
    }
  };

  const handleReset = () => {
    setStep('input');
    setQuery('');
    setZip('');
    setScanProgress(0);
    setErrorMsg('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-6 md:px-0">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold uppercase tracking-widest text-[#f2663b] mb-2 flex items-center justify-center gap-2">
          <Icons.MapPin className="w-3 h-3"/> EPA Database Check
        </h3>
      </div>

      {step === 'input' && (
        <form onSubmit={handleScan}>
          <div className="bg-white rounded-3xl md:rounded-full p-2 shadow-xl shadow-[#2A2422]/5 border border-stone-100 flex flex-col md:flex-row items-center gap-2 transition-all relative">
            <div className="flex-1 w-full relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="ZIP code or city name"
                className="w-full h-12 md:h-14 pl-6 md:pl-8 pr-6 rounded-full bg-transparent text-[#2A2422] font-normal placeholder:text-stone-400 focus:outline-none focus:bg-[#FFF7ED] transition-colors text-base md:text-lg text-center md:text-left"
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50"
                >
                  {suggestions.map((loc, i) => {
                    const [sZip, city, state] = loc;
                    return (
                      <button
                        key={sZip}
                        type="button"
                        className={`w-full px-5 py-3 text-left flex items-center justify-between transition-colors ${
                          i === highlightIdx ? 'bg-[#FFF7ED]' : 'hover:bg-stone-50'
                        }`}
                        onClick={() => selectSuggestion(loc)}
                        onMouseEnter={() => setHighlightIdx(i)}
                      >
                        <span className="text-[#2A2422]">
                          <span className="font-medium">{city}</span>
                          <span className="text-stone-400">, {state}</span>
                        </span>
                        <span className="text-xs text-stone-400 font-mono">{sZip}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              variant="primary"
              className={`w-full md:w-auto h-12 md:h-14 px-8 md:px-10 shrink-0 transition-opacity ${!zip ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={!zip}
            >
              RUN DIAGNOSTIC
            </Button>
          </div>
          {zip && (
            <p className="text-center text-xs text-stone-400 mt-3">
              Checking ZIP code {zip}
            </p>
          )}
        </form>
      )}

      {step === 'scanning' && (
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-stone-100 text-center">
          <div className="mb-6 relative w-20 h-20 mx-auto">
            <Icons.Spinner className="w-full h-full text-[#f2663b] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono">{scanProgress}%</div>
          </div>
          <h4 className="text-xl font-semibold mb-2">Analyzing local water quality...</h4>
          <p className="text-stone-500 text-sm">Cross-referencing EPA records for ZIP {zip}</p>
        </div>
      )}

      {step === 'error' && (
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-stone-100 text-center">
          <div className="mb-6 w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
            <Icons.MapPin className="w-7 h-7 text-stone-400" />
          </div>
          <h4 className="text-xl font-semibold mb-2">No Data Found</h4>
          <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">{errorMsg}</p>
          <Button variant="secondary" onClick={handleReset} className="text-[10px] mx-auto">
            Try Another ZIP
          </Button>
        </div>
      )}
    </div>
  );
};

export default IntegratedScanner;
