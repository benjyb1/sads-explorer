'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { formatSads } from './Tooltip';
import { useDashboardStore } from '../store/dashboardStore';
import { CONTINENT_ORDER } from '../data/continents';
import { COUNTRY_POP_M, CONTINENT_POP_M, WORLD_POP_M } from '../data/populations';

// ── Per-person per-year animal consumption (global avg) + SADs/animal ────────
const DIET_SPECIES = [
  { key: 'chicken', label: 'Chickens',    sadsPerAnimal: 13.3, animalsPerPersonPerYear: 28,   colour: '#7c9e8f' },
  { key: 'beef',    label: 'Beef cattle', sadsPerAnimal:  7.3, animalsPerPersonPerYear:  0.04, colour: '#b07d5a' },
  { key: 'dairy',   label: 'Dairy cattle',sadsPerAnimal: 18.6, animalsPerPersonPerYear:  0.08, colour: '#c9a87c' },
  { key: 'eggs',    label: 'Laying hens', sadsPerAnimal:  8.3, animalsPerPersonPerYear:  3,    colour: '#9aad8f' },
  { key: 'pork',    label: 'Pigs',        sadsPerAnimal:  7.3, animalsPerPersonPerYear:  0.35, colour: '#c4956a' },
  { key: 'fish',    label: 'Fish',        sadsPerAnimal:  7.4, animalsPerPersonPerYear: 12,    colour: '#7a8fb5' },
  { key: 'shrimp',  label: 'Shrimp',      sadsPerAnimal:  6.9, animalsPerPersonPerYear: 90,    colour: '#b5856e' },
] as const;

type SpeciesKey = typeof DIET_SPECIES[number]['key'];

// ── Fraction of each species' consumption eliminated by diet type ─────────────
type DietKey = 'vegan' | 'vegetarian' | 'pescatarian' | 'reducetarian';

const DIET_ELIMINATIONS: Record<DietKey, Record<SpeciesKey, number>> = {
  vegan:        { chicken: 1,   beef: 1,   dairy: 1,   eggs: 1,   pork: 1,   fish: 1,   shrimp: 1   },
  vegetarian:   { chicken: 1,   beef: 1,   dairy: 0,   eggs: 0,   pork: 1,   fish: 1,   shrimp: 1   },
  pescatarian:  { chicken: 1,   beef: 1,   dairy: 0,   eggs: 0,   pork: 1,   fish: 0,   shrimp: 0   },
  reducetarian: { chicken: 0.5, beef: 0.5, dairy: 0.5, eggs: 0.5, pork: 0.5, fish: 0.5, shrimp: 0.5 },
};

