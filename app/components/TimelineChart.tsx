'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useCountryData } from '../hooks/useCountryData';
import { useDashboardStore } from '../store/dashboardStore';

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

export function TimelineChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 480 });
  const { countryData, countries, loading } = useCountryData();
  const { selectedCountries, toggleCountry, yearRange, setYearRange } = useDashboardStore();
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set(['chickens', 'cattle', 'pigs']));
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

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

  const activeCountries = selectedCountries.size > 0
    ? Array.from(selectedCountries)
    : countries.slice(0, 3).map(c => c.code);

  // Build series data: for each country × species, array of {year, value}
  const seriesData = React.useMemo(() => {
    const series: { id: string; code: string; species: Species; data: { year: number; value: number }[] }[] = [];

    for (const code of activeCountries) {
      const rows = countryData
        .filter(r => r.code === code && r.year >= yearRange[0] && r.year <= yearRange[1])
        .sort((a, b) => a.year - b.year);

      for (const sp of selectedSpecies) {
        const pts = rows
          .map(r => ({
            year: r.year,
            value: (r.bySpecies[sp] ?? 0), // already SADs
          }))
          .filter(p => p.value > 0);

        if (pts.length > 0) {
          series.push({ id: `${code}-${sp}`, code, species: sp, data: pts });
        }
      }
    }
    return series;
  }, [countryData, activeCountries, selectedSpecies, yearRange]);

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
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(10));
    xAxis.selectAll('text').attr('fill', '#8b949e').attr('font-size', '10px').attr('font-family', 'DM Mono, monospace');
    xAxis.selectAll('line, path').attr('stroke', '#30363d');

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => {
        const n = Number(d);
        if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
        if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
        return String(n);
      }));
    yAxis.selectAll('text').attr('fill', '#8b949e').attr('font-size', '10px').attr('font-family', 'DM Mono, monospace');
    yAxis.selectAll('line, path').attr('stroke', '#30363d');

    // Axis labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .text('Year');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .text('Estimated SADs');

    // Country dashes: different for each country
    const countryDash: Record<string, string> = {};
    activeCountries.forEach((c, i) => {
      const dashes = ['none', '5,3', '10,3,2,3', '3,3'];
      countryDash[c] = dashes[i % dashes.length];
    });

    // Lines
    const line = d3.line<{ year: number; value: number }>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    seriesData.forEach(s => {
      g.append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', SPECIES_COLOURS_TIMELINE[s.species])
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', countryDash[s.code] || 'none')
        .attr('opacity', 0.85)
        .attr('d', line);
    });

    // Legend (right side)
    const legendG = svg.append('g').attr('transform', `translate(${margin.left + width + 10}, ${margin.top})`);

    // Species legend
    legendG.append('text')
      .attr('y', -5)
      .attr('font-size', '10px')
      .attr('fill', '#6e7681')
      .text('Species');

    Array.from(selectedSpecies).forEach((sp, i) => {
      const row = legendG.append('g').attr('transform', `translate(0, ${i * 16})`);
      row.append('line')
        .attr('x1', 0).attr('x2', 16).attr('y1', 5).attr('y2', 5)
        .attr('stroke', SPECIES_COLOURS_TIMELINE[sp])
        .attr('stroke-width', 2);
      row.append('text')
        .attr('x', 20).attr('y', 9)
        .attr('font-size', '10px')
        .attr('fill', '#8b949e')
        .text(sp);
    });

    // Country dash legend
    const countryY = selectedSpecies.size * 16 + 16;
    legendG.append('text')
      .attr('y', countryY - 5)
      .attr('font-size', '10px')
      .attr('fill', '#6e7681')
      .text('Countries');

    activeCountries.forEach((code, i) => {
      const label = countries.find(c => c.code === code)?.entity ?? code;
      const row = legendG.append('g').attr('transform', `translate(0, ${countryY + i * 16})`);
      row.append('line')
        .attr('x1', 0).attr('x2', 16).attr('y1', 5).attr('y2', 5)
        .attr('stroke', '#8b949e')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', countryDash[code] || 'none');
      row.append('text')
        .attr('x', 20).attr('y', 9)
        .attr('font-size', '10px')
        .attr('fill', '#8b949e')
        .text(label.slice(0, 12));
    });

    // Hover bisector
    const bisect = d3.bisector<{ year: number; value: number }, number>(d => d.year).left;

    const hoverLine = g.append('line')
      .attr('stroke', '#6e7681')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,2')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('opacity', 0);

    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        hoverLine.attr('x1', xScale(year)).attr('x2', xScale(year)).attr('opacity', 1);

        const lines = seriesData.map(s => {
          const idx = bisect(s.data, year, 0, s.data.length - 1);
          return `${s.code} ${s.species}: ${s.data[idx]?.value != null ? (s.data[idx].value / 1e9).toFixed(2) + 'B SADs' : 'N/A'}`;
        });
        setTooltip({ x: event.clientX, y: event.clientY, text: `${year}\n${lines.join('\n')}` });
      })
      .on('mouseleave', () => {
        hoverLine.attr('opacity', 0);
        setTooltip(null);
      });

  }, [seriesData, dims, activeCountries, countries, selectedSpecies]);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-start gap-6 px-4 py-3 border-b border-[#21262d] flex-wrap">
        <div>
          <div className="text-xs text-[#8b949e] mb-1.5">Species</div>
          <div className="flex flex-wrap gap-1.5">
            {SPECIES_LIST.map(sp => (
              <button
                key={sp}
                onClick={() => {
                  setSelectedSpecies(prev => {
                    const next = new Set(prev);
                    if (next.has(sp)) next.delete(sp);
                    else next.add(sp);
                    return next;
                  });
                }}
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

        <div>
          <div className="text-xs text-[#8b949e] mb-1.5">Year range</div>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1961} max={yearRange[1]}
              value={yearRange[0]}
              onChange={e => setYearRange([Number(e.target.value), yearRange[1]])}
              className="w-16 bg-[#21262d] border border-[#30363d] rounded px-1.5 py-0.5 text-xs text-[#e6edf3] font-mono"
            />
            <span className="text-[#8b949e] text-xs">–</span>
            <input
              type="number" min={yearRange[0]} max={2023}
              value={yearRange[1]}
              onChange={e => setYearRange([yearRange[0], Number(e.target.value)])}
              className="w-16 bg-[#21262d] border border-[#30363d] rounded px-1.5 py-0.5 text-xs text-[#e6edf3] font-mono"
            />
          </div>
        </div>

        <div>
          <div className="text-xs text-[#8b949e] mb-1.5">Countries (select from sidebar)</div>
          <div className="flex flex-wrap gap-1">
            {activeCountries.map(code => {
              const label = countries.find(c => c.code === code)?.entity ?? code;
              return (
                <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] text-xs text-[#8b949e]">
                  {label}
                  <button onClick={() => toggleCountry(code)} className="hover:text-[#e6edf3]">✕</button>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[#8b949e] text-sm">
            Loading country data…
          </div>
        )}
        <svg ref={svgRef} width={dims.width} height={dims.height} className="block" />

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border border-[#30363d] bg-[#161b22] p-2.5 shadow-2xl text-xs font-mono"
            style={{ left: tooltip.x + 14, top: tooltip.y - 8 }}
          >
            {tooltip.text.split('\n').map((line, i) => (
              <div key={i} className={i === 0 ? 'text-[#e6edf3] font-semibold mb-1' : 'text-[#8b949e]'}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
