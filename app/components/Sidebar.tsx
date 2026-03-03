'use client';
import React, { useState } from 'react';
import { useDashboardStore, ViewType } from '../store/dashboardStore';
import { ANIMAL_GROUPS, AnimalGroupEntry, getDisplayAnimal } from '../data/sads-scenarios';
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

// ── Kingdom (= continent analogue for animals) ─────────────────────────────
const KINGDOM_ORDER = Object.keys(ANIMAL_GROUPS);

/** Flatten a kingdom's entries into display atoms: { display, names[] } */
function getKingdomAtoms(kingdom: string): { display: string; names: string[] }[] {
  return (ANIMAL_GROUPS[kingdom] ?? []).map((e: AnimalGroupEntry) => {
    if (typeof e === 'string') return { display: e, names: [e] };
    return { display: e.parent, names: e.children };
  });
}

// ── Component ──────────────────────────────────────────────────────────────
export function Sidebar() {
  const {
    activeView, setActiveView,
    selectedAnimals, setSelectedAnimals,
    selectedCountries, toggleCountry, setSelectedCountries,
  } = useDashboardStore();

  const { countries } = useCountryData();

  // ── Expand / collapse state ────────────────────────────────────────────
  const [expandedKingdoms, setExpandedKingdoms] = useState<Set<string>>(new Set(['Land Animals']));
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set(['Asia']));
  const [countrySearch, setCountrySearch] = useState('');

  const toggleExpandKingdom = (k: string) =>
    setExpandedKingdoms(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });

  const toggleExpandContinent = (c: string) =>
    setExpandedContinents(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });

  // ── Animal helpers ──────────────────────────────────────────────────────
  const toggleAtom = (atomNames: string[]) => {
    const allSelected = atomNames.every(n => selectedAnimals.has(n));
    const next = new Set(selectedAnimals);
    if (allSelected) atomNames.forEach(n => next.delete(n));
    else atomNames.forEach(n => next.add(n));
    setSelectedAnimals(next);
  };

  const toggleKingdomAnimals = (kingdom: string) => {
    const allNames = getKingdomAtoms(kingdom).flatMap(a => a.names);
    const allSelected = allNames.every(n => selectedAnimals.has(n));
    const next = new Set(selectedAnimals);
    if (allSelected) allNames.forEach(n => next.delete(n));
    else allNames.forEach(n => next.add(n));
    setSelectedAnimals(next);
  };

  /** Count of display atoms in this kingdom that are fully selected */
  const selectedAtomCountInKingdom = (kingdom: string) =>
    getKingdomAtoms(kingdom).filter(a => a.names.every(n => selectedAnimals.has(n))).length;

  // ── Country helpers ─────────────────────────────────────────────────────
  const toggleContinent = (cont: string, cList: { code: string }[]) => {
    const allSelected = cList.every(c => selectedCountries.has(c.code));
    const next = new Set(selectedCountries);
    if (allSelected) cList.forEach(c => next.delete(c.code));
    else cList.forEach(c => next.add(c.code));
    setSelectedCountries(next);
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
        <div className="space-y-2">

          {/* Smart pills — collapsed kingdom / parent-group / individual */}
          {selectedAnimals.size > 0 && (() => {
            const pills: { key: string; label: string; names: string[] }[] = [];
            const handled = new Set<string>();

            // Step 1: fully-selected kingdoms → one pill
            for (const kingdom of KINGDOM_ORDER) {
              const atoms = getKingdomAtoms(kingdom);
              const allNames = atoms.flatMap(a => a.names);
              if (allNames.length >= 2 && allNames.every(n => selectedAnimals.has(n))) {
                pills.push({ key: `k-${kingdom}`, label: `${kingdom} (${atoms.length})`, names: allNames });
                allNames.forEach(n => handled.add(n));
              }
            }

            // Step 2: fully-selected parent groups (Chickens etc.) not already handled
            for (const entries of Object.values(ANIMAL_GROUPS)) {
              for (const e of entries) {
                if (typeof e !== 'string') {
                  const { parent, children } = e;
                  if (!children.some(n => handled.has(n)) && children.every(n => selectedAnimals.has(n))) {
                    pills.push({ key: `p-${parent}`, label: parent, names: children });
                    children.forEach(n => handled.add(n));
                  }
                }
              }
            }

            // Step 3: remaining individual animals
            for (const name of selectedAnimals) {
              if (!handled.has(name)) {
                pills.push({ key: name, label: getDisplayAnimal(name), names: [name] });
              }
            }

            const MAX = 7;
            const visible = pills.slice(0, MAX);
            const overflow = pills.length - MAX;
            return (
              <div className="flex flex-wrap gap-1 mb-1">
                {visible.map(pill => (
                  <span key={pill.key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] text-xs text-[#8b949e]">
                    {pill.label}
                    <button
                      onClick={() => { const n = new Set(selectedAnimals); pill.names.forEach(x => n.delete(x)); setSelectedAnimals(n); }}
                      className="hover:text-[#e6edf3] ml-0.5"
                    >✕</button>
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="px-1.5 py-0.5 text-xs text-[#6e7681]">+{overflow} more</span>
                )}
                <button onClick={() => setSelectedAnimals(new Set())} className="text-xs text-[#6e7681] hover:text-[#e6edf3] self-center">
                  Clear all
                </button>
              </div>
            );
          })()}

          {/* Kingdom accordions */}
          <div className="space-y-0.5">
            {KINGDOM_ORDER.map(kingdom => {
              const atoms = getKingdomAtoms(kingdom);
              const selCount = selectedAtomCountInKingdom(kingdom);
              const expanded = expandedKingdoms.has(kingdom);
              return (
                <div key={kingdom} className="rounded border border-[#21262d] overflow-hidden">
                  <div className="flex items-center">
                    {/* Kingdom name — click to select/deselect all */}
                    <button
                      onClick={() => toggleKingdomAnimals(kingdom)}
                      className="flex-1 flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-[#161b22] transition-colors text-left"
                      title={`Select / deselect all ${kingdom}`}
                    >
                      <span className={selCount > 0 ? 'text-[#e6edf3] font-medium' : 'text-[#8b949e]'}>{kingdom}</span>
                      {selCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7c9e8f] text-[#0d1117] font-semibold leading-none">{selCount}</span>
                      )}
                    </button>
                    {/* Arrow — expand/collapse */}
                    <button
                      onClick={() => toggleExpandKingdom(kingdom)}
                      className="px-2.5 py-1.5 text-[#6e7681] hover:text-[#8b949e] text-xs transition-colors"
                      title={expanded ? 'Collapse' : 'Expand'}
                    >
                      {expanded ? '▴' : '▾'}
                    </button>
                  </div>
                  {expanded && (
                    <div className="border-t border-[#21262d]">
                      {atoms.map(atom => {
                        const isActive = atom.names.every(n => selectedAnimals.has(n));
                        return (
                          <button
                            key={atom.display}
                            onClick={() => toggleAtom(atom.names)}
                            className={`w-full flex items-center justify-between px-3 py-1 text-xs transition-colors hover:bg-[#161b22] ${
                              isActive ? 'text-[#e6edf3]' : 'text-[#8b949e]'
                            }`}
                          >
                            <span>{atom.display}</span>
                            {isActive && <span className="text-[#7c9e8f]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SidebarSection>

      {/* 3. COUNTRIES */}
      <SidebarSection title="Countries">
        <div className="space-y-2">

          {/* Smart pills — collapsed continent / individual */}
          {selectedCountries.size > 0 && (() => {
            const pills: { key: string; label: string; codes: string[] }[] = [];
            const handled = new Set<string>();
            for (const cont of CONTINENT_ORDER) {
              const contCodes = (continentCountries[cont] ?? []).map(c => c.code);
              if (contCodes.length === 0) continue;
              const selInCont = contCodes.filter(c => selectedCountries.has(c));
              if (selInCont.length === 0) continue;
              if (selInCont.length === contCodes.length && contCodes.length >= 2) {
                pills.push({ key: `cont-${cont}`, label: `${cont} (${contCodes.length})`, codes: selInCont });
                selInCont.forEach(c => handled.add(c));
              }
            }
            for (const code of selectedCountries) {
              if (!handled.has(code)) {
                const label = countries.find(c => c.code === code)?.entity ?? code;
                pills.push({ key: code, label, codes: [code] });
              }
            }
            const MAX = 7;
            const visible = pills.slice(0, MAX);
            const overflow = pills.length - MAX;
            return (
              <div className="flex flex-wrap gap-1 mb-1">
                {visible.map(pill => (
                  <span key={pill.key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] text-xs text-[#8b949e]">
                    {pill.label}
                    <button
                      onClick={() => { const n = new Set(selectedCountries); pill.codes.forEach(c => n.delete(c)); setSelectedCountries(n); }}
                      className="hover:text-[#e6edf3] ml-0.5"
                    >✕</button>
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="px-1.5 py-0.5 text-xs text-[#6e7681]">+{overflow} more</span>
                )}
                <button onClick={() => setSelectedCountries(new Set())} className="text-xs text-[#6e7681] hover:text-[#e6edf3] self-center">
                  Clear all
                </button>
              </div>
            );
          })()}

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
                  <div className="flex items-center">
                    {/* Continent name — click to select/deselect all countries */}
                    <button
                      onClick={() => toggleContinent(cont, continentCountries[cont] ?? [])}
                      className="flex-1 flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-[#161b22] transition-colors text-left"
                      title={`Select / deselect all ${cont} countries`}
                    >
                      <span className={selCount > 0 ? 'text-[#e6edf3] font-medium' : 'text-[#8b949e]'}>{cont}</span>
                      {selCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7c9e8f] text-[#0d1117] font-semibold leading-none">{selCount}</span>
                      )}
                    </button>
                    {/* Arrow — expand/collapse */}
                    <button
                      onClick={() => toggleExpandContinent(cont)}
                      className="px-2.5 py-1.5 text-[#6e7681] hover:text-[#8b949e] text-xs transition-colors"
                      title={expanded ? 'Collapse' : 'Expand'}
                    >
                      {expanded ? '▴' : '▾'}
                    </button>
                  </div>
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

      {/* 4. WHAT-IF */}
      <SidebarSection title="What-If Calculator">
        <WhatIfCalculator />
      </SidebarSection>

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
