'use client';
import React from 'react';
import { PAIN_COLOURS, PainLevel } from '../data/sads-scenarios';

export function formatSads(value: number): string {
  if (value >= 1e15) return `${(value / 1e15).toFixed(2)} Quadrillion`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} Trillion`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Billion`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} Million`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

export function formatAnimals(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

interface TooltipProps {
  x: number;
  y: number;
  visible: boolean;
  data: {
    scenario?: string;
    animal?: string;
    avgSadsPerFarmingYear?: number | null;
    animalsSlaughteredPerYear?: number;
    totalSadBurden?: number;
    painLevel?: PainLevel;
    entity?: string;
    totalSads?: number;
    year?: number;
  } | null;
}

export function TooltipCard({ x, y, visible, data }: TooltipProps) {
  if (!visible || !data) return null;

  const isCountry = 'entity' in data && data.entity;

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-[#30363d] bg-[#161b22] p-3 shadow-2xl text-sm"
      style={{
        left: Math.min(x + 12, window.innerWidth - 260),
        top: Math.max(y - 8, 8),
        transition: 'opacity 150ms ease',
        opacity: visible ? 1 : 0,
      }}
    >
      {isCountry ? (
        <CountryTooltipContent data={data} />
      ) : (
        <ScenarioTooltipContent data={data} />
      )}
    </div>
  );
}

function ScenarioTooltipContent({ data }: { data: TooltipProps['data'] }) {
  if (!data) return null;
  return (
    <>
      <div className="font-semibold text-[#e6edf3] mb-1">{data.scenario}</div>
      <div className="text-[#8b949e] text-xs mb-2">{data.animal}</div>
      {data.painLevel && (
        <span
          className="inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white mb-2"
          style={{ backgroundColor: PAIN_COLOURS[data.painLevel] }}
        >
          {data.painLevel.charAt(0).toUpperCase() + data.painLevel.slice(1)} pain
        </span>
      )}
      <div className="space-y-1 text-xs">
        {data.avgSadsPerFarmingYear != null && (
          <div className="flex justify-between gap-4">
            <span className="text-[#8b949e]">SADs/animal</span>
            <span className="text-[#e6edf3] font-mono">{data.avgSadsPerFarmingYear.toFixed(1)}</span>
          </div>
        )}
        {data.animalsSlaughteredPerYear != null && (
          <div className="flex justify-between gap-4">
            <span className="text-[#8b949e]">Animals/yr</span>
            <span className="text-[#e6edf3] font-mono">{formatAnimals(data.animalsSlaughteredPerYear)}</span>
          </div>
        )}
        {data.totalSadBurden != null && (
          <div className="flex justify-between gap-4">
            <span className="text-[#8b949e]">Total burden</span>
            <span className="text-[#e6edf3] font-mono">{formatSads(data.totalSadBurden)}</span>
          </div>
        )}
      </div>
    </>
  );
}

function CountryTooltipContent({ data }: { data: TooltipProps['data'] }) {
  if (!data) return null;
  return (
    <>
      <div className="font-semibold text-[#e6edf3] mb-1">{data.entity}</div>
      {data.year && <div className="text-[#8b949e] text-xs mb-2">{data.year}</div>}
      <div className="space-y-1 text-xs">
        {data.totalSads != null && (
          <div className="flex justify-between gap-4">
            <span className="text-[#8b949e]">Est. total SADs</span>
            <span className="text-[#e6edf3] font-mono">{formatSads(data.totalSads)}</span>
          </div>
        )}
      </div>
    </>
  );
}
