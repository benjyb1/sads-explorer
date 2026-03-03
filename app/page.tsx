'use client';
import React, { Suspense } from 'react';
import { useDashboardStore } from './store/dashboardStore';
import { Sidebar } from './components/Sidebar';
import { StatsBar } from './components/StatsBar';
import { Treemap } from './components/Treemap';
import { BarChart } from './components/BarChart';
import { BubbleChart } from './components/BubbleChart';
import { WorldMap } from './components/WorldMap';
import { TimelineChart } from './components/TimelineChart';
import { DataTable } from './components/DataTable';
import { ComparisonPanel } from './components/ComparisonPanel';

function ViewContent() {
  const { activeView, pinnedScenarios } = useDashboardStore();
  const hasPinned = pinnedScenarios.length > 0;
  const bottomPad = hasPinned ? 'pb-[200px]' : 'pb-0';

  return (
    <div
      className={`flex-1 overflow-hidden ${bottomPad}`}
      style={{ transition: 'padding-bottom 300ms ease' }}
    >
      <div className="w-full h-full" style={{ display: activeView === 'treemap' ? 'block' : 'none' }}>
        <Treemap />
      </div>
      <div className="w-full h-full" style={{ display: activeView === 'bar' ? 'block' : 'none' }}>
        <BarChart />
      </div>
      <div className="w-full h-full" style={{ display: activeView === 'bubble' ? 'block' : 'none' }}>
        <BubbleChart />
      </div>
      <div className="w-full h-full" style={{ display: activeView === 'map' ? 'block' : 'none' }}>
        <Suspense fallback={<Loading />}>
          <WorldMap />
        </Suspense>
      </div>
      <div className="w-full h-full" style={{ display: activeView === 'timeline' ? 'block' : 'none' }}>
        <TimelineChart />
      </div>
      <div className="w-full h-full overflow-auto" style={{ display: activeView === 'table' ? 'block' : 'none' }}>
        <DataTable />
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-full text-[#8b949e] text-sm">
      Loading…
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117]">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 ml-[280px] h-screen overflow-hidden">
        <StatsBar />
        <ViewContent />
      </div>

      <ComparisonPanel />
    </div>
  );
}
