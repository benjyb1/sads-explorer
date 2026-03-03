'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useFilteredScenarios } from '../hooks/useFilteredData';
import { PAIN_COLOURS, SPECIES_COLOURS, SadScenario } from '../data/sads-scenarios';
import { useDashboardStore } from '../store/dashboardStore';
import { formatSads, formatAnimals } from './Tooltip';

export function BubbleChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; s: SadScenario | null }>({ x: 0, y: 0, s: null });
  const scenarios = useFilteredScenarios();
  const { pinScenario } = useDashboardStore();

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

  useEffect(() => {
    if (!svgRef.current || dims.width === 0 || scenarios.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const width = dims.width - margin.left - margin.right;
    const height = dims.height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const validScenarios = scenarios.filter(s => s.animalsSlaughteredPerYear > 0 && s.totalSadBurden > 0);

    const xScale = d3.scaleLog()
      .domain([
        d3.min(validScenarios, s => s.animalsSlaughteredPerYear) ?? 1e8,
        d3.max(validScenarios, s => s.animalsSlaughteredPerYear) ?? 1e12,
      ])
      .range([0, width])
      .nice();

    const yMax = d3.max(validScenarios, s => s.avgSadsPerFarmingYear ?? 0) ?? 20;
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([height, 0])
      .nice();

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(validScenarios, s => s.totalSadBurden) ?? 1])
      .range([4, 42]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(6)
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#21262d')
      .attr('stroke-dasharray', '3,3');

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .ticks(6)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#21262d')
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(6, '.0s'));
    xAxis.selectAll('text').attr('fill', '#8b949e').attr('font-size', '10px').attr('font-family', 'DM Mono, monospace');
    xAxis.selectAll('line, path').attr('stroke', '#30363d');

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).ticks(6));
    yAxis.selectAll('text').attr('fill', '#8b949e').attr('font-size', '10px').attr('font-family', 'DM Mono, monospace');
    yAxis.selectAll('line, path').attr('stroke', '#30363d');

    // Axis labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .attr('font-family', 'DM Sans, sans-serif')
      .text('Animals Slaughtered per Year (log scale)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e')
      .attr('font-size', '11px')
      .attr('font-family', 'DM Sans, sans-serif')
      .text('SADs per Animal');

    // Bubbles
    const bubble = g.selectAll<SVGGElement, SadScenario>('g.bubble')
      .data(validScenarios.filter(s => s.avgSadsPerFarmingYear !== null), d => d.scenario)
      .join('g')
      .attr('class', 'bubble')
      .attr('transform', d => `translate(${xScale(d.animalsSlaughteredPerYear)},${yScale(d.avgSadsPerFarmingYear ?? 0)})`)
      .style('cursor', 'pointer');

    bubble.append('circle')
      .attr('r', d => sizeScale(d.totalSadBurden))
      .attr('fill', d => SPECIES_COLOURS[d.animal] ?? '#4a5568')
      .attr('fill-opacity', 0.65)
      .attr('stroke', d => PAIN_COLOURS[d.painLevel])
      .attr('stroke-width', 1.5);

    bubble.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => {
        const r = sizeScale(d.totalSadBurden);
        return r > 20 ? '9px' : '0px';
      })
      .attr('fill', '#e6edf3')
      .attr('pointer-events', 'none')
      .attr('font-family', 'DM Sans, sans-serif')
      .text(d => {
        const r = sizeScale(d.totalSadBurden);
        if (r < 20) return '';
        const name = d.animal;
        return name.length > 10 ? name.slice(0, 9) + '…' : name;
      });

    bubble
      .on('mousemove', (event, d) => setTooltip({ x: event.clientX, y: event.clientY, s: d }))
      .on('mouseleave', () => setTooltip(t => ({ ...t, s: null })))
      .on('click', (_, d) => pinScenario({
        animal: d.animal,
        scenario: d.scenario,
        totalSadBurden: d.totalSadBurden,
        avgSadsPerFarmingYear: d.avgSadsPerFarmingYear,
        animalsSlaughteredPerYear: d.animalsSlaughteredPerYear,
        painLevel: d.painLevel,
      }));

  }, [scenarios, dims, pinScenario]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} width={dims.width} height={dims.height} className="block" />

      {tooltip.s && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-[#30363d] bg-[#161b22] p-3 shadow-2xl text-sm"
          style={{ left: Math.min(tooltip.x + 14, window.innerWidth - 260), top: Math.max(tooltip.y - 8, 8) }}
        >
          <div className="font-semibold text-[#e6edf3] mb-1">{tooltip.s.scenario}</div>
          <div className="text-[#8b949e] text-xs mb-2">{tooltip.s.animal}</div>
          <span
            className="inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white mb-2"
            style={{ backgroundColor: PAIN_COLOURS[tooltip.s.painLevel] }}
          >
            {tooltip.s.painLevel}
          </span>
          <div className="space-y-1 text-xs mt-1">
            {tooltip.s.avgSadsPerFarmingYear != null && (
              <div className="flex justify-between gap-4">
                <span className="text-[#8b949e]">SADs/animal</span>
                <span className="text-[#e6edf3] font-mono">{tooltip.s.avgSadsPerFarmingYear.toFixed(1)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-[#8b949e]">Animals/yr</span>
              <span className="text-[#e6edf3] font-mono">{formatAnimals(tooltip.s.animalsSlaughteredPerYear)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#8b949e]">Total burden</span>
              <span className="text-[#e6edf3] font-mono">{formatSads(tooltip.s.totalSadBurden)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Size legend */}
      <div className="absolute bottom-12 right-6 text-xs text-[#8b949e] space-y-1">
        <div className="text-xs text-[#6e7681] mb-1">Bubble size = Total SAD burden</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8b949e] opacity-60" />
          <span>Small = lower burden</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#8b949e] opacity-60" />
          <span>Large = higher burden</span>
        </div>
        <div className="mt-2 text-[#6e7681]">Border colour = pain level</div>
      </div>
    </div>
  );
}
