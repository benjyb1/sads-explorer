import { create } from 'zustand';
import type { PainLevel } from '../data/sads-scenarios';

export type ViewType = 'treemap' | 'bar' | 'bubble' | 'map' | 'timeline' | 'table';
export type MetricType = 'totalSadBurden' | 'avgSadsPerFarmingYear' | 'animalsSlaughteredPerYear';
export type AggregationType = 'scenarios' | 'species';
export type NormalisationType = 'raw' | 'per1000' | 'perCapita';

export interface PinnedScenario {
  animal: string;
  scenario: string;
  totalSadBurden: number;
  avgSadsPerFarmingYear: number | null;
  animalsSlaughteredPerYear: number;
  painLevel: PainLevel;
}

interface DashboardState {
  // View
  activeView: ViewType;
  setActiveView: (v: ViewType) => void;

  // Metric
  metric: MetricType;
  setMetric: (m: MetricType) => void;

  // Animal filter
  selectedAnimals: Set<string>;
  setSelectedAnimals: (s: Set<string>) => void;
  toggleAnimal: (a: string) => void;

  // Pain level filter
  selectedPainLevels: Set<PainLevel>;
  togglePainLevel: (p: PainLevel) => void;

  // Sub-scenarios
  includeSubScenarios: boolean;
  setIncludeSubScenarios: (v: boolean) => void;

  // Aggregation
  aggregation: AggregationType;
  setAggregation: (a: AggregationType) => void;

  // Normalisation
  normalisation: NormalisationType;
  setNormalisation: (n: NormalisationType) => void;

  // Country filter (map/timeline)
  selectedCountries: Set<string>;
  toggleCountry: (c: string) => void;
  setSelectedCountries: (s: Set<string>) => void;

  // Year range (timeline)
  yearRange: [number, number];
  setYearRange: (r: [number, number]) => void;

  // Selected year (map)
  selectedYear: number;
  setSelectedYear: (y: number) => void;

  // What-If panel open
  whatIfOpen: boolean;
  setWhatIfOpen: (v: boolean) => void;

  // Comparison panel pinned scenarios
  pinnedScenarios: PinnedScenario[];
  pinScenario: (s: PinnedScenario) => void;
  unpinScenario: (scenario: string) => void;

  // Tooltip state
  tooltipData: unknown;
  setTooltipData: (d: unknown) => void;

  // Treemap drill-down
  treemapDrillAnimal: string | null;
  setTreemapDrillAnimal: (a: string | null) => void;

  // Selected country (map click)
  selectedCountry: string | null;
  setSelectedCountry: (c: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeView: 'treemap',
  setActiveView: (v) => set({ activeView: v }),

  metric: 'totalSadBurden',
  setMetric: (m) => set({ metric: m }),

  selectedAnimals: new Set(), // empty = all selected
  setSelectedAnimals: (s) => set({ selectedAnimals: s }),
  toggleAnimal: (a) =>
    set((state) => {
      const next = new Set(state.selectedAnimals);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return { selectedAnimals: next };
    }),

  selectedPainLevels: new Set<PainLevel>(['extreme', 'severe', 'moderate', 'mild']),
  togglePainLevel: (p) =>
    set((state) => {
      const next = new Set(state.selectedPainLevels);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return { selectedPainLevels: next };
    }),

  includeSubScenarios: false,
  setIncludeSubScenarios: (v) => set({ includeSubScenarios: v }),

  aggregation: 'scenarios',
  setAggregation: (a) => set({ aggregation: a }),

  normalisation: 'raw',
  setNormalisation: (n) => set({ normalisation: n }),

  selectedCountries: new Set(),
  toggleCountry: (c) =>
    set((state) => {
      const next = new Set(state.selectedCountries);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { selectedCountries: next };
    }),
  setSelectedCountries: (s) => set({ selectedCountries: s }),

  yearRange: [1961, 2023],
  setYearRange: (r) => set({ yearRange: r }),

  selectedYear: 2023,
  setSelectedYear: (y) => set({ selectedYear: y }),

  whatIfOpen: false,
  setWhatIfOpen: (v) => set({ whatIfOpen: v }),

  pinnedScenarios: [],
  pinScenario: (s) =>
    set((state) => {
      if (state.pinnedScenarios.find((p) => p.scenario === s.scenario)) return state;
      if (state.pinnedScenarios.length >= 3) return state;
      return { pinnedScenarios: [...state.pinnedScenarios, s] };
    }),
  unpinScenario: (scenario) =>
    set((state) => ({
      pinnedScenarios: state.pinnedScenarios.filter((p) => p.scenario !== scenario),
    })),

  tooltipData: null,
  setTooltipData: (d) => set({ tooltipData: d }),

  treemapDrillAnimal: null,
  setTreemapDrillAnimal: (a) => set({ treemapDrillAnimal: a }),

  selectedCountry: null,
  setSelectedCountry: (c) => set({ selectedCountry: c }),
}));
