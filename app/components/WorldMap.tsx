'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useCountryData, CountrySadsEntry } from '../hooks/useCountryData';
import { useDashboardStore } from '../store/dashboardStore';
import { formatSads } from './Tooltip';

// Approximate country populations for per-capita normalisation (millions)
const COUNTRY_POP: Record<string, number> = {
  CHN: 1412, IND: 1408, USA: 335, IDN: 277, PAK: 231, BRA: 214, NGA: 218,
  BGD: 170, RUS: 144, ETH: 123, MEX: 130, JPN: 125, PHL: 113, COD: 99,
  EGY: 105, VNM: 97, IRN: 86, TUR: 85, DEU: 84, THA: 70, GBR: 68, FRA: 67,
  TZA: 65, ZAF: 60, MMR: 54, KEN: 55, ARG: 46, UKR: 41, DZA: 45, IRQ: 42,
  SDN: 45, UGA: 48, ITA: 60, POL: 38, CAN: 38, MAR: 37, MOZ: 33, AGO: 35,
  PER: 33, AFG: 40, SAU: 35, MYS: 33, GHA: 32, XKX: 2, AUS: 26, ESP: 47,
  KOR: 52, CMR: 27, NPL: 30, VEN: 28, MDG: 27, CIV: 27, ROU: 19, NLD: 17,
  CHL: 19, COL: 51, TCD: 17, ZMB: 19, SOM: 17, MWI: 19, ZWE: 15, BEL: 11,
  SEN: 17, GTM: 17, KAZ: 19, BLR: 9, HUN: 10, SWE: 10, CUB: 11, HND: 10,
  AUT: 9, PRT: 10, DNK: 6, FIN: 5, NOR: 5, CHE: 9, ISR: 9, SYR: 21,
  TUN: 12, BOL: 12, PRY: 7, LAO: 7, URY: 3, PAN: 4, CRI: 5, ARE: 10,
  NZL: 5, BWA: 3, NAM: 3, MRT: 4, MLI: 22, BFA: 22, NER: 25, GIN: 13,
  BEN: 13, TGO: 8, SLE: 8, LBR: 5, GMB: 3, GNB: 2, CPV: 1,
};

interface GeoFeature {
  type: string;
  properties: { name: string; iso_a3: string };
  geometry: unknown;
}

export function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 900, height: 500 });
  const [geoData, setGeoData] = useState<unknown>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: CountrySadsEntry | null }>({ x: 0, y: 0, entry: null });
  const { countryData, loading } = useCountryData();
  const { selectedYear, setSelectedYear, normalisation, setSelectedCountry, selectedCountry } = useDashboardStore();

  // Load world geo JSON
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(setGeoData)
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
    if (!svgRef.current || !geoData || dims.width === 0 || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dims;

    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.3)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const topoData = geoData as { objects: { countries: unknown } };

    // We need topojson — use the CDN-loaded topology directly with d3-geo
    // Instead, fetch GeoJSON directly
    // Actually we fetched countries-110m which is topojson. We need to convert.
    // Let's use a simpler approach with d3-geo-projection and topojson-client

    const colourScale = d3.scaleSequential()
      .domain([0, maxValue || 1])
      .interpolator(d3.interpolateRgb('#1c2128', '#da3633'));

    // Since topojson isn't installed, load a geojson alternative
    return;
  }, [geoData, dims, yearMap, maxValue, loading, getDisplayValue, selectedCountry]);

  // Simplified SVG map using direct GeoJSON
  const [countries110, setCountries110] = useState<{ features: GeoFeature[] } | null>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(r => r.json())
      .then(setCountries110)
      .catch(console.error);
  }, []);

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
        const code = d.properties.iso_a3;
        const entry = yearMap.get(code);
        if (!entry) return '#21262d';
        return colourScale(getDisplayValue(entry));
      })
      .attr('stroke', '#0d1117')
      .attr('stroke-width', 0.4)
      .style('cursor', d => yearMap.has(d.properties.iso_a3) ? 'pointer' : 'default')
      .on('mousemove', (event, d) => {
        const code = d.properties.iso_a3;
        const entry = yearMap.get(code) ?? null;
        if (entry) setTooltip({ x: event.clientX, y: event.clientY, entry });
        else setTooltip(t => ({ ...t, entry: null }));
      })
      .on('mouseleave', () => setTooltip(t => ({ ...t, entry: null })))
      .on('click', (_, d) => {
        const code = d.properties.iso_a3;
        setSelectedCountry(selectedCountry === code ? null : code);
      });

  }, [countries110, dims, yearMap, maxValue, getDisplayValue, selectedCountry, setSelectedCountry]);

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
        <span className="text-xs text-[#8b949e] ml-2">
          {normalisation === 'perCapita' ? 'SADs per capita' : 'Total SADs'}
        </span>
      </div>

      <div className="flex-1 relative">
        <svg ref={svgRef} width={dims.width} height={dims.height} className="block" />

        {/* Colour legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-[#8b949e]">
          <span>Low</span>
          <div
            className="w-24 h-2 rounded"
            style={{
              background: 'linear-gradient(to right, #1c2128, #8b2222)',
            }}
          />
          <span>High</span>
          <span className="ml-2 text-[#6e7681]">(scroll to zoom, drag to pan)</span>
        </div>

        {/* Country detail panel */}
        {selectedEntry && (
          <div className="absolute top-4 right-4 w-64 rounded-lg border border-[#30363d] bg-[#161b22] p-3 text-sm shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#e6edf3]">{selectedEntry.entity}</span>
              <button
                onClick={() => setSelectedCountry(null)}
                className="text-[#8b949e] hover:text-[#e6edf3] text-xs"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[#8b949e] mb-2">{selectedYear}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Est. total SADs</span>
                <span className="text-[#e6edf3] font-mono">{formatSads(selectedEntry.totalSads)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Animals counted</span>
                <span className="text-[#e6edf3] font-mono">
                  {(selectedEntry.totalAnimals / 1e6).toFixed(0)}M
                </span>
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
          <div className="text-[#8b949e] mt-0.5">Est. SADs: <span className="font-mono text-[#e6edf3]">{formatSads(tooltip.entry.totalSads)}</span></div>
        </div>
      )}
    </div>
  );
}
