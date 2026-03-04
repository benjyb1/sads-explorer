'use client';
import React from 'react';
import { useTotalStats } from '../hooks/useFilteredData';
import { PAIN_COLOURS, PainLevel } from '../data/sads-scenarios';
import { useDashboardStore, MetricType } from '../store/dashboardStore';
import { formatSads, formatAnimals } from './Tooltip';

const PAIN_LEVELS: PainLevel[] = ['extreme', 'severe', 'moderate', 'mild'];
const PAIN_LABELS: Record<PainLevel, string> = {
  extreme: 'Extreme', severe: 'Severe', moderate: 'Moderate', mild: 'Mild',
};

const METRICS: { value: MetricType; label: string }[] = [
  { value: 'totalSadBurden', label: 'Total burden' },
  { value: 'avgSadsPerFarmingYear', label: 'SADs/animal' },
  { value: 'animalsSlaughteredPerYear', label: 'Animals/yr' },
];

export function StatsBar() {
  const { totalBurden, totalAnimals, worstScenario, scenarioCount } = useTotalStats();
  const { metric, setMetric, selectedPainLevels, togglePainLevel, activeView } = useDashboardStore();

  return (
    <div className="flex items-center gap-0 px-4 border-b border-[#30363d] bg-[#0d1117] text-sm flex-shrink-0" style={{ minHeight: 48 }}>

      {/* ── Summary stats ─────────────────────────── */}
      <div className="flex items-center gap-4 pr-4 border-r border-[#30363d] py-2">
        <StatItem label="Total SADs" value={`${formatSads(totalBurden)}`} accent="#7c9e8f" />
        <div className="w-px h-5 bg-[#30363d]" />
        <StatItem label="Animals" value={formatAnimals(totalAnimals)} accent="#7a8fb5" />
        <div className="w-px h-5 bg-[#30363d]" />
        <StatItem label="Scenarios" value={scenarioCount.toString()} accent="#9aad8f" />
        {worstScenario && (
          <>
            <div className="w-px h-5 bg-[#30363d]" />
            <div className="flex flex-col">
              <span className="text-[#8b949e] text-[10px] uppercase tracking-wider">Worst scenario</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PAIN_COLOURS[worstScenario.painLevel] }} />
                <span className="text-[#e6edf3] text-xs font-medium truncate max-w-[140px]">{worstScenario.scenario}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Metric selector (treemap only) ─────────── */}
      {activeView === 'treemap' && (
        <div className="flex items-center gap-1 px-4 border-r border-[#30363d] py-2">
          <span className="text-[10px] uppercase tracking-wider text-[#6e7681] mr-1.5">Metric</span>
          {METRICS.map(m => (
            <button
              key={m.value}
              onClick={() => setMetric(m.value)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                metric === m.value
                  ? 'bg-[#21262d] text-[#e6edf3]'
                  : 'text-[#6e7681] hover:text-[#8b949e] hover:bg-[#161b22]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Pain level filter ──────────────────────── */}
      <div className="flex items-center gap-1.5 px-4 py-2">
        <span className="text-[10px] uppercase tracking-wider text-[#6e7681] mr-1">Pain</span>
        {PAIN_LEVELS.map(pl => (
          <button
            key={pl}
            onClick={() => togglePainLevel(pl)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
              selectedPainLevels.has(pl)
                ? 'text-white border-transparent'
                : 'bg-transparent border-[#30363d] text-[#3d444d] hover:text-[#6e7681]'
            }`}
            style={selectedPainLevels.has(pl) ? { backgroundColor: PAIN_COLOURS[pl] } : {}}
          >
            {PAIN_LABELS[pl]}
          </button>
        ))}
      </div>

      <div className="ml-auto text-[#6e7681] text-xs pr-2 whitespace-nowrap">
        185 countries · 2023
      </div>
    </div>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[#8b949e] text-[10px] uppercase tracking-wider">{label}</span>
      <span className="font-mono font-semibold text-sm mt-0.5" style={{ color: accent }}>{value}</span>
    </div>
  );
}
