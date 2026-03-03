'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useFilteredScenarios, useAggregatedBySpecies } from '../hooks/useFilteredData';
import { SPECIES_COLOURS, PAIN_COLOURS, SadScenario } from '../data/sads-scenarios';
import { useDashboardStore } from '../store/dashboardStore';
import { formatSads, formatAnimals } from './Tooltip';

interface TreemapNode {
  name: string;
  value: number;
  scenario?: SadScenario;
  isGroup?: boolean;
  animal?: string;
  children?: TreemapNode[];
}

interface TooltipState {
  x: number;
  y: number;
  d: {
    name: string;
    value: number;
    scenario?: SadScenario;
    animal?: string;
  } | null;
}

export function Treemap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 900, height: 600 });
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, d: null });
  const scenarios = useFilteredScenarios();
  const aggregated = useAggregatedBySpecies();
  const { treemapDrillAnimal, setTreemapDrillAnimal, aggregation, pinScenario, metric } = useDashboardStore();

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0].contentRect;
      setDims({ width: e.width, height: e.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getValue = useCallback((s: SadScenario) => {
    if (metric === 'avgSadsPerFarmingYear') return s.avgSadsPerFarmingYear ?? 0;
    if (metric === 'animalsSlaughteredPerYear') return s.animalsSlaughteredPerYear;
    return s.totalSadBurden;
  }, [metric]);

  useEffect(() => {
    if (!svgRef.current || dims.width === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dims;

    // Build hierarchy data
    let hierarchyData: TreemapNode;

    if (treemapDrillAnimal) {
      // Drill-down: show all scenarios for this animal
      const drillScenarios = scenarios.filter(s => s.animal === treemapDrillAnimal);
      hierarchyData = {
        name: treemapDrillAnimal,
        value: 0,
        children: drillScenarios.map(s => ({
          name: s.scenario,
          value: getValue(s),
          scenario: s,
        })),
      };
    } else if (aggregation === 'species') {
      hierarchyData = {
        name: 'SADs',
        value: 0,
        children: aggregated.map(a => ({
          name: a.animal,
          value: metric === 'avgSadsPerFarmingYear'
            ? (a.avgSadsPerFarmingYear ?? 0)
            : metric === 'animalsSlaughteredPerYear'
              ? a.animalsSlaughteredPerYear
              : a.totalSadBurden,
          animal: a.animal,
          isGroup: true,
        })),
      };
    } else {
      // All scenarios grouped by species
      const byAnimal = new Map<string, SadScenario[]>();
      for (const s of scenarios) {
        const list = byAnimal.get(s.animal) ?? [];
        list.push(s);
        byAnimal.set(s.animal, list);
      }
      hierarchyData = {
        name: 'SADs',
        value: 0,
        children: Array.from(byAnimal.entries()).map(([animal, scs]) => ({
          name: animal,
          value: 0,
          isGroup: true,
          children: scs.map(s => ({
            name: s.scenario,
            value: getValue(s),
            scenario: s,
            animal,
          })),
        })),
      };
    }

    const root = d3.hierarchy(hierarchyData)
      .sum(d => Math.max(0, d.value))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const layoutRoot = d3.treemap<TreemapNode>()
      .size([width, height])
      .paddingOuter(3)
      .paddingInner(2)
      .paddingTop(treemapDrillAnimal || aggregation === 'species' ? 0 : 20)
      .round(true)
      (root) as d3.HierarchyRectangularNode<TreemapNode>;

    const cell = svg.selectAll<SVGGElement, d3.HierarchyRectangularNode<TreemapNode>>('g.cell')
      .data(layoutRoot.leaves())
      .join('g')
      .attr('class', 'cell')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer');

    cell.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('rx', 3)
      .attr('fill', d => {
        const animal = d.data.animal ?? d.data.scenario?.animal ?? d.data.name;
        return SPECIES_COLOURS[animal] ?? '#4a5568';
      })
      .attr('fill-opacity', d => {
        const pain = d.data.scenario?.painLevel;
        if (!pain) return 0.7;
        const scores: Record<string, number> = { extreme: 1, severe: 0.82, moderate: 0.65, mild: 0.5 };
        return scores[pain] ?? 0.7;
      })
      .attr('stroke', '#0d1117')
      .attr('stroke-width', 1);

    // Pain level indicator strip (top 3px)
    cell.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', 3)
      .attr('rx', 3)
      .attr('fill', d => {
        const pain = d.data.scenario?.painLevel;
        return pain ? PAIN_COLOURS[pain] : 'transparent';
      })
      .attr('fill-opacity', 0.9);

    // Labels
    cell.append('text')
      .attr('x', 5)
      .attr('y', 16)
      .attr('font-size', d => {
        const w = d.x1 - d.x0;
        if (w > 180) return '11px';
        if (w > 80) return '10px';
        return '9px';
      })
      .attr('fill', '#e6edf3')
      .attr('font-family', 'DM Sans, sans-serif')
      .attr('font-weight', '500')
      .text(d => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 30 || h < 16) return '';
        const name = d.data.name;
        if (w < 80) return name.slice(0, 8);
        if (w < 140) return name.slice(0, 16);
        return name;
      })
      .each(function(d) {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 60 || h < 32) return;
        d3.select(this.parentNode as SVGGElement)
          .append('text')
          .attr('x', 5)
          .attr('y', 28)
          .attr('font-size', '9px')
          .attr('fill', '#8b949e')
          .attr('font-family', 'DM Mono, monospace')
          .text(formatSads(d.value ?? 0));
      });

    // Group header labels (for non-drill mode with groups)
    if (!treemapDrillAnimal && aggregation !== 'species') {
      svg.selectAll<SVGGElement, d3.HierarchyRectangularNode<TreemapNode>>('g.group')
        .data(layoutRoot.descendants().filter(d => d.depth === 1))
        .join('g')
        .attr('class', 'group')
        .attr('transform', d => `translate(${d.x0},${d.y0})`)
        .append('text')
        .attr('x', 5)
        .attr('y', 13)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', '#8b949e')
        .attr('font-family', 'DM Sans, sans-serif')
        .text(d => {
          const w = d.x1 - d.x0;
          return w > 60 ? d.data.name : '';
        });
    }

    // Events
    cell
      .on('mousemove', (event, d) => {
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          d: {
            name: d.data.name,
            value: d.value ?? 0,
            scenario: d.data.scenario,
            animal: d.data.animal ?? d.data.scenario?.animal,
          },
        });
      })
      .on('mouseleave', () => setTooltip(t => ({ ...t, d: null })))
      .on('click', (_, d) => {
        if (d.data.isGroup || (!d.data.scenario && aggregation === 'species')) {
          setTreemapDrillAnimal(d.data.name);
        } else if (d.data.scenario) {
          const s = d.data.scenario;
          pinScenario({
            animal: s.animal,
            scenario: s.scenario,
            totalSadBurden: s.totalSadBurden,
            avgSadsPerFarmingYear: s.avgSadsPerFarmingYear,
            animalsSlaughteredPerYear: s.animalsSlaughteredPerYear,
            painLevel: s.painLevel,
          });
        }
      });

  }, [scenarios, aggregated, dims, treemapDrillAnimal, aggregation, getValue, setTreemapDrillAnimal, pinScenario]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {treemapDrillAnimal && (
        <button
          onClick={() => setTreemapDrillAnimal(null)}
          className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded border border-[#30363d] bg-[#161b22] px-2.5 py-1 text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#6e7681] transition-colors"
        >
          ← Back to all species
        </button>
      )}

      <svg
        ref={svgRef}
        width={dims.width}
        height={dims.height}
        className="block"
        style={{ transition: 'all 300ms ease' }}
      />

      {tooltip.d && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-[#30363d] bg-[#161b22] p-3 shadow-2xl text-sm"
          style={{ left: Math.min(tooltip.x + 14, window.innerWidth - 260), top: Math.max(tooltip.y - 8, 8) }}
        >
          <div className="font-semibold text-[#e6edf3] mb-1">{tooltip.d.name}</div>
          {tooltip.d.animal && <div className="text-[#8b949e] text-xs mb-2">{tooltip.d.animal}</div>}
          {tooltip.d.scenario?.painLevel && (
            <span
              className="inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white mb-2"
              style={{ backgroundColor: PAIN_COLOURS[tooltip.d.scenario.painLevel] }}
            >
              {tooltip.d.scenario.painLevel.charAt(0).toUpperCase() + tooltip.d.scenario.painLevel.slice(1)} pain
            </span>
          )}
          <div className="space-y-1 text-xs">
            {tooltip.d.scenario?.avgSadsPerFarmingYear != null && (
              <div className="flex justify-between gap-4">
                <span className="text-[#8b949e]">SADs/animal</span>
                <span className="text-[#e6edf3] font-mono">{tooltip.d.scenario.avgSadsPerFarmingYear.toFixed(1)}</span>
              </div>
            )}
            {tooltip.d.scenario?.animalsSlaughteredPerYear != null && (
              <div className="flex justify-between gap-4">
                <span className="text-[#8b949e]">Animals/yr</span>
                <span className="text-[#e6edf3] font-mono">{formatAnimals(tooltip.d.scenario.animalsSlaughteredPerYear)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-[#8b949e]">Total burden</span>
              <span className="text-[#e6edf3] font-mono">{formatSads(tooltip.d.value)}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-[#6e7681]">Click to pin for comparison</div>
        </div>
      )}
    </div>
  );
}
