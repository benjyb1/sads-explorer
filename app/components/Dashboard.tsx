'use client';
import React, { Suspense, useEffect } from 'react';
import { useDashboardStore, ViewType } from '../store/dashboardStore';
import { Sidebar } from './Sidebar';
import { StatsBar } from './StatsBar';
import { Treemap } from './Treemap';
import { BarChart } from './BarChart';
import { BubbleChart } from './BubbleChart';
import { WorldMap } from './WorldMap';
import { TimelineChart } from './TimelineChart';
import { DataTable } from './DataTable';
import { ComparisonPanel } from './ComparisonPanel';

// Views available in lite (time-pressured) mode
export const LITE_VIEWS: ViewType[] = ['treemap', 'map', 'timeline'];

function Loading() {
  return (
    <div className="flex items-center justify-center h-full text-[#8b949e] text-sm">
      Loading…
    </div>
  );
}

function ViewContent({ lite }: { lite: boolean }) {
  const { activeView, setActiveView, pinnedScenarios } = useDashboardStore();

  // If we're in lite mode and the active view isn't available, fall back to treemap
  useEffect(() => {
    if (lite && !LITE_VIEWS.includes(activeView)) {
      setActiveView('treemap');
    }
  }, [lite, activeView, setActiveView]);

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
      {!lite && (
        <>
          <div className="w-full h-full" style={{ display: activeView === 'bar' ? 'block' : 'none' }}>
            <BarChart />
          </div>
          <div className="w-full h-full" style={{ display: activeView === 'bubble' ? 'block' : 'none' }}>
            <BubbleChart />
          </div>
        </>
      )}
      <div className="w-full h-full" style={{ display: activeView === 'map' ? 'block' : 'none' }}>
        <Suspense fallback={<Loading />}>
          <WorldMap />
        </Suspense>
      </div>
      <div className="w-full h-full" style={{ display: activeView === 'timeline' ? 'block' : 'none' }}>
        <TimelineChart />
      </div>
      {!lite && (
        <div className="w-full h-full overflow-auto" style={{ display: activeView === 'table' ? 'block' : 'none' }}>
          <DataTable />
        </div>
      )}
    </div>
  );
}

export function Dashboard({ lite = false }: { lite?: boolean }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117]">
      <Sidebar lite={lite} />

      <div className="flex flex-col flex-1 ml-[280px] h-screen overflow-hidden">
        <StatsBar />
        <ViewContent lite={lite} />
      </div>

      <ComparisonPanel />
    </div>
  );
}
