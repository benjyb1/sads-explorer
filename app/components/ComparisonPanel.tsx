'use client';
import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { useDashboardStore, PinnedScenario } from '../store/dashboardStore';
import { PAIN_COLOURS, SPECIES_COLOURS, getDisplayAnimal } from '../data/sads-scenarios';
import { formatSads, formatAnimals } from './Tooltip';

const RADAR_COLOURS = ['#7c9e8f', '#7a8fb5', '#c4956a'];

export function ComparisonPanel() {
  const { pinnedScenarios, unpinScenario } = useDashboardStore();

  if (pinnedScenarios.length === 0) return null;

  const maxBurden = Math.max(...pinnedScenarios.map(s => s.totalSadBurden));
  const maxAnimals = Math.max(...pinnedScenarios.map(s => s.animalsSlaughteredPerYear));
  const maxSads = Math.max(...pinnedScenarios.map(s => s.avgSadsPerFarmingYear ?? 0));
  const painScore: Record<string, number> = { extreme: 4, severe: 3, moderate: 2, mild: 1 };

  // Build radar data
  const radarData = [
    {
      axis: 'Total Burden',
      ...Object.fromEntries(pinnedScenarios.map((s, i) => [
        `s${i}`, maxBurden > 0 ? (s.totalSadBurden / maxBurden) * 100 : 0,
      ])),
    },
    {
      axis: 'SADs/Animal',
      ...Object.fromEntries(pinnedScenarios.map((s, i) => [
        `s${i}`, maxSads > 0 ? ((s.avgSadsPerFarmingYear ?? 0) / maxSads) * 100 : 0,
      ])),
    },
    {
      axis: 'Animals/yr',
      ...Object.fromEntries(pinnedScenarios.map((s, i) => [
        `s${i}`, maxAnimals > 0 ? (s.animalsSlaughteredPerYear / maxAnimals) * 100 : 0,
      ])),
    },
    {
      axis: 'Pain Level',
      ...Object.fromEntries(pinnedScenarios.map((s, i) => [
        `s${i}`, (painScore[s.painLevel] / 4) * 100,
      ])),
    },
  ];

  return (
    <div className="fixed bottom-0 left-[280px] right-0 z-40 border-t border-[#30363d] bg-[#0d1117] shadow-2xl">
      <div className="flex items-stretch">
        {/* Scenario cards */}
        <div className="flex flex-1 divide-x divide-[#21262d]">
          {pinnedScenarios.map((s, i) => (
            <ScenarioCard key={s.scenario} scenario={s} colour={RADAR_COLOURS[i]} onUnpin={() => unpinScenario(s.scenario)} />
          ))}
          {pinnedScenarios.length < 3 && (
            <div className="flex items-center justify-center px-8 text-xs text-[#3d444d] italic flex-1">
              Click scenarios to pin (up to 3)
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div className="w-64 flex-shrink-0 p-2">
          <div className="text-xs text-[#6e7681] mb-1 text-center">Comparison radar (normalised)</div>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#21262d" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: '#8b949e', fontFamily: 'DM Sans' }} />
              {pinnedScenarios.map((_, i) => (
                <Radar
                  key={i}
                  name={pinnedScenarios[i].scenario}
                  dataKey={`s${i}`}
                  stroke={RADAR_COLOURS[i]}
                  fill={RADAR_COLOURS[i]}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              ))}
              <Tooltip
                contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', fontSize: '11px' }}
                labelStyle={{ color: '#8b949e' }}
                itemStyle={{ color: '#e6edf3' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario: s, colour, onUnpin }: {
  scenario: PinnedScenario;
  colour: string;
  onUnpin: () => void;
}) {
  return (
    <div className="flex-1 p-3 relative" style={{ borderTop: `2px solid ${colour}` }}>
      <button
        onClick={onUnpin}
        className="absolute top-2 right-2 text-[#6e7681] hover:text-[#e6edf3] text-xs"
      >
        ✕
      </button>
      <div
        className="w-2 h-2 rounded-full inline-block mr-1.5 mb-0.5"
        style={{ backgroundColor: SPECIES_COLOURS[getDisplayAnimal(s.animal)] ?? SPECIES_COLOURS[s.animal] ?? colour }}
      />
      <span className="text-[#8b949e] text-xs">{getDisplayAnimal(s.animal)}</span>
      <div className="font-semibold text-[#e6edf3] text-sm mt-0.5 pr-4">{s.scenario}</div>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
          style={{ backgroundColor: PAIN_COLOURS[s.painLevel] }}
        >
          {s.painLevel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-xs">
        <span className="text-[#8b949e]">Total burden</span>
        <span className="font-mono text-[#e6edf3]">{formatSads(s.totalSadBurden)}</span>
        {s.avgSadsPerFarmingYear != null && (
          <>
            <span className="text-[#8b949e]">SADs/animal</span>
            <span className="font-mono text-[#e6edf3]">{s.avgSadsPerFarmingYear.toFixed(1)}</span>
          </>
        )}
        <span className="text-[#8b949e]">Animals/yr</span>
        <span className="font-mono text-[#e6edf3]">{formatAnimals(s.animalsSlaughteredPerYear)}</span>
      </div>
    </div>
  );
}
