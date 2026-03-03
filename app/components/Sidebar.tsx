'use client';
import React, { useState } from 'react';
import { useDashboardStore, ViewType } from '../store/dashboardStore';
import { ANIMAL_GROUPS, PAIN_COLOURS, PainLevel } from '../data/sads-scenarios';
import { WhatIfCalculator } from './WhatIfCalculator';
import { useCountryData } from '../hooks/useCountryData';

const VIEWS: { id: ViewType; label: string; icon: string }[] = [
  { id: 'treemap', label: 'Treemap', icon: '⊞' },
  { id: 'bar', label: 'Bar Chart', icon: '≡' },
  { id: 'bubble', label: 'Bubble', icon: '◎' },
  { id: 'map', label: 'World Map', icon: '⊕' },
  { id: 'timeline', label: 'Timeline', icon: '⌇' },
  { id: 'table', label: 'Data Table', icon: '☰' },
];

const PAIN_LEVELS: PainLevel[] = ['extreme', 'severe', 'moderate', 'mild'];
const PAIN_LABELS: Record<PainLevel, string> = {
  extreme: 'Extreme',
  severe: 'Severe',
  moderate: 'Moderate',
  mild: 'Mild',
};

export function Sidebar() {
  const {
    activeView, setActiveView,
    metric, setMetric,
    selectedAnimals, toggleAnimal, setSelectedAnimals,
    selectedPainLevels, togglePainLevel,
    includeSubScenarios, setIncludeSubScenarios,
    aggregation, setAggregation,
    normalisation, setNormalisation,
    whatIfOpen, setWhatIfOpen,
    selectedCountries, toggleCountry, setSelectedCountries,
  } = useDashboardStore();

  const { countries } = useCountryData();
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountrySearch, setShowCountrySearch] = useState(false);

  const filteredCountries = countries.filter(c =>
    c.entity.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <aside
      className="fixed top-0 left-0 h-full w-[280px] flex flex-col border-r border-[#30363d] bg-[#0d1117] z-30 overflow-y-auto"
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Branding */}
      <div className="px-4 pt-5 pb-4 border-b border-[#21262d]">
        <div className="text-[#e6edf3] font-bold text-base tracking-tight">SADs Explorer</div>
        <div className="text-[#8b949e] text-xs mt-0.5">
          Suffering-Adjusted Days across farmed animals
        </div>
      </div>

      {/* View switcher */}
      <SidebarSection title="View">
        <div className="grid grid-cols-3 gap-1">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex flex-col items-center justify-center py-2 rounded text-xs transition-colors ${
                activeView === v.id
                  ? 'bg-[#21262d] text-[#e6edf3]'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]'
              }`}
            >
              <span className="text-base mb-0.5">{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Metric */}
      <SidebarSection title="Metric">
        <div className="space-y-1">
          {([
            ['totalSadBurden', 'Total SAD Burden'],
            ['avgSadsPerFarmingYear', 'SADs per Animal'],
            ['animalsSlaughteredPerYear', 'Animals per Year'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setMetric(val)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                metric === val
                  ? 'bg-[#21262d] text-[#e6edf3]'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]'
              }`}
            >
              {label}
              {metric === val && <span className="text-[#7c9e8f]">●</span>}
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Animal filter */}
      <SidebarSection title="Animals">
        <div className="space-y-2">
          {Object.entries(ANIMAL_GROUPS).map(([group, animals]) => (
            <div key={group}>
              <div className="text-[10px] font-semibold text-[#6e7681] uppercase tracking-wider mb-1">
                {group}
              </div>
              <div className="flex flex-wrap gap-1">
                {animals.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAnimal(a)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors border ${
                      selectedAnimals.size === 0 || selectedAnimals.has(a)
                        ? 'border-[#30363d] text-[#e6edf3] bg-[#161b22]'
                        : 'border-transparent text-[#3d444d]'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {selectedAnimals.size > 0 && (
            <button
              onClick={() => setSelectedAnimals(new Set())}
              className="text-xs text-[#8b949e] hover:text-[#e6edf3] mt-1"
            >
              Clear filter
            </button>
          )}
        </div>
      </SidebarSection>

      {/* Pain level filter */}
      <SidebarSection title="Pain Level">
        <div className="flex flex-wrap gap-1.5">
          {PAIN_LEVELS.map(pl => (
            <button
              key={pl}
              onClick={() => togglePainLevel(pl)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                selectedPainLevels.has(pl)
                  ? 'text-white border-transparent'
                  : 'bg-transparent border-[#30363d] text-[#6e7681]'
              }`}
              style={selectedPainLevels.has(pl) ? { backgroundColor: PAIN_COLOURS[pl] } : {}}
            >
              {PAIN_LABELS[pl]}
            </button>
          ))}
        </div>
      </SidebarSection>

      {/* Aggregation & options */}
      <SidebarSection title="Options">
        <div className="space-y-3">
          {/* Include sub-scenarios */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#8b949e] cursor-pointer" htmlFor="sub-toggle">
              Include sub-scenarios
            </label>
            <button
              id="sub-toggle"
              role="switch"
              aria-checked={includeSubScenarios}
              onClick={() => setIncludeSubScenarios(!includeSubScenarios)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                includeSubScenarios ? 'bg-[#7c9e8f]' : 'bg-[#30363d]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  includeSubScenarios ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Aggregation */}
          <div>
            <div className="text-xs text-[#8b949e] mb-1">Group by</div>
            <div className="flex gap-1">
              {(['scenarios', 'species'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAggregation(a)}
                  className={`flex-1 py-1 rounded text-xs transition-colors ${
                    aggregation === a
                      ? 'bg-[#21262d] text-[#e6edf3]'
                      : 'text-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  {a === 'scenarios' ? 'All scenarios' : 'By species'}
                </button>
              ))}
            </div>
          </div>

          {/* Normalisation */}
          <div>
            <div className="text-xs text-[#8b949e] mb-1">Normalise</div>
            <div className="flex gap-1 flex-wrap">
              {([
                ['raw', 'Raw totals'],
                ['per1000', 'Per 1,000 animals'],
                ['perCapita', 'Per capita'],
              ] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setNormalisation(v)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    normalisation === v
                      ? 'bg-[#21262d] text-[#e6edf3]'
                      : 'text-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SidebarSection>

      {/* Country filter (only relevant for map/timeline) */}
      {(activeView === 'map' || activeView === 'timeline') && (
        <SidebarSection title="Countries">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search countries…"
              value={countrySearch}
              onChange={e => {
                setCountrySearch(e.target.value);
                setShowCountrySearch(true);
              }}
              onFocus={() => setShowCountrySearch(true)}
              className="w-full bg-[#21262d] border border-[#30363d] rounded px-2.5 py-1 text-xs text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-[#6e7681]"
            />

            {/* Selected countries */}
            {selectedCountries.size > 0 && (
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedCountries).map(code => {
                  const label = countries.find(c => c.code === code)?.entity ?? code;
                  return (
                    <span key={code} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] text-xs text-[#8b949e]">
                      {label}
                      <button onClick={() => toggleCountry(code)} className="hover:text-[#e6edf3]">✕</button>
                    </span>
                  );
                })}
                <button
                  onClick={() => setSelectedCountries(new Set())}
                  className="text-xs text-[#6e7681] hover:text-[#e6edf3]"
                >
                  Clear
                </button>
              </div>
            )}

            {showCountrySearch && countrySearch && (
              <div className="rounded border border-[#30363d] bg-[#161b22] max-h-40 overflow-y-auto">
                {filteredCountries.slice(0, 20).map(c => (
                  <button
                    key={c.code}
                    onClick={() => {
                      toggleCountry(c.code);
                      setCountrySearch('');
                      setShowCountrySearch(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] flex items-center justify-between"
                  >
                    <span>{c.entity}</span>
                    <span className="text-[#6e7681] font-mono">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SidebarSection>
      )}

      {/* What-If Calculator */}
      <div className="border-t border-[#21262d]">
        <button
          onClick={() => setWhatIfOpen(!whatIfOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          <span>⟳ What-If Calculator</span>
          <span className={`transition-transform ${whatIfOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {whatIfOpen && <WhatIfCalculator />}
      </div>

      {/* Data integrity warning */}
      <div className="mt-auto px-4 py-3 border-t border-[#21262d]">
        <div className="rounded border border-[#d29922] bg-[#1f1a0e] p-2.5 text-xs text-[#d29922]">
          <span className="font-semibold">⚠ Shrimp data note:</span> OWID total farmed crustaceans ≈310B/yr. This dataset uses 125B × 4 systems = 500B total. May double-count. Treat shrimp aggregate with caution.
        </div>
        <div className="mt-2 text-[#6e7681] text-xs text-center">
          Data: Rethink Priorities SADs framework · OWID
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#21262d] px-4 py-3">
      <div className="text-xs font-semibold text-[#6e7681] uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}
