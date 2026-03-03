'use client';
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatSads } from './Tooltip';

const DIET_SPECIES = [
  { key: 'chicken', label: 'Chicken/poultry', sadsPerAnimal: 13.3, animalsPerPersonPerYear: 28 },
  { key: 'beef', label: 'Beef', sadsPerAnimal: 7.3, animalsPerPersonPerYear: 0.04 },
  { key: 'dairy', label: 'Dairy', sadsPerAnimal: 18.6, animalsPerPersonPerYear: 0.08 },
  { key: 'eggs', label: 'Eggs', sadsPerAnimal: 8.3, animalsPerPersonPerYear: 3 },
  { key: 'pork', label: 'Pork', sadsPerAnimal: 7.3, animalsPerPersonPerYear: 0.35 },
  { key: 'fish', label: 'Fish', sadsPerAnimal: 7.4, animalsPerPersonPerYear: 12 },
  { key: 'shrimp', label: 'Shrimp', sadsPerAnimal: 6.9, animalsPerPersonPerYear: 90 },
];

const SPECIES_COLOURS: Record<string, string> = {
  chicken: '#7c9e8f',
  beef:    '#c4956a',
  dairy:   '#c9a87c',
  eggs:    '#9aad8f',
  pork:    '#b07d5a',
  fish:    '#7a8fb5',
  shrimp:  '#b5856e',
};

export function WhatIfCalculator() {
  const [people, setPeople] = useState(10000);
  const [dietPct, setDietPct] = useState<Record<string, number>>({
    chicken: 80,
    beef: 60,
    dairy: 40,
    eggs: 70,
    pork: 50,
    fish: 30,
    shrimp: 20,
  });

  const results = useMemo(() => {
    return DIET_SPECIES.map(sp => {
      const reduction = (dietPct[sp.key] ?? 0) / 100;
      const animalsAvertedPerPerson = sp.animalsPerPersonPerYear * reduction;
      const sadsAverted = people * animalsAvertedPerPerson * sp.sadsPerAnimal;
      return {
        key: sp.key,
        label: sp.label,
        sadsAverted,
        animalsAverted: people * animalsAvertedPerPerson,
      };
    });
  }, [people, dietPct]);

  const totalSadsAverted = results.reduce((a, r) => a + r.sadsAverted, 0);

  const pieData = results
    .filter(r => r.sadsAverted > 0)
    .map(r => ({ name: r.label, value: r.sadsAverted, key: r.key }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-xs font-semibold text-[#e6edf3] mb-1">Number of people adopting vegan diet</div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={100}
            max={10_000_000}
            step={100}
            value={people}
            onChange={e => setPeople(Number(e.target.value))}
            className="flex-1 h-1 appearance-none bg-[#30363d] rounded"
            style={{ accentColor: '#7c9e8f' }}
          />
          <input
            type="number"
            value={people}
            onChange={e => setPeople(Number(e.target.value))}
            className="w-28 bg-[#21262d] border border-[#30363d] rounded px-2 py-0.5 text-xs text-[#e6edf3] font-mono"
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-[#e6edf3] mb-2">Diet breakdown (% eliminated per person)</div>
        <div className="space-y-2">
          {DIET_SPECIES.map(sp => (
            <div key={sp.key} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: SPECIES_COLOURS[sp.key] }}
              />
              <span className="text-xs text-[#8b949e] w-28 flex-shrink-0">{sp.label}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={dietPct[sp.key] ?? 0}
                onChange={e => setDietPct(prev => ({ ...prev, [sp.key]: Number(e.target.value) }))}
                className="flex-1 h-1 appearance-none bg-[#30363d] rounded"
                style={{ accentColor: SPECIES_COLOURS[sp.key] }}
              />
              <span className="text-xs font-mono text-[#e6edf3] w-8 text-right">{dietPct[sp.key]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3">
        <div className="text-xs text-[#8b949e] mb-1">Estimated SADs averted per year</div>
        <div className="text-xl font-mono font-bold text-[#7c9e8f]">
          {formatSads(totalSadsAverted)}
        </div>
        <div className="text-xs text-[#8b949e] mt-0.5">
          for {people.toLocaleString()} people going fully vegan on selected items
        </div>
      </div>

      {pieData.length > 0 && (
        <div>
          <div className="text-xs text-[#8b949e] mb-1">SADs averted by species</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                strokeWidth={0}
              >
                {pieData.map(entry => (
                  <Cell key={entry.key} fill={SPECIES_COLOURS[entry.key] ?? '#7c9e8f'} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', fontSize: '11px' }}
                formatter={(value: number | undefined) => [formatSads(value ?? 0), 'SADs averted'] as [string, string]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {pieData.map(d => (
              <div key={d.key} className="flex items-center gap-1 text-xs text-[#8b949e]">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: SPECIES_COLOURS[d.key] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-[#6e7681] italic">
        Note: Uses baseline scenario SADs/animal. Actual impact varies by region and farming system.
      </div>
    </div>
  );
}
