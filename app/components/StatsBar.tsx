'use client';
import React from 'react';
import { useTotalStats } from '../hooks/useFilteredData';
import { PAIN_COLOURS } from '../data/sads-scenarios';
import { formatSads, formatAnimals } from './Tooltip';

export function StatsBar() {
  const { totalBurden, totalAnimals, worstScenario, scenarioCount } = useTotalStats();

  return (
    <div className="flex items-center gap-6 px-6 py-3 border-b border-[#30363d] bg-[#0d1117] text-sm flex-wrap">
      <StatItem
        label="Total SADs"
        value={`${formatSads(totalBurden)} SAD-days`}
        accent="#7c9e8f"
      />
      <div className="w-px h-6 bg-[#30363d]" />
      <StatItem
        label="Animals represented"
        value={formatAnimals(totalAnimals)}
        accent="#7a8fb5"
      />
      <div className="w-px h-6 bg-[#30363d]" />
      <StatItem
        label="Scenarios"
        value={scenarioCount.toString()}
        accent="#9aad8f"
      />
      {worstScenario && (
        <>
          <div className="w-px h-6 bg-[#30363d]" />
          <div className="flex flex-col">
            <span className="text-[#8b949e] text-xs uppercase tracking-wider">Highest pain scenario</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: PAIN_COLOURS[worstScenario.painLevel] }}
              />
              <span className="text-[#e6edf3] font-medium">{worstScenario.scenario}</span>
            </div>
          </div>
        </>
      )}
      <div className="ml-auto text-[#8b949e] text-xs">
        Showing 2023 data · 185 countries
      </div>
    </div>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[#8b949e] text-xs uppercase tracking-wider">{label}</span>
      <span className="font-mono font-semibold mt-0.5" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}
