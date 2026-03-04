'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useCountryData } from '../hooks/useCountryData';
import { useDashboardStore } from '../store/dashboardStore';
import { CONTINENT_COUNTRIES, CONTINENT_ORDER } from '../data/continents';
import { COUNTRY_POP_M, CONTINENT_POP_M, WORLD_POP_M } from '../data/populations';

const SPECIES_LIST = ['chickens', 'cattle', 'pigs', 'sheep', 'ducks', 'goats', 'turkeys', 'rabbits', 'geese', 'other'] as const;
type Species = typeof SPECIES_LIST[number];

const SPECIES_COLOURS_TIMELINE: Record<Species, string> = {
  chickens: '#7c9e8f',
  cattle:   '#c4956a',
  pigs:     '#b07d5a',
  sheep:    '#9aad8f',
  ducks:    '#7a8fb5',
  goats:    '#8a9ec4',
  turkeys:  '#606e8a',
  rabbits:  '#9e9e76',
  geese:    '#6b8f7e',
  other:    '#6e7681',
};

interface SeriesItem {
  id: string;
  code: string;   // country ISO3 | continent name | 'WORLD'
  label: string;
  species: Species;
  data: { year: number; value: number }[];
}

type DisplayMode =
  | { mode: 'world' }
  | { mode: 'continent'; continents: { continent: string; codes: string[] }[] }
  | { mode: 'country'; codes: string[] };

type NormType = 'raw' | 'perCapita';

// ─────────────────────────────────────────────────────────────────────────────

