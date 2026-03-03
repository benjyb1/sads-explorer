'use client';
import React, { useState } from 'react';
import { useDashboardStore, ViewType } from '../store/dashboardStore';
import { ANIMAL_GROUPS, AnimalGroupEntry } from '../data/sads-scenarios';
import { WhatIfCalculator } from './WhatIfCalculator';
import { useCountryData } from '../hooks/useCountryData';
import { CONTINENT_COUNTRIES, CONTINENT_ORDER } from '../data/continents';

const VIEWS: { id: ViewType; label: string; icon: string }[] = [
  { id: 'treemap', label: 'Treemap', icon: '⊞' },
  { id: 'bar', label: 'Bar Chart', icon: '≡' },
  { id: 'bubble', label: 'Bubble', icon: '◎' },
  { id: 'map', label: 'World Map', icon: '⊕' },
  { id: 'timeline', label: 'Timeline', icon: '⌇' },
  { id: 'table', label: 'Data Table', icon: '☰' },
];

export function Sidebar() {
  const {
    activeView, setActiveView,
    selectedAnimals, toggleAnimal, setSelectedAnimals,
    includeSubScenarios, setIncludeSubScenarios,
    aggregation, setAggregation,
    normalisation, setNormalisation,
    whatIfOpen, setWhatIfOpen,
    selectedCountries, toggleCountry, setSelectedCountries,
  } = useDashboardStore();

  const { countries } = useCountryData();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set(['Asia']));
  const [countrySearch, setCountrySearch] = useState('');

  const toggleExpandParent = (parent: string) =>
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parent)) next.delete(parent); else next.add(parent);
      return next;
    });

  const toggleExpandContinent = (c: string) =>
    setExpandedContinents(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });

  const parentState = (children: string[]): 'all' | 'some' | 'none' => {
    if (selectedAnimals.size === 0) return 'all';
    const selected = children.filter(c => selectedAnimals.has(c));
    if (selected.length === children.length) return 'all';
    if (selected.length === 0) return 'none';
    return 'some';
  };

  const toggleParentGroup = (children: string[]) => {
    const state = parentState(children);
    const next = new Set(selectedAnimals);
    if (state === 'all') {
      if (selectedAnimals.size === 0) {
        const allNames: string[] = [];
        for (const entries of Object.values(ANIMAL_GROUPS)) {
          for (const e of entries) {
            if (typeof e === 'string') allNames.push(e);
            else allNames.push(...(e as { parent: string; children: string[] }).children);
          }
        }
        allNames.forEach(n => next.add(n));
        children.forEach(c => next.delete(c));
      } else {
        children.forEach(c => next.delete(c));
      }
    } else {
      children.forEach(c => next.add(c));
    }
    setSelectedAnimals(next);
  };

  const countryCodeSet = new Set(countries.map(c => c.code));
  const continentCountries: Record<string, { code: string; entity: string }[]> = {};
  for (const cont of CONTINENT_ORDER) {
    const codes = CONTINENT_COUNTRIES[cont] ?? [];
    continentCountries[cont] = codes
      .filter(c => countryCodeSet.has(c))
      .map(code => ({ code, entity: countries.find(c => c.code === code)?.entity ?? code }))
      .sort((a, b) => a.entity.localeCompare(b.entity));
  }

  const filteredContinentCountries = countrySearch.trim()
    ? (() => {
        const q = countrySearch.toLowerCase();
        const result: Record<string, { code: string; entity: string }[]> = {};
        for (const cont of CONTINENT_ORDER) {
          result[cont] = (continentCountries[cont] ?? []).filter(
            c => c.entity.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
          );
        }
        return result;
      })()
    : continentCountries;

  const selectedContinentCount = (cont: string) =>
    (continentCountries[cont] ?? []).filter(c => selectedCountries.has(c.code)).length;

  return (
    <aside
      className="fixed top-0 left-0 h-full w-[280px] flex flex-col border-r border-[#30363d] bg-[#0d1117] z-30 overflow-y-auto"
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Branding */}
      <div className="px-4 pt-5 pb-4 border-b border-[#21262d]">
        <div className="text-[#e6edf3] font-bold text-base tracking-tight">SADs Explorer</div>
        <div className="text-[#8b949e] text-xs mt-0.5">Suffering-Adjusted Days · farmed animals</div>
      </div>

      {/* 1. VIEW */}
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

      {/* 2. ANIMALS */}
      <SidebarSection title="Animals">
        <div className="space-y-3">
          {Object.entries(ANIMAL_GROUPS).map(([group, entries]) => (
            <div key={group}>
              <div className="text-[10px] font-semibold text-[#6e7681] uppercase tracking-wider mb-1.5">{group}</div>
              <div className="flex flex-wrap gap-1">
                {(entries as AnimalGroupEntry[]).map((entry) => {
                  if (typeof entry === 'string') {
                    const active = selectedAnimals.size === 0 || selectedAnimals.has(entry);
                    return (
                      <AnimalChip key={entry} label={entry} active={active} onClick={() => toggleAnimal(entry)} />
                    );
                  }
                  const { parent, children } = entry as { parent: string; children: string[] };
                  const state = parentState(children);
                  const expanded = expandedParents.has(parent);
                  return (
                    <div key={parent} className="w-full">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleParentGroup(children)}
                          className={`flex-1 flex items-center px-2 py-0.5 rounded text-xs transition-colors border text-left ${
                            state === 'none'
                              ? 'border-transparent text-[#3d444d]'
                              : 'border-[#30363d] text-[#e6edf3] bg-[#161b22]'
                          }`}
                        >
                          {state === 'some' && <span className="w-1 h-1 rounded-full bg-[#7c9e8f] mr-1.5 flex-shrink-0" />}
                          {parent}
                        </button>
                        <button
                          onClick={() => toggleExpandParent(parent)}
                          className="px-1.5 py-0.5 text-[#6e7681] hover:text-[#8b949e] text-xs"
                        >
                          {expanded ? '▴' : '▾'}
                        </button>
                      </div>
                      {expanded && (
                        <div className="ml-3 mt-1 flex flex-wrap gap-1 border-l border-[#21262d] pl-2">
                          {children.map(child => {
                            const active = selectedAnimals.size === 0 || selectedAnimals.has(child);
                            return (
                              <AnimalChip key={child} label={child} active={active} onClick={() => toggleAnimal(child)} small />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {selectedAnimals.size > 0 && (
            <button onClick={() => setSelectedAnimals(new Set())} className="text-xs text-[#8b949e] hover:text-[#e6edf3]">
              Clear filter
            </button>
          )}
        </div>
      </SidebarSection>

      {/* 3. COUNTRIES */}
      <SidebarSection title="Countries">
        <div className="space-y-2">
          {selectedCountries.size > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {Array.from(selectedCountries).map(code => {
                  const label = countries.find(c => c.code === code)?.entity ?? code;
                  return (
                    <span key={code} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] text-xs text-[#8b949e]">
                      {label}
                      <button onClick={() => toggleCountry(code)} className="hover:text-[#e6edf3] ml-0.5">✕</button>
                    </span>
                  );
                })}
                <button onClick={() => setSelectedCountries(new Set())} className="text-xs text-[#6e7681] hover:text-[#e6edf3] self-center">
                  Clear all
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Search countries…"
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              className="w-full bg-[#21262d] border border-[#30363d] rounded px-2.5 py-1 text-xs text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-[#6e7681]"
            />

            <div className="space-y-0.5">
              {CONTINENT_ORDER.map(cont => {
                const cList = filteredContinentCountries[cont] ?? [];
                if (cList.length === 0 && countrySearch) return null;
                const selCount = selectedContinentCount(cont);
                const expanded = expandedContinents.has(cont) || !!countrySearch;
                return (
                  <div key={cont} className="rounded border border-[#21262d] overflow-hidden">
                    <button
                      onClick={() => toggleExpandContinent(cont)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-[#161b22] transition-colors"
                    >
                      <span className={selCount > 0 ? 'text-[#e6edf3] font-medium' : 'text-[#8b949e]'}>{cont}</span>
                      <div className="flex items-center gap-2">
                        {selCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7c9e8f] text-[#0d1117] font-semibold">{selCount}</span>
                        )}
                        <span className="text-[#6e7681]">{expanded ? '▴' : '▾'}</span>
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-[#21262d] max-h-44 overflow-y-auto">
                        {cList.map(c => (
                          <button
                            key={c.code}
                            onClick={() => toggleCountry(c.code)}
                            className={`w-full flex items-center justify-between px-3 py-1 text-xs transition-colors hover:bg-[#161b22] ${
                              selectedCountries.has(c.code) ? 'text-[#e6edf3]' : 'text-[#8b949e]'
                            }`}
                          >
                            <span>{c.entity}</span>
                            {selectedCountries.has(c.code) && <span className="text-[#7c9e8f]">✓</span>}
                          </button>
                        ))}
                        {cList.length === 0 && (
                          <div className="px-3 py-2 text-xs text-[#6e7681] italic">No matching countries</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
      </SidebarSection>

      {/* 4. OPTIONS */}
      <SidebarSection title="Options">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Include sub-scenarios</span>
            <button
              role="switch"
              aria-checked={includeSubScenarios}
              onClick={() => setIncludeSubScenarios(!includeSubScenarios)}
              className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${includeSubScenarios ? 'bg-[#7c9e8f]' : 'bg-[#30363d]'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${includeSubScenarios ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <div className="text-xs text-[#8b949e] mb-1">Group by</div>
            <div className="flex gap-1">
              {(['scenarios', 'species'] as const).map(a => (
                <button key={a} onClick={() => setAggregation(a)}
                  className={`flex-1 py-1 rounded text-xs transition-colors ${aggregation === a ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}>
                  {a === 'scenarios' ? 'All scenarios' : 'By species'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8b949e] mb-1">Normalise</div>
            <div className="flex gap-1 flex-wrap">
              {([['raw','Raw'],['per1000','Per 1K'],['perCapita','Per capita']] as const).map(([v,l]) => (
                <button key={v} onClick={() => setNormalisation(v)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${normalisation === v ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SidebarSection>

      {/* What-If */}
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

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t border-[#21262d]">
        <div className="rounded border border-[#d29922] bg-[#1f1a0e] p-2.5 text-xs text-[#d29922]">
          <span className="font-semibold">⚠ Shrimp data:</span> OWID ≈310B/yr. Dataset uses 125B × 4 = 500B (may double-count).
        </div>
        <div className="mt-2 text-[#6e7681] text-xs text-center">Rethink Priorities SADs · OWID</div>
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

function AnimalChip({ label, active, onClick, small = false }: {
  label: string; active: boolean; onClick: () => void; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded transition-colors border ${small ? 'text-[10px]' : 'text-xs'} ${
        active ? 'border-[#30363d] text-[#e6edf3] bg-[#161b22]' : 'border-transparent text-[#3d444d]'
      }`}
    >
      {label}
    </button>
  );
}
