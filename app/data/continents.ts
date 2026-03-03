/** Continent → ISO3 country codes mapping */
export const CONTINENT_COUNTRIES: Record<string, string[]> = {
  Africa: [
    'DZA','AGO','BEN','BWA','BFA','BDI','CPV','CMR','CAF','TCD',
    'COM','COD','COG','CIV','DJI','EGY','GNQ','ERI','SWZ','ETH',
    'GAB','GMB','GHA','GIN','GNB','KEN','LSO','LBR','LBY','MDG',
    'MWI','MLI','MRT','MUS','MAR','MOZ','NAM','NER','NGA','REU',
    'RWA','SHN','STP','SEN','SYC','SLE','SOM','ZAF','SSD','SDN',
    'TZA','TGO','TUN','UGA','ESH','ZMB','ZWE',
  ],
  Asia: [
    'AFG','ARM','AZE','BHR','BGD','BTN','BRN','KHM','CHN','CYP',
    'GEO','HKG','IND','IDN','IRN','IRQ','ISR','JPN','JOR','KAZ',
    'KWT','KGZ','LAO','LBN','MAC','MYS','MDV','MNG','MMR','NPL',
    'PRK','OMN','PAK','PSE','PHL','QAT','SAU','SGP','KOR','LKA',
    'SYR','TWN','TJK','THA','TLS','TKM','ARE','UZB','VNM','YEM',
  ],
  Europe: [
    'ALB','AND','AUT','BLR','BEL','BIH','BGR','HRV','CYP','CZE',
    'DNK','EST','FIN','FRA','DEU','GRC','HUN','ISL','IRL','ITA',
    'XKX','LVA','LIE','LTU','LUX','MLT','MDA','MCO','MNE','NLD',
    'MKD','NOR','POL','PRT','ROU','RUS','SMR','SRB','SVK','SVN',
    'ESP','SWE','CHE','UKR','GBR','VAT',
  ],
  'North America': [
    'ATG','BHS','BRB','BLZ','CAN','CRI','CUB','DMA','DOM','SLV',
    'GRD','GTM','HTI','HND','JAM','MEX','NIC','PAN','KNA','LCA',
    'VCT','TTO','USA',
  ],
  'South America': [
    'ARG','BOL','BRA','CHL','COL','ECU','GUY','PRY','PER','SUR',
    'URY','VEN',
  ],
  Oceania: [
    'AUS','FJI','KIR','MHL','FSM','NRU','NZL','PLW','PNG','WSM',
    'SLB','TON','TUV','VUT',
  ],
};

/** Reverse lookup: ISO3 → continent */
export const CODE_TO_CONTINENT: Record<string, string> = {};
for (const [continent, codes] of Object.entries(CONTINENT_COUNTRIES)) {
  for (const code of codes) {
    CODE_TO_CONTINENT[code] = continent;
  }
}

export const CONTINENT_ORDER = [
  'Asia',
  'Africa',
  'Europe',
  'North America',
  'South America',
  'Oceania',
];