export function TimelineChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 480 });
  const { countryData, countries, loading } = useCountryData();
  const { selectedCountries, toggleCountry, setSelectedCountries, yearRange, setYearRange } = useDashboardStore();
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set(['chickens', 'cattle', 'pigs']));
  const [normType, setNormType] = useState<NormType>('raw');
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; year: number; label: string; species: Species; value: number;
  } | null>(null);
  const [showAllPills, setShowAllPills] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setDims({ width: r.width, height: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Display mode ────────────────────────────────────────────────────────────
  const countryCodeSet = React.useMemo(() => new Set(countries.map(c => c.code)), [countries]);

  const displayMode: DisplayMode = React.useMemo(() => {
    if (selectedCountries.size === 0) return { mode: 'world' };

    const fullySelected: { continent: string; codes: string[] }[] = [];
    let covered = 0;
    for (const cont of CONTINENT_ORDER) {
      const contCodes = (CONTINENT_COUNTRIES[cont] ?? []).filter(c => countryCodeSet.has(c));
      if (contCodes.length === 0) continue;
      if (contCodes.every(c => selectedCountries.has(c))) {
        fullySelected.push({ continent: cont, codes: contCodes });
        covered += contCodes.length;
      }
    }
    if (covered === selectedCountries.size && fullySelected.length > 0) {
      return { mode: 'continent', continents: fullySelected };
    }
    return { mode: 'country', codes: Array.from(selectedCountries) };
  }, [selectedCountries, countryCodeSet]);

  // ── Series data (with optional per-capita normalisation) ───────────────────
  const seriesData = React.useMemo((): SeriesItem[] => {
    const rawSeries: SeriesItem[] = [];

    if (displayMode.mode === 'world') {
      const ys = new Map<string, number>();
      const allYears = new Set<number>();
      for (const row of countryData) {
        if (row.year < yearRange[0] || row.year > yearRange[1]) continue;
        allYears.add(row.year);
        for (const sp of selectedSpecies) {
          const key = `${row.year}-${sp}`;
          ys.set(key, (ys.get(key) ?? 0) + (row.bySpecies[sp] ?? 0));
        }
      }
      const sortedYears = Array.from(allYears).sort((a, b) => a - b);
      for (const sp of selectedSpecies) {
        const data = sortedYears
          .map(year => ({ year, value: ys.get(`${year}-${sp}`) ?? 0 }))
          .filter(p => p.value > 0);
        if (data.length > 0) rawSeries.push({ id: `world-${sp}`, code: 'WORLD', label: 'World', species: sp, data });
      }
    } else if (displayMode.mode === 'continent') {
      for (const { continent, codes } of displayMode.continents) {
        const codeSet = new Set(codes);
        const ys = new Map<string, number>();
        const allYears = new Set<number>();
        for (const row of countryData) {
          if (!codeSet.has(row.code) || row.year < yearRange[0] || row.year > yearRange[1]) continue;
          allYears.add(row.year);
          for (const sp of selectedSpecies) {
            const key = `${row.year}-${sp}`;
            ys.set(key, (ys.get(key) ?? 0) + (row.bySpecies[sp] ?? 0));
          }
        }
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        for (const sp of selectedSpecies) {
          const data = sortedYears
            .map(year => ({ year, value: ys.get(`${year}-${sp}`) ?? 0 }))
            .filter(p => p.value > 0);
          if (data.length > 0) {
            rawSeries.push({ id: `${continent}-${sp}`, code: continent, label: continent, species: sp, data });
          }
        }
      }
    } else {
      for (const code of displayMode.codes) {
        const label = countries.find(c => c.code === code)?.entity ?? code;
        const rows = countryData
          .filter(r => r.code === code && r.year >= yearRange[0] && r.year <= yearRange[1])
          .sort((a, b) => a.year - b.year);
        for (const sp of selectedSpecies) {
          const pts = rows.map(r => ({ year: r.year, value: r.bySpecies[sp] ?? 0 })).filter(p => p.value > 0);
          if (pts.length > 0) rawSeries.push({ id: `${code}-${sp}`, code, label, species: sp, data: pts });
        }
      }
    }

    // Apply per-capita normalisation
    if (normType !== 'perCapita') return rawSeries;

    return rawSeries.map(s => {
      const pop =
        s.code === 'WORLD'              ? WORLD_POP_M * 1e6 :
        displayMode.mode === 'continent' ? (CONTINENT_POP_M[s.code] ?? 100) * 1e6 :
        (COUNTRY_POP_M[s.code] ?? 5) * 1e6;
      return { ...s, data: s.data.map(pt => ({ ...pt, value: pt.value / pop })) };
    });
  }, [countryData, displayMode, selectedSpecies, yearRange, countries, normType]);

  // ── D3 render ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || dims.width === 0 || seriesData.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 140, bottom: 50, left: 75 };
    const width = dims.width - margin.left - margin.right;
    const height = dims.height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const allYears = seriesData.flatMap(s => s.data.map(p => p.year));
    const allValues = seriesData.flatMap(s => s.data.map(p => p.value));

    const xScale = d3.scaleLinear()
      .domain([d3.min(allYears) ?? 1961, d3.max(allYears) ?? 2023])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, (d3.max(allValues) ?? 1) * 1.1])
      .range([height, 0])
      .nice();

    // Gridlines
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => ''))
      .selectAll('line').attr('stroke', '#21262d').attr('stroke-dasharray', '3,3');

    // Axes
    const tickFmt = (d: d3.NumberValue) => {
      const n = Number(d);
      if (normType === 'perCapita') {
        if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
        if (n >= 1e3)  return `${(n / 1e3).toFixed(0)}K`;
        return n.toFixed(1);
      }
      if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
      if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
      if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
      return String(n);
    };

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(10));
    xAxis.selectAll('text').attr('fill', '#8b949e').attr('font-size', '10px').attr('font-family', 'DM Mono, monospace');
    xAxis.selectAll('line, path').attr('stroke', '#30363d');

    const yAxis = g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(tickFmt));
    yAxis.selectAll('text').attr('fill', '#8b949e').attr('font-size', '10px').attr('font-family', 'DM Mono, monospace');
    yAxis.selectAll('line, path').attr('stroke', '#30363d');

    g.append('text')
      .attr('x', width / 2).attr('y', height + 42)
      .attr('text-anchor', 'middle').attr('fill', '#8b949e').attr('font-size', '11px')
      .text('Year');
    g.append('text')
      .attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -60)
      .attr('text-anchor', 'middle').attr('fill', '#8b949e').attr('font-size', '11px')
      .text(normType === 'perCapita' ? 'SADs per person' : 'Estimated SADs');

    // Dash per unique line ID (country/continent/world)
    const lineIds = [...new Set(seriesData.map(s => s.code))];
    const DASHES = ['none', '5,3', '10,3,2,3', '3,3', '8,2,2,2,2,2'];
    const lineDash: Record<string, string> = {};
    lineIds.forEach((id, i) => { lineDash[id] = DASHES[i % DASHES.length]; });

    const line = d3.line<{ year: number; value: number }>()
      .x(d => xScale(d.year)).y(d => yScale(d.value)).curve(d3.curveMonotoneX);

    seriesData.forEach(s => {
      g.append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', SPECIES_COLOURS_TIMELINE[s.species])
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', lineDash[s.code] || 'none')
        .attr('opacity', 0.85)
        .attr('d', line);
    });

    // Legend
    const legendG = svg.append('g').attr('transform', `translate(${margin.left + width + 10}, ${margin.top})`);
    legendG.append('text').attr('y', -5).attr('font-size', '10px').attr('fill', '#6e7681').text('Species');
    Array.from(selectedSpecies).forEach((sp, i) => {
      const row = legendG.append('g').attr('transform', `translate(0, ${i * 16})`);
      row.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 5).attr('y2', 5)
        .attr('stroke', SPECIES_COLOURS_TIMELINE[sp]).attr('stroke-width', 2);
      row.append('text').attr('x', 20).attr('y', 9).attr('font-size', '10px').attr('fill', '#8b949e').text(sp);
    });

    const lineLabel = displayMode.mode === 'continent' ? 'Continents' : displayMode.mode === 'country' ? 'Countries' : null;
    if (lineLabel && lineIds.length > 1) {
      const lineY = selectedSpecies.size * 16 + 16;
      legendG.append('text').attr('y', lineY - 5).attr('font-size', '10px').attr('fill', '#6e7681').text(lineLabel);
      lineIds.forEach((id, i) => {
        const label = seriesData.find(s => s.code === id)?.label ?? id;
        const row = legendG.append('g').attr('transform', `translate(0, ${lineY + i * 16})`);
        row.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 5).attr('y2', 5)
          .attr('stroke', '#8b949e').attr('stroke-width', 2).attr('stroke-dasharray', lineDash[id] || 'none');
        row.append('text').attr('x', 20).attr('y', 9).attr('font-size', '10px').attr('fill', '#8b949e').text(label.slice(0, 14));
      });
    }

    // Hover: nearest line to cursor
    const bisect = d3.bisector<{ year: number; value: number }, number>(d => d.year).left;
    const hoverLine = g.append('line')
      .attr('stroke', '#6e7681').attr('stroke-width', 1).attr('stroke-dasharray', '4,2')
      .attr('y1', 0).attr('y2', height).attr('opacity', 0);

    g.append('rect')
      .attr('width', width).attr('height', height).attr('fill', 'transparent')
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        hoverLine.attr('x1', xScale(year)).attr('x2', xScale(year)).attr('opacity', 1);

        let closest: { series: SeriesItem; value: number } | null = null;
        let minDist = Infinity;
        for (const s of seriesData) {
          if (s.data.length === 0) continue;
          const idx = Math.min(bisect(s.data, year, 0, s.data.length - 1), s.data.length - 1);
          const pt = s.data[idx];
          if (!pt) continue;
          const dist = Math.abs(yScale(pt.value) - my);
          if (dist < minDist) { minDist = dist; closest = { series: s, value: pt.value }; }
        }
        if (closest) {
          setTooltip({ x: event.clientX, y: event.clientY, year, label: closest.series.label, species: closest.series.species, value: closest.value });
        }
      })
      .on('mouseleave', () => { hoverLine.attr('opacity', 0); setTooltip(null); });

  }, [seriesData, dims, selectedSpecies, displayMode, normType]);

  // ── Scope pills ─────────────────────────────────────────────────────────────
  const scopePills: { key: string; label: string; onRemove: () => void }[] = React.useMemo(() => {
    if (displayMode.mode === 'world') return [];
    if (displayMode.mode === 'continent') {
      return displayMode.continents.map(({ continent, codes }) => ({
        key: continent,
        label: continent,
        onRemove: () => { const n = new Set(selectedCountries); codes.forEach(c => n.delete(c)); setSelectedCountries(n); },
      }));
    }
    return displayMode.codes.map(code => ({
      key: code,
      label: countries.find(c => c.code === code)?.entity ?? code,
      onRemove: () => toggleCountry(code),
    }));
  }, [displayMode, selectedCountries, setSelectedCountries, toggleCountry, countries]);

  const PILL_LIMIT = 10;
  const visiblePills = showAllPills ? scopePills : scopePills.slice(0, PILL_LIMIT);
  const overflow = scopePills.length - PILL_LIMIT;

  function fmtVal(n: number): string {
    if (normType === 'perCapita') {
      if (n >= 1e6)  return `${(n / 1e6).toFixed(2)}M`;
      if (n >= 1e3)  return `${(n / 1e3).toFixed(1)}K`;
      return n.toFixed(1);
    }
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9)  return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`;
    return n.toLocaleString();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-start gap-4 px-4 py-3 border-b border-[#21262d] flex-wrap">

        {/* Species */}
        <div className="flex-shrink-0">
          <div className="text-xs text-[#8b949e] mb-1.5">Species</div>
          <div className="flex flex-wrap gap-1.5">
            {SPECIES_LIST.map(sp => (
              <button
                key={sp}
                onClick={() => setSelectedSpecies(prev => {
                  const next = new Set(prev);
                  if (next.has(sp)) next.delete(sp); else next.add(sp);
                  return next;
                })}
                className={`px-2 py-0.5 rounded text-xs transition-colors border ${
                  selectedSpecies.has(sp)
                    ? 'border-transparent text-[#0d1117] font-medium'
                    : 'border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]'
                }`}
                style={selectedSpecies.has(sp) ? { backgroundColor: SPECIES_COLOURS_TIMELINE[sp] } : {}}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Year range */}
        <div className="flex-shrink-0">
          <div className="text-xs text-[#8b949e] mb-1.5">Year range</div>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1961} max={yearRange[1]} value={yearRange[0]}
              onChange={e => setYearRange([Number(e.target.value), yearRange[1]])}
              className="w-16 bg-[#21262d] border border-[#30363d] rounded px-1.5 py-0.5 text-xs text-[#e6edf3] font-mono"
            />
            <span className="text-[#8b949e] text-xs">–</span>
            <input
              type="number" min={yearRange[0]} max={2023} value={yearRange[1]}
              onChange={e => setYearRange([yearRange[0], Number(e.target.value)])}
              className="w-16 bg-[#21262d] border border-[#30363d] rounded px-1.5 py-0.5 text-xs text-[#e6edf3] font-mono"
            />
          </div>
        </div>

        {/* Normalisation */}
        <div className="flex-shrink-0">
          <div className="text-xs text-[#8b949e] mb-1.5">Scale</div>
          <div className="flex gap-1">
            {([['raw', 'Total SADs'], ['perCapita', 'Per capita']] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setNormType(v)}
                className={`px-2 py-0.5 rounded text-xs transition-colors border ${
                  normType === v ? 'bg-[#21262d] border-[#30363d] text-[#e6edf3]' : 'border-transparent text-[#6e7681] hover:text-[#8b949e]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#8b949e] mb-1.5">
            {displayMode.mode === 'world' && 'Scope'}
            {displayMode.mode === 'continent' && `Scope · ${displayMode.continents.length} continent${displayMode.continents.length > 1 ? 's' : ''}`}
            {displayMode.mode === 'country' && `Scope · ${displayMode.codes.length} countr${displayMode.codes.length === 1 ? 'y' : 'ies'}`}
          </div>
          {displayMode.mode === 'world' ? (
            <span className="text-xs text-[#8b949e] bg-[#161b22] px-2 py-0.5 rounded">
              🌍 World total · select from sidebar
            </span>
          ) : (
            <div className="flex flex-wrap gap-1 items-center">
              {visiblePills.map(pill => (
                <span key={pill.key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] text-xs text-[#8b949e]">
                  {pill.label}
                  <button onClick={pill.onRemove} className="hover:text-[#e6edf3]">✕</button>
                </span>
              ))}
              {!showAllPills && overflow > 0 && (
                <button onClick={() => setShowAllPills(true)} className="px-1.5 py-0.5 text-xs text-[#6e7681] hover:text-[#8b949e]">
                  +{overflow} more
                </button>
              )}
              {showAllPills && overflow > 0 && (
                <button onClick={() => setShowAllPills(false)} className="px-1.5 py-0.5 text-xs text-[#6e7681] hover:text-[#8b949e]">
                  show less
                </button>
              )}
              <button onClick={() => setSelectedCountries(new Set())} className="text-xs text-[#6e7681] hover:text-[#e6edf3] ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[#8b949e] text-sm">
            Loading country data…
          </div>
        )}
        {!loading && seriesData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[#6e7681] text-sm">
            No data for selected filters
          </div>
        )}
        <svg ref={svgRef} width={dims.width} height={dims.height} className="block" />

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border border-[#30363d] bg-[#161b22] p-2.5 shadow-2xl text-xs"
            style={{ left: tooltip.x + 14, top: tooltip.y - 8 }}
          >
            <div className="text-[#6e7681] font-mono mb-1">{tooltip.year}</div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SPECIES_COLOURS_TIMELINE[tooltip.species] }} />
              <span className="text-[#e6edf3] font-medium">{tooltip.label}</span>
              <span className="text-[#6e7681]">·</span>
              <span className="text-[#8b949e]">{tooltip.species}</span>
            </div>
            <div className="text-[#7c9e8f] font-mono font-semibold">
              {fmtVal(tooltip.value)} {normType === 'perCapita' ? 'SADs/person' : 'SADs'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
