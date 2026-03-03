'use client';
import React, { useState } from 'react';
import { useFilteredScenarios } from '../hooks/useFilteredData';
import { PAIN_COLOURS, SadScenario } from '../data/sads-scenarios';
import { useDashboardStore } from '../store/dashboardStore';
import { formatSads, formatAnimals } from './Tooltip';

type Column = 'animal' | 'scenario' | 'avgSadsPerFarmingYear' | 'animalsSlaughteredPerYear' | 'totalSadBurden' | 'painLevel';

const COLUMNS: { key: Column; label: string; mono?: boolean }[] = [
  { key: 'animal', label: 'Animal' },
  { key: 'scenario', label: 'Scenario' },
  { key: 'avgSadsPerFarmingYear', label: 'SADs/Animal', mono: true },
  { key: 'animalsSlaughteredPerYear', label: 'Animals/yr', mono: true },
  { key: 'totalSadBurden', label: 'Total SAD Burden', mono: true },
  { key: 'painLevel', label: 'Pain Level' },
];

export function DataTable() {
  const scenarios = useFilteredScenarios();
  const { pinScenario } = useDashboardStore();
  const [sortCol, setSortCol] = useState<Column>('totalSadBurden');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [visibleCols, setVisibleCols] = useState<Set<Column>>(new Set(COLUMNS.map(c => c.key)));
  const [search, setSearch] = useState('');

  const handleSort = (col: Column) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const filtered = scenarios.filter(s =>
    search === '' ||
    s.scenario.toLowerCase().includes(search.toLowerCase()) ||
    s.animal.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortCol) {
      case 'animal': aVal = a.animal; bVal = b.animal; break;
      case 'scenario': aVal = a.scenario; bVal = b.scenario; break;
      case 'avgSadsPerFarmingYear': aVal = a.avgSadsPerFarmingYear ?? 0; bVal = b.avgSadsPerFarmingYear ?? 0; break;
      case 'animalsSlaughteredPerYear': aVal = a.animalsSlaughteredPerYear; bVal = b.animalsSlaughteredPerYear; break;
      case 'totalSadBurden': aVal = a.totalSadBurden; bVal = b.totalSadBurden; break;
      case 'painLevel': {
        const score: Record<string, number> = { extreme: 4, severe: 3, moderate: 2, mild: 1 };
        aVal = score[a.painLevel] ?? 0;
        bVal = score[b.painLevel] ?? 0;
        break;
      }
    }

    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const exportCSV = () => {
    const headers = COLUMNS.filter(c => visibleCols.has(c.key)).map(c => c.label);
    const rows = sorted.map(s => [
      s.animal, s.scenario,
      s.avgSadsPerFarmingYear ?? 'N/A',
      s.animalsSlaughteredPerYear,
      s.totalSadBurden,
      s.painLevel,
    ].filter((_, i) => visibleCols.has(COLUMNS[i].key)));

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sads-data.csv';
    a.click();
  };

  const PAIN_BG: Record<string, string> = {
    extreme: '#2d1a1a',
    severe:  '#2d1f10',
    moderate:'#2a2210',
    mild:    '#0d1f0d',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#21262d]">
        <input
          type="text"
          placeholder="Search scenarios…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#21262d] border border-[#30363d] rounded px-2.5 py-1 text-xs text-[#e6edf3] placeholder-[#6e7681] w-48 focus:outline-none focus:border-[#6e7681]"
        />
        <div className="flex gap-1 ml-2 text-xs text-[#8b949e]">
          {COLUMNS.map(c => (
            <button
              key={c.key}
              onClick={() => {
                setVisibleCols(prev => {
                  const next = new Set(prev);
                  if (next.has(c.key)) next.delete(c.key);
                  else next.add(c.key);
                  return next;
                });
              }}
              className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                visibleCols.has(c.key)
                  ? 'border-[#30363d] text-[#8b949e]'
                  : 'border-transparent text-[#3d444d]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="ml-auto px-3 py-1 rounded border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#6e7681] transition-colors"
        >
          Export CSV
        </button>
        <span className="text-xs text-[#6e7681]">{sorted.length} rows</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-[#0d1117] z-10">
            <tr>
              {COLUMNS.filter(c => visibleCols.has(c.key)).map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2 text-left text-[#8b949e] border-b border-[#21262d] cursor-pointer hover:text-[#e6edf3] whitespace-nowrap select-none"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key && (
                      <span className="text-[#7c9e8f]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 text-left text-[#8b949e] border-b border-[#21262d]">Pin</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr
                key={s.scenario}
                className="border-b border-[#161b22] hover:bg-[#161b22] transition-colors"
                style={{ backgroundColor: i % 2 === 0 ? 'transparent' : '#0a0e14' }}
              >
                {visibleCols.has('animal') && (
                  <td className="px-3 py-2 text-[#8b949e]">{s.animal}</td>
                )}
                {visibleCols.has('scenario') && (
                  <td className="px-3 py-2 text-[#e6edf3] font-medium">
                    {s.scenario}
                    {s.isSubScenario && (
                      <span className="ml-1.5 text-[10px] text-[#6e7681] font-normal">(sub)</span>
                    )}
                  </td>
                )}
                {visibleCols.has('avgSadsPerFarmingYear') && (
                  <td className="px-3 py-2 font-mono text-[#e6edf3]">
                    {s.avgSadsPerFarmingYear != null ? s.avgSadsPerFarmingYear.toFixed(1) : '—'}
                  </td>
                )}
                {visibleCols.has('animalsSlaughteredPerYear') && (
                  <td className="px-3 py-2 font-mono text-[#e6edf3]">
                    {formatAnimals(s.animalsSlaughteredPerYear)}
                  </td>
                )}
                {visibleCols.has('totalSadBurden') && (
                  <td className="px-3 py-2 font-mono text-[#e6edf3]">
                    {formatSads(s.totalSadBurden)}
                  </td>
                )}
                {visibleCols.has('painLevel') && (
                  <td className="px-3 py-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium"
                      style={{
                        backgroundColor: PAIN_COLOURS[s.painLevel],
                        boxShadow: `0 0 0 1px ${PAIN_COLOURS[s.painLevel]}40`,
                      }}
                    >
                      {s.painLevel}
                    </span>
                  </td>
                )}
                <td className="px-3 py-2">
                  <button
                    onClick={() => pinScenario({
                      animal: s.animal,
                      scenario: s.scenario,
                      totalSadBurden: s.totalSadBurden,
                      avgSadsPerFarmingYear: s.avgSadsPerFarmingYear,
                      animalsSlaughteredPerYear: s.animalsSlaughteredPerYear,
                      painLevel: s.painLevel,
                    })}
                    className="text-[#6e7681] hover:text-[#7c9e8f] transition-colors"
                    title="Pin for comparison"
                  >
                    ⊕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