const DIET_META: Record<DietKey, { short: string; sub: string }> = {
  vegan:        { short: 'Vegan',        sub: 'No animal products' },
  vegetarian:   { short: 'Vegetarian',   sub: 'No meat or fish'    },
  pescatarian:  { short: 'Pescatarian',  sub: 'No land animals'    },
  reducetarian: { short: '50% less',     sub: 'Halve all intake'   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPop(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return Math.round(n).toLocaleString();
}

// ── Component ─────────────────────────────────────────────────────────────────
export function WhatIfCalculator() {
  const { selectedCountries } = useDashboardStore();
  const [geo, setGeo] = useState<string>('world');
  const [coveragePct, setCoveragePct] = useState(100);
  const [diet, setDiet] = useState<DietKey>('vegan');

  // If the user clears their country selection while "selected" is active, fall back to world
  useEffect(() => {
    if (geo === 'selected' && selectedCountries.size === 0) setGeo('world');
  }, [geo, selectedCountries.size]);

  // Population for the chosen geography (raw people)
  const basePop = useMemo((): number => {
    if (geo === 'world') return WORLD_POP_M * 1e6;
    if (geo === 'selected') {
      let total = 0;
      for (const code of selectedCountries) total += (COUNTRY_POP_M[code] ?? 2) * 1e6;
      return total || 1e6;
    }
    if (geo in CONTINENT_POP_M) return CONTINENT_POP_M[geo] * 1e6;
    return (COUNTRY_POP_M[geo] ?? 2) * 1e6;
  }, [geo, selectedCountries]);

  const people = basePop * (coveragePct / 100);
  const elim = DIET_ELIMINATIONS[diet];

  const results = useMemo(() =>
    DIET_SPECIES.map(sp => ({
      ...sp,
      sadsAverted: people * sp.animalsPerPersonPerYear * sp.sadsPerAnimal * elim[sp.key],
    })),
    [people, elim],
  );

  const total = results.reduce((a, r) => a + r.sadsAverted, 0);
  const maxContrib = Math.max(...results.map(r => r.sadsAverted), 1);

  // Geography label for the result line
  const geoLabel =
    geo === 'world'    ? 'worldwide' :
    geo === 'selected' ? `in ${selectedCountries.size} selected countr${selectedCountries.size === 1 ? 'y' : 'ies'}` :
    `in ${geo}`;

  return (
    <div className="p-4 space-y-4 text-sm">

      {/* ── If ──────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[#6e7681] w-16 flex-shrink-0">If</span>
          <select
            value={geo}
            onChange={e => setGeo(e.target.value)}
            className="flex-1 bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] focus:outline-none focus:border-[#6e7681] cursor-pointer"
          >
            <option value="world">🌍 World</option>
            {CONTINENT_ORDER.map(c => (
              <option key={c} value={c}>{c} (~{formatPop(CONTINENT_POP_M[c] * 1e6)})</option>
            ))}
            {selectedCountries.size > 0 && (
              <option value="selected">⭐ Selected countries ({selectedCountries.size})</option>
            )}
          </select>
        </div>

        {/* Coverage slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[#6e7681] w-16 flex-shrink-0">Of people</span>
          <input
            type="range"
            min={1} max={100} step={1}
            value={coveragePct}
            onChange={e => setCoveragePct(Number(e.target.value))}
            className="flex-1 h-1 appearance-none bg-[#30363d] rounded"
            style={{ accentColor: '#7c9e8f' }}
          />
          <span className="text-xs font-mono text-[#e6edf3] w-8 text-right">{coveragePct}%</span>
        </div>
        <div className="text-right text-xs text-[#6e7681]">= {formatPop(people)} people</div>
      </div>

      {/* ── Went ──────────────────────────────────────── */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#6e7681] mb-1.5">Went…</div>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(DIET_META) as DietKey[]).map(d => (
            <button
              key={d}
              onClick={() => setDiet(d)}
              className={`py-1.5 px-2.5 rounded text-left transition-colors border ${
                diet === d
                  ? 'bg-[#21262d] border-[#30363d] text-[#e6edf3]'
                  : 'border-transparent text-[#6e7681] hover:text-[#8b949e] hover:bg-[#161b22]'
              }`}
            >
              <div className="text-xs font-medium">{DIET_META[d].short}</div>
              <div className="text-[9px] opacity-60 mt-0.5">{DIET_META[d].sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Result ──────────────────────────────────────── */}
      <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3">
        <div className="text-[10px] uppercase tracking-wider text-[#6e7681] mb-1">Est. SADs averted / year</div>
        <div className="text-2xl font-mono font-bold text-[#7c9e8f]">{formatSads(total)}</div>
        <div className="text-xs text-[#8b949e] mt-1 leading-relaxed">
          {formatPop(people)} people going {DIET_META[diet].short.toLowerCase()} {geoLabel}
        </div>
      </div>

      {/* ── Species breakdown ──────────────────────────── */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-[#6e7681]">SADs averted by species</div>
          {[...results]
            .sort((a, b) => b.sadsAverted - a.sadsAverted)
            .filter(r => r.sadsAverted > 0)
            .map(r => (
              <div key={r.key} className="flex items-center gap-2 text-xs">
                <span className="text-[#6e7681] w-20 flex-shrink-0 truncate">{r.label}</span>
                <div className="flex-1 h-1.5 bg-[#21262d] rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(r.sadsAverted / maxContrib) * 100}%`,
                      backgroundColor: r.colour,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-[#8b949e] font-mono w-14 text-right flex-shrink-0">
                  {formatSads(r.sadsAverted)}
                </span>
              </div>
            ))}
        </div>
      )}

      <div className="text-[10px] text-[#6e7681] italic leading-relaxed">
        Uses global-average consumption rates. Actual impact varies by region and farming system.
      </div>
    </div>
  );
}
