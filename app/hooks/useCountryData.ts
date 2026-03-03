'use client';
import { useState, useEffect, useMemo } from 'react';
import { SAD_SCENARIOS } from '../data/sads-scenarios';

interface LandAnimalRow {
  entity: string;
  code: string;
  year: number;
  chickens: number | null;
  ducks: number | null;
  pigs: number | null;
  geese: number | null;
  sheep: number | null;
  rabbits: number | null;
  turkeys: number | null;
  goats: number | null;
  cattle: number | null;
  other: number | null;
}

interface FishRow {
  entity: string;
  code: string;
  year: number;
  estimate: number | null;
}

interface CrustaceanRow {
  entity: string;
  code: string;
  year: number;
  estimate: number | null;
}

export interface CountrySadsEntry {
  entity: string;
  code: string;
  year: number;
  totalSads: number;
  bySpecies: Record<string, number>;
  totalAnimals: number;
}

// SADs per animal baselines (avgSadsPerFarmingYear from baseline scenarios)
const SPECIES_SADS: Record<string, number> = {
  chickens: 13.3, // fast-growing broiler
  ducks:     4.0, // rough estimate
  pigs:      7.3, // sows HIC
  geese:     4.0,
  sheep:     2.0,
  rabbits:   3.0,
  turkeys:   4.0,
  goats:     2.0,
  cattle:    7.3, // beef cows
  other:     4.0,
  fish:      7.4, // farmed salmon
  crustaceans: 6.9, // semi-intensive shrimp
};

function useLoadJSON<T>(url: string): T[] {
  const [data, setData] = useState<T[]>([]);
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [url]);
  return data;
}

export function useCountryData() {
  const landData = useLoadJSON<LandAnimalRow>('/data/land_animals_by_country_year.json');
  const fishData = useLoadJSON<FishRow>('/data/farmed_fish_by_country_year.json');
  const crustaceanData = useLoadJSON<CrustaceanRow>('/data/farmed_crustaceans_by_country_year.json');

  const loading = landData.length === 0 && fishData.length === 0 && crustaceanData.length === 0;

  // Build per-country-per-year SAD estimates
  const countryData = useMemo((): CountrySadsEntry[] => {
    if (landData.length === 0) return [];

    const map = new Map<string, CountrySadsEntry>();

    const key = (code: string, year: number) => `${code}__${year}`;

    for (const row of landData) {
      const k = key(row.code, row.year);
      const existing = map.get(k) ?? {
        entity: row.entity,
        code: row.code,
        year: row.year,
        totalSads: 0,
        bySpecies: {},
        totalAnimals: 0,
      };

      const species: Array<keyof Omit<LandAnimalRow, 'entity' | 'code' | 'year'>> = [
        'chickens', 'ducks', 'pigs', 'geese', 'sheep',
        'rabbits', 'turkeys', 'goats', 'cattle', 'other',
      ];

      for (const sp of species) {
        const count = row[sp] ?? 0;
        if (count > 0) {
          const sadsPerAnimal = SPECIES_SADS[sp as string] ?? 4;
          const sads = count * sadsPerAnimal;
          existing.bySpecies[sp as string] = (existing.bySpecies[sp as string] ?? 0) + sads;
          existing.totalSads += sads;
          existing.totalAnimals += count;
        }
      }

      map.set(k, existing);
    }

    for (const row of fishData) {
      const k = key(row.code, row.year);
      const existing = map.get(k) ?? {
        entity: row.entity,
        code: row.code,
        year: row.year,
        totalSads: 0,
        bySpecies: {},
        totalAnimals: 0,
      };
      const count = row.estimate ?? 0;
      if (count > 0) {
        const sads = count * SPECIES_SADS.fish;
        existing.bySpecies['fish'] = (existing.bySpecies['fish'] ?? 0) + sads;
        existing.totalSads += sads;
        existing.totalAnimals += count;
      }
      map.set(k, existing);
    }

    for (const row of crustaceanData) {
      const k = key(row.code, row.year);
      const existing = map.get(k) ?? {
        entity: row.entity,
        code: row.code,
        year: row.year,
        totalSads: 0,
        bySpecies: {},
        totalAnimals: 0,
      };
      const count = row.estimate ?? 0;
      if (count > 0) {
        const sads = count * SPECIES_SADS.crustaceans;
        existing.bySpecies['crustaceans'] = (existing.bySpecies['crustaceans'] ?? 0) + sads;
        existing.totalSads += sads;
        existing.totalAnimals += count;
      }
      map.set(k, existing);
    }

    return Array.from(map.values());
  }, [landData, fishData, crustaceanData]);

  // Get all unique countries
  const countries = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of countryData) {
      if (!seen.has(row.code)) seen.set(row.code, row.entity);
    }
    return Array.from(seen.entries())
      .map(([code, entity]) => ({ code, entity }))
      .sort((a, b) => a.entity.localeCompare(b.entity));
  }, [countryData]);

  // Get all available years
  const years = useMemo(() => {
    const ySet = new Set<number>();
    for (const row of countryData) ySet.add(row.year);
    return Array.from(ySet).sort();
  }, [countryData]);

  return { countryData, countries, years, loading };
}
