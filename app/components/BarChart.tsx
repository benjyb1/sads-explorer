'use client';
import React, { useState } from 'react';
import { useFilteredScenarios } from '../hooks/useFilteredData';
import { PAIN_COLOURS, SPECIES_COLOURS } from '../data/sads-scenarios';
import { useDashboardStore } from '../store/dashboardStore';
import { formatSads, formatAnimals } from './Tooltip';

export function BarChart() {
  const scenarios = useFilteredScenarios();
  const { metric, includeSubScenarios, pinScenario } = useDashboardStore();
  const [sortBy, setSortBy] = useState<'totalSadBurden' | 'avgSadsPerFarmingYear' | 'animalsSlaughteredPerYear'>('totalSadBurden');
  const [hovered, setHovered] = useState<string | null>(null);

  const getValue = (s: typeof scenarios[0]) => {
    if (sortBy === 'avgSadsPerFarmingYear') return s.avgSadsPerFarmingYear ?? 0;
    if (sortBy === 'animalsSlaughteredPerYear') return s.animalsSlaughteredPerYear;
    return s.totalSadBurden;
  };

  const sorted = [...scenarios].sort((a, b) => getValue(b) - getValue(a));
  const maxValue = sorted.length > 0 ? getValue(sorted[0]) : 1;

  const formatValue = (v: number) => {
    if (sortBy === 'animalsSlaughteredPerYear') return formatAnimals(v);
    return formatSads(v);
  };

  const label = sortBy === 'avgSadsPerFarmingYear'
    ? 'SADs per Animal'
    : sortBy === 'animalsSlaughteredPerYear'
      ? 'Animals Slaughtered/yr'
      : 'Total SAD Burden';

  return (
    <div className="flex flex-col h-full">
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#21262d]">
        <span className="text-xs text-[#8b949e] mr-1">Sort by:</span>
        {(['totalSadBurden', 'avgSadsPerFarmingYear', 'animalsSlaughteredPerYear'] as const).map(opt => (
          <button
            key={opt}
            onClick={() => setSortBy(opt)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              sortBy === opt
                ? 'bg-[#30363d] text-[#e6edf3]'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
            }`}
          >
            {opt === 'totalSadBurden' ? 'Total burden' :
             opt === 'avgSadsPerFarmingYear' ? 'SADs/animal' : 'Animals/yr'}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#8b949e]">{sorted.length} scenarios</span>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {sorted.map(s => {
          const value = getValue(s);
          const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const isHovered = hovered === s.scenario;
          const colour = SPECIES_COLOURS[s.animal] ?? '#4a5568';

          return (
            <div
              key={s.scenario}
              className={`group relative rounded transition-all duration-150 cursor-pointer ${
                s.isSubScenario ? 'ml-4 opacity-75' : ''
              } ${isHovered ? 'bg-[#21262d]' : 'hover:bg-[#161b22]'}`}
              onMouseEnter={() => setHovered(s.scenario)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => pinScenario({
                animal: s.animal,
                scenario: s.scenario,
                totalSadBurden: s.totalSadBurden,
                avgSadsPerFarmingYear: s.avgSadsPerFarmingYear,
                animalsSlaughteredPerYear: s.animalsSlaughteredPerYear,
                painLevel: s.painLevel,
              })}
            >
              <div className="flex items-center gap-3 px-2 py-1.5">
                {/* Pain dot */}
                <span
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: PAIN_COLOURS[s.painLevel] }}
                />

                {/* Label */}
                <div className="flex-shrink-0 w-52">
                  <div className="text-xs text-[#e6edf3] truncate">{s.scenario}</div>
                  <div className="text-xs text-[#8b949e] truncate">{s.animal}</div>
                </div>

                {/* Bar */}
                <div className="flex-1 h-5 rounded overflow-hidden bg-[#21262d] relative">
                  <div
                    className="h-full rounded transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: colour,
                      opacity: 0.75,
                    }}
                  />
                </div>

                {/* Value */}
                <div className="flex-shrink-0 w-24 text-right font-mono text-xs text-[#8b949e] group-hover:text-[#e6edf3]">
                  {formatValue(value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-[#21262d] text-xs text-[#8b949e]">
        {label} · Click a row to pin for comparison
        {includeSubScenarios && <span className="ml-2 text-[#d29922]">· Sub-scenarios included (indented)</span>}
      </div>
    </div>
  );
}
