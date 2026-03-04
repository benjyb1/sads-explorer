export type PainLevel = 'extreme' | 'severe' | 'moderate' | 'mild';

export interface SadScenario {
  animal: string;
  scenario: string;
  avgSadsPerFarmingYear: number | null;
  animalsSlaughteredPerYear: number;
  totalSadBurden: number;
  painLevel: PainLevel;
  isSubScenario: boolean; // true = already counted in parent, exclude from default aggregates
}

export const SAD_SCENARIOS: SadScenario[] = [
  { animal: 'Layers',       scenario: 'Battery caged hen',                           avgSadsPerFarmingYear: 8.3,  animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 1.15e11, painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Layers',       scenario: 'Furnished cage hen',                          avgSadsPerFarmingYear: 5.2,  animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 7.24e10, painLevel: 'severe',   isSubScenario: false },
  { animal: 'Layers',       scenario: 'Aviary hen (cage-free)',                      avgSadsPerFarmingYear: 3.4,  animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 4.63e10, painLevel: 'moderate', isSubScenario: false },
  { animal: 'Male Chicks',  scenario: 'Male chick culling',                          avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 25_000_000_000,  totalSadBurden: 5.02e8,  painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Broilers',     scenario: 'Fast growing breed (HIC)',                    avgSadsPerFarmingYear: 13.3, animalsSlaughteredPerYear: 25_000_000_000,  totalSadBurden: 3.83e10, painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Broilers',     scenario: 'Slow growing breed (HIC)',                    avgSadsPerFarmingYear: 6.4,  animalsSlaughteredPerYear: 25_000_000_000,  totalSadBurden: 2.45e10, painLevel: 'severe',   isSubScenario: false },
  { animal: 'Broilers',     scenario: 'Electric waterbath stunning',                 avgSadsPerFarmingYear: 0.02, animalsSlaughteredPerYear: 25_000_000_000,  totalSadBurden: 5.37e7,  painLevel: 'mild',     isSubScenario: true  },
  { animal: 'Broilers',     scenario: 'Controlled atmosphere stunning (CO2)',        avgSadsPerFarmingYear: 0.02, animalsSlaughteredPerYear: 25_000_000_000,  totalSadBurden: 1.54e7,  painLevel: 'mild',     isSubScenario: true  },
  { animal: 'Pigs',         scenario: 'Sows (HIC)',                                  avgSadsPerFarmingYear: 7.3,  animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 1.28e11, painLevel: 'severe',   isSubScenario: false },
  { animal: 'Pigs',         scenario: 'Sows (crate free)',                           avgSadsPerFarmingYear: 5.8,  animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 1.01e11, painLevel: 'moderate', isSubScenario: false },
  { animal: 'Pigs',         scenario: 'Piglets (HIC)',                               avgSadsPerFarmingYear: 18.0, animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 8.96e10, painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Pigs',         scenario: 'Piglets (mutilations banned)',                avgSadsPerFarmingYear: 9.7,  animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 4.82e10, painLevel: 'severe',   isSubScenario: false },
  { animal: 'Pigs',         scenario: 'Sow hunger',                                  avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 1_000_000_000,   totalSadBurden: 1.93e9,  painLevel: 'moderate', isSubScenario: true  },
  { animal: 'Pigs',         scenario: 'Sow boredom',                                 avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 1_000_000_000,   totalSadBurden: 2.84e9,  painLevel: 'moderate', isSubScenario: true  },
  { animal: 'Salmon',       scenario: 'Farmed salmon (HIC)',                         avgSadsPerFarmingYear: 7.4,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 9.24e9,  painLevel: 'severe',   isSubScenario: false },
  { animal: 'Salmon',       scenario: 'Farmed salmon with sea lice skirts',          avgSadsPerFarmingYear: 5.7,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 7.18e9,  painLevel: 'severe',   isSubScenario: false },
  { animal: 'Salmon',       scenario: 'Diploid salmon (banned triploidy)',           avgSadsPerFarmingYear: 6.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 7.81e9,  painLevel: 'severe',   isSubScenario: false },
  { animal: 'Sea Bream',    scenario: 'Farmed sea bream',                            avgSadsPerFarmingYear: 1.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 1.07e9,  painLevel: 'moderate', isSubScenario: false },
  { animal: 'Sea Bass',     scenario: 'Farmed sea bass',                             avgSadsPerFarmingYear: 1.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 1.01e9,  painLevel: 'moderate', isSubScenario: false },
  { animal: 'Rainbow Trout',scenario: 'Farmed rainbow trout',                        avgSadsPerFarmingYear: 1.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 7.22e8,  painLevel: 'moderate', isSubScenario: false },
  { animal: 'Tilapia',      scenario: 'Farmed tilapia',                              avgSadsPerFarmingYear: 1.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 3.46e8,  painLevel: 'moderate', isSubScenario: false },
  { animal: 'Pangasius',    scenario: 'Farmed pangasius',                            avgSadsPerFarmingYear: 1.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 3.72e8,  painLevel: 'moderate', isSubScenario: false },
  { animal: 'Catfish',      scenario: 'Farmed catfish',                              avgSadsPerFarmingYear: 1.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 2.66e8,  painLevel: 'moderate', isSubScenario: false },
  { animal: 'Barramundi',   scenario: 'Farmed barramundi',                           avgSadsPerFarmingYear: 1.3,  animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 6.38e8,  painLevel: 'moderate', isSubScenario: false },
  { animal: 'Fish',         scenario: 'Fish slaughter',                              avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 500_000_000,     totalSadBurden: 2.12e7,  painLevel: 'extreme',  isSubScenario: true  },
  { animal: 'Shrimp',       scenario: 'Extensive farming',                           avgSadsPerFarmingYear: 3.2,  animalsSlaughteredPerYear: 125_000_000_000, totalSadBurden: 1.26e11, painLevel: 'moderate', isSubScenario: false },
  { animal: 'Shrimp',       scenario: 'Semi-intensive farming',                      avgSadsPerFarmingYear: 6.9,  animalsSlaughteredPerYear: 125_000_000_000, totalSadBurden: 2.73e11, painLevel: 'severe',   isSubScenario: false },
  { animal: 'Shrimp',       scenario: 'Intensive farming',                           avgSadsPerFarmingYear: 10.3, animalsSlaughteredPerYear: 125_000_000_000, totalSadBurden: 4.04e11, painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Shrimp',       scenario: 'Super-intensive farming',                     avgSadsPerFarmingYear: 10.6, animalsSlaughteredPerYear: 125_000_000_000, totalSadBurden: 4.16e11, painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Shrimp',       scenario: 'Shrimp slaughter',                            avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 250_000_000_000, totalSadBurden: 2.92e9,  painLevel: 'extreme',  isSubScenario: true  },
  { animal: 'Shrimp',       scenario: 'Banning eyestalk ablation + pre-slaughter stunning', avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 250_000_000_000, totalSadBurden: 6.73e10, painLevel: 'extreme', isSubScenario: true },
  { animal: 'Crab',         scenario: 'Crab slaughter',                              avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 10_000_000_000,  totalSadBurden: 1.46e8,  painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Silkworm',     scenario: 'Farmed silkworm larvae',                      avgSadsPerFarmingYear: 2.5,  animalsSlaughteredPerYear: 20_000_000_000,  totalSadBurden: 5.65e9,  painLevel: 'mild',     isSubScenario: false },
  { animal: 'Beef Cows',    scenario: 'Beef cows',                                   avgSadsPerFarmingYear: 7.3,  animalsSlaughteredPerYear: 4_000_000_000,   totalSadBurden: 8.75e10, painLevel: 'severe',   isSubScenario: false },
  { animal: 'Dairy Cows',   scenario: 'Dairy cows',                                  avgSadsPerFarmingYear: 18.6, animalsSlaughteredPerYear: 2_000_000_000,   totalSadBurden: 2.04e11, painLevel: 'extreme',  isSubScenario: false },
  { animal: 'Dairy Cows',   scenario: 'Dairy cow lameness',                          avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 2_000_000_000,   totalSadBurden: 1.12e9,  painLevel: 'severe',   isSubScenario: true  },
  { animal: 'Sheep',        scenario: 'Farmed sheep',                                avgSadsPerFarmingYear: null, animalsSlaughteredPerYear: 300_000_000,     totalSadBurden: 7.55e8,  painLevel: 'moderate', isSubScenario: false },
];

// Chickens are split into sub-types in the data but grouped under "Chickens" in the UI
export const CHICKEN_SUBTYPES = ['Layers', 'Broilers', 'Male Chicks'] as const;

/** Map chicken sub-types to the parent display group 'Chickens'; all other animals pass through unchanged */
export function getDisplayAnimal(animal: string): string {
  return (CHICKEN_SUBTYPES as readonly string[]).includes(animal) ? 'Chickens' : animal;
}

// Animal groups for filtering.
// Top-level strings are direct animal names; objects represent a collapsible parent group.
export type AnimalGroupEntry = string | { parent: string; children: string[] };

export const ANIMAL_GROUPS: Record<string, AnimalGroupEntry[]> = {
  'Land Animals': [
    { parent: 'Chickens', children: ['Layers', 'Broilers', 'Male Chicks'] },
    'Pigs',
    'Beef Cows',
    'Dairy Cows',
    'Sheep',
  ],
  'Fish': ['Salmon', 'Sea Bream', 'Sea Bass', 'Rainbow Trout', 'Tilapia', 'Pangasius', 'Catfish', 'Barramundi', 'Fish'],
  'Crustaceans': ['Shrimp', 'Crab'],
  'Invertebrates': ['Silkworm'],
};

/** Flatten all concrete animal names out of ANIMAL_GROUPS */
export function allAnimalNames(): string[] {
  const names: string[] = [];
  for (const entries of Object.values(ANIMAL_GROUPS)) {
    for (const e of entries) {
      if (typeof e === 'string') names.push(e);
      else names.push(...e.children);
    }
  }
  return names;
}

// Species colour palette — muted, desaturated, dark-theme appropriate
export const SPECIES_COLOURS: Record<string, string> = {
  'Chickens':       '#7c9e8f', // dusty teal (parent group)
  'Layers':         '#7c9e8f', // dusty teal
  'Male Chicks':    '#8fad9b', // lighter teal
  'Broilers':       '#6b8f7e', // muted teal-green
  'Pigs':           '#c4956a', // warm amber-terracotta
  'Beef Cows':      '#b07d5a', // terracotta
  'Dairy Cows':     '#c9a87c', // warm sand
  'Sheep':          '#9aad8f', // sage green
  'Salmon':         '#7a8fb5', // slate blue
  'Sea Bream':      '#6b7fa0', // muted blue
  'Sea Bass':       '#7d8fb5', // blue-grey
  'Rainbow Trout':  '#8a9ec4', // lighter blue
  'Tilapia':        '#606e8a', // dark slate
  'Pangasius':      '#6e7d99', // blue-grey
  'Catfish':        '#5f6d87', // deep slate
  'Barramundi':     '#7a8aaa', // slate
  'Fish':           '#697a97', // generic fish blue
  'Shrimp':         '#b5856e', // dusty rose-terracotta
  'Crab':           '#a8714a', // rusty orange
  'Silkworm':       '#9e9e76', // olive/khaki
};

export const PAIN_COLOURS: Record<PainLevel, string> = {
  extreme: '#da3633',
  severe:  '#e3812b',
  moderate:'#d29922',
  mild:    '#3fb950',
};

export const PAIN_SCORE: Record<PainLevel, number> = {
  extreme: 4,
  severe:  3,
  moderate:2,
  mild:    1,
};

// Baseline SADs per animal for What-If calculator (use first non-sub scenario per species)
export function getBaselineSadsPerAnimal(animalGroup: string): number {
  const baselines: Record<string, number> = {
    chickens: 13.3, // fast-growing broiler
    cattle:    7.3, // beef cows
    dairy:    18.6, // dairy cows
    pigs:      7.3, // sows HIC
    sheep:     2.0, // rough estimate for sheep
    fish:      7.4, // farmed salmon
    shrimp:    6.9, // semi-intensive
    eggs:      8.3, // battery cage
  };
  return baselines[animalGroup] ?? 5;
}
