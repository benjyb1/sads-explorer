/** Approximate country populations (millions) — used for per-capita normalisation and What-If calculator */
export const COUNTRY_POP_M: Record<string, number> = {
  CHN: 1412, IND: 1408, USA: 335,  IDN: 277,  PAK: 231,  BRA: 214,  NGA: 218,
  BGD: 170,  RUS: 144,  ETH: 123,  MEX: 130,  JPN: 125,  PHL: 113,  COD: 99,
  EGY: 105,  VNM: 97,   IRN: 86,   TUR: 85,   DEU: 84,   THA: 70,   GBR: 68,  FRA: 67,
  TZA: 65,   ZAF: 60,   MMR: 54,   KEN: 55,   ARG: 46,   UKR: 41,   DZA: 45,  IRQ: 42,
  SDN: 45,   UGA: 48,   ITA: 60,   POL: 38,   CAN: 38,   MAR: 37,   MOZ: 33,  AGO: 35,
  PER: 33,   AFG: 40,   SAU: 35,   MYS: 33,   GHA: 32,   XKX: 2,    AUS: 26,  ESP: 47,
  KOR: 52,   CMR: 27,   NPL: 30,   VEN: 28,   MDG: 27,   CIV: 27,   ROU: 19,  NLD: 17,
  CHL: 19,   COL: 51,   TCD: 17,   ZMB: 19,   SOM: 17,   MWI: 19,   ZWE: 15,  BEL: 11,
  SEN: 17,   GTM: 17,   KAZ: 19,   BLR: 9,    HUN: 10,   SWE: 10,   CUB: 11,  HND: 10,
  AUT: 9,    PRT: 10,   DNK: 6,    FIN: 5,    NOR: 5,    CHE: 9,    ISR: 9,   SYR: 21,
  TUN: 12,   BOL: 12,   PRY: 7,    LAO: 7,    URY: 3,    PAN: 4,    CRI: 5,   ARE: 10,
  NZL: 5,    BWA: 3,    NAM: 3,    MRT: 4,    MLI: 22,   BFA: 22,   NER: 25,  GIN: 13,
  BEN: 13,   TGO: 8,    SLE: 8,    LBR: 5,    GMB: 3,    GNB: 2,    CPV: 1,
};

/** Approximate continent populations (millions) */
export const CONTINENT_POP_M: Record<string, number> = {
  'Asia':          4700,
  'Africa':        1430,
  'Europe':         745,
  'North America':  595,
  'South America':  440,
  'Oceania':         45,
};

/** World total population (millions) */
export const WORLD_POP_M = 8045;
