'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useCountryData, CountrySadsEntry } from '../hooks/useCountryData';
import { useDashboardStore } from '../store/dashboardStore';
import { formatSads } from './Tooltip';
import { COUNTRY_POP_M as COUNTRY_POP } from '../data/populations';

interface GeoFeature {
  type: string;
  // The datasets/geo-countries GeoJSON uses 'ISO3166-1-Alpha-3' for the ISO3 code
  properties: { name: string; 'ISO3166-1-Alpha-3': string };
  geometry: unknown;
}

export function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 900, height: 500 });
  const [countries110, setCountries110] = useState<{ features: GeoFeature[] } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: CountrySadsEntry | null }>({ x: 0, y: 0, entry: null });
  const { countryData, loading } = useCountryData();
  const { selectedYear, setSelectedYear, normalisation, setNormalisation, setSelectedCountry, selectedCountry, selectedCountries } = useDashboardStore();

  // Load local GeoJSON (served from /public/world.geojson)
  useEffect(() => {
    fetch('/world.geojson')
      .then(r => r.json())
      .then(setCountries110)
      .catch(console.error);
  }, []);

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

  const getDisplayValue = useCallback((entry: CountrySadsEntry): number => {
    if (normalisation === 'perCapita') {
      const pop = COUNTRY_POP[entry.code] ?? 5;
      return entry.totalSads / (pop * 1e6);
    }
    return entry.totalSads;
  }, [normalisation]);

  // Build year → country map
  const yearMap = React.useMemo(() => {
    const m = new Map<string, CountrySadsEntry>();
    for (const entry of countryData) {
      if (entry.year === selectedYear) {
        m.set(entry.code, entry);
      }
    }
    return m;
  }, [countryData, selectedYear]);

  const maxValue = React.useMemo(() => {
    let max = 0;
    for (const entry of yearMap.values()) {
      const v = getDisplayValue(entry);
      if (v > max) max = v;
    }
    return max;
  }, [yearMap, getDisplayValue]);

  useEffect(() => {
    if (!svgRef.current || !countries110 || dims.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dims;

    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.5)
      .translate([width / 2, height / 2.1]);

    const path = d3.geoPath().projection(projection);

    const colourScale = d3.scaleSequential()
      .domain([0, maxValue || 1])
      .interpolator(d3.interpolateRgb('#1c2128', '#8b2222'));

    const g = svg.append('g');

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Sphere background
    g.append('path')
      .datum({ type: 'Sphere' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('d', path as any)
      .attr('fill', '#0d1117');

    g.selectAll<SVGPathElement, GeoFeature>('path.country')
      .data(countries110.features)
      .join('path')
      .attr('class', 'country')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('d', path as any)
      .attr('fill', d => {
        const code = d.properties['ISO3166-1-Alpha-3'];
        const entry = yearMap.get(code);
        if (!entry) return '#21262d';
        const val = getDisplayValue(entry);
        return val > 0 ? colourScale(val) : '#21262d';
      })
      .attr('fill-opacity', d => {
        if (selectedCountries.size === 0) return 1;
        const code = d.properties['ISO3166-1-Alpha-3'];
        return selectedCountries.has(code) ? 1 : 0.25;
      })
      .attr('stroke', d => {
        const code = d.properties['ISO3166-1-Alpha-3'];
        if (selectedCountry === code) return '#e6edf3';
        if (selectedCountries.has(code)) return '#7c9e8f';
        return '#0d1117';
      })
      .attr('stroke-width', d => {
        const code = d.properties['ISO3166-1-Alpha-3'];
        if (selectedCountry === code) return 1.5;
        if (selectedCountries.has(code)) return 1.2;
        return 0.4;
      })
      .style('cursor', d => {
        const code = d.properties['ISO3166-1-Alpha-3'];
        return yearMap.has(code) ? 'pointer' : 'default';
      })
      .on('mousemove', (event, d) => {
        const code = d.properties['ISO3166-1-Alpha-3'];
        const entry = yearMap.get(code) ?? null;
        if (entry) setTooltip({ x: event.clientX, y: event.clientY, entry });
        else setTooltip(t => ({ ...t, entry: null }));
      })
      .on('mouseleave', () => setTooltip(t => ({ ...t, entry: null })))
      .on('click', (_, d) => {
        const code = d.properties['ISO3166-1-Alpha-3'];
        setSelectedCountry(selectedCountry === code ? null : code);
      });

  }, [countries110, dims, yearMap, maxValue, getDisplayValue, selectedCountry, setSelectedCountry, selectedCountries]);

  // Available years with data
  const availableYears = React.useMemo(() => {
    const ySet = new Set<number>();
    for (const e of countryData) ySet.add(e.year);
    const arr = Array.from(ySet).sort();
    return arr.length > 0 ? arr : [2023];
  }, [countryData]);

  const selectedEntry = selectedCountry ? yearMap.get(selectedCountry) : null;

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col">
      {/* Year slider */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#21262d] bg-[#0d1117]">
        <span className="text-xs text-[#8b949e]">Year:</span>
        <input
          type="range"
          min={availableYears[0]}
          max={availableYears[availableYears.length - 1]}
          step={1}
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="flex-1 h-1 appearance-none bg-[#30363d] rounded"
          style={{ accentColor: '#7c9e8f' }}
        />
        <span className="font-mono text-sm text-[#e6edf3] w-12 text-right">{selectedYear}</span>
        <div className="flex gap-1 ml-2">
          {([['raw', 'Total SADs'], ['perCapita', 'Per capita']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setNormalisation(v)}
              className={`px-2 py-0.5 rounded text-xs transition-colors border ${
                normalisation === v
                  ? 'bg-[#21262d] border-[#30363d] text-[#e6edf3]'
                  : 'border-transparent text-[#6e7681] hover:text-[#8b949e]'
              }`}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#8b949e]">{yearMap.size} countries with data</span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[#8b949e] text-sm z-10">
            Loading country data…
          </div>
        )}
        <svg ref={svgRef} width={dims.width} height={dims.height} className="block" />

        {/* Colour legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-[#8b949e]">
          <span>Low</span>
          <div className="w-24 h-2 rounded" style={{ background: 'linear-gradient(to right, #1c2128, #8b2222)' }} />
          <span>High</span>
          <span className="ml-3 text-[#6e7681]">Scroll to zoom · drag to pan · click country for detail</span>
        </div>

        {/* Country detail panel */}
        {selectedEntry && (
          <div className="absolute top-4 right-4 w-64 rounded-lg border border-[#30363d] bg-[#161b22] p-3 text-sm shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#e6edf3]">{selectedEntry.entity}</span>
              <button onClick={() => setSelectedCountry(null)} className="text-[#8b949e] hover:text-[#e6edf3] text-xs">✕</button>
            </div>
            <div className="text-xs text-[#8b949e] mb-2">{selectedYear}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Est. total SADs</span>
                <span className="text-[#e6edf3] font-mono">{formatSads(selectedEntry.totalSads)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Animals counted</span>
                <span className="text-[#e6edf3] font-mono">{(selectedEntry.totalAnimals / 1e6).toFixed(0)}M</span>
              </div>
              {Object.entries(selectedEntry.bySpecies)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([sp, sads]) => (
                  <div key={sp} className="flex justify-between">
                    <span className="text-[#6e7681] capitalize">{sp}</span>
                    <span className="text-[#8b949e] font-mono">{formatSads(sads)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {tooltip.entry && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-[#30363d] bg-[#161b22] p-2.5 shadow-2xl text-xs"
          style={{ left: tooltip.x + 14, top: tooltip.y - 8 }}
        >
          <div className="font-semibold text-[#e6edf3]">{tooltip.entry.entity}</div>
          <div className="text-[#8b949e] mt-0.5">
            Est. SADs: <span className="font-mono text-[#e6edf3]">{formatSads(tooltip.entry.totalSads)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
