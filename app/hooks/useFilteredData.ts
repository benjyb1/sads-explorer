import { useMemo } from 'react';
import { SAD_SCENARIOS, SadScenario, PAIN_SCORE, getDisplayAnimal } from '../data/sads-scenarios';
import { useDashboardStore } from '../store/dashboardStore';

export interface AggregatedSpecies {
  animal: string;
  totalSadBurden: number;
  avgSadsPerFarmingYear: number | null;
  animalsSlaughteredPerYear: number;
  painLevel: import('../data/sads-scenarios').PainLevel;
  scenarioCount: number;
  scenarios: SadScenario[];
}

export function useFilteredScenarios(): SadScenario[] {
  const { selectedAnimals, selectedPainLevels, includeSubScenarios } = useDashboardStore();

  return useMemo(() => {
    return SAD_SCENARIOS.filter((s) => {
      if (!includeSubScenarios && s.isSubScenario) return false;
      if (selectedPainLevels.size > 0 && !selectedPainLevels.has(s.painLevel)) return false;
      if (selectedAnimals.size > 0 && !selectedAnimals.has(s.animal)) return false;
      return true;
    });
  }, [selectedAnimals, selectedPainLevels, includeSubScenarios]);
}

export function useAggregatedBySpecies(): AggregatedSpecies[] {
  const filtered = useFilteredScenarios();

  return useMemo(() => {
    const map = new Map<string, SadScenario[]>();
    for (const s of filtered) {
      // Merge Layers / Broilers / Male chicks → 'Chickens' for display
      const key = getDisplayAnimal(s.animal);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }

    return Array.from(map.entries()).map(([animal, scenarios]) => {
      // `animal` is already the display key (e.g. 'Chickens' for all chicken sub-types)
      const totalBurden = scenarios.reduce((a, s) => a + s.totalSadBurden, 0);
      const totalAnimals = Math.max(...scenarios.map(s => s.animalsSlaughteredPerYear));
      const avgSads = scenarios.some(s => s.avgSadsPerFarmingYear !== null)
        ? scenarios.filter(s => s.avgSadsPerFarmingYear !== null)
            .reduce((a, s) => a + (s.avgSadsPerFarmingYear ?? 0), 0) /
          scenarios.filter(s => s.avgSadsPerFarmingYear !== null).length
        : null;

      // Dominant pain level = highest pain scenario
      const worstPain = scenarios.reduce((worst, s) => {
        return PAIN_SCORE[s.painLevel] > PAIN_SCORE[worst.painLevel] ? s : worst;
      });

      return {
        animal,
        totalSadBurden: totalBurden,
        avgSadsPerFarmingYear: avgSads,
        animalsSlaughteredPerYear: totalAnimals,
        painLevel: worstPain.painLevel,
        scenarioCount: scenarios.length,
        scenarios,
      };
    });
  }, [filtered]);
}

export function useTotalStats() {
  const filtered = useFilteredScenarios();

  return useMemo(() => {
    const totalBurden = filtered.reduce((a, s) => a + s.totalSadBurden, 0);
    const totalAnimals = filtered.reduce((a, s) => a + s.animalsSlaughteredPerYear, 0);
    const worst = filtered.reduce<SadScenario | null>((w, s) => {
      if (!w) return s;
      return PAIN_SCORE[s.painLevel] > PAIN_SCORE[w.painLevel] ? s : w;
    }, null);

    return { totalBurden, totalAnimals, worstScenario: worst, scenarioCount: filtered.length };
  }, [filtered]);
}
