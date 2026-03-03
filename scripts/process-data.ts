/**
 * process-data.ts
 * Parses SADs XLSX file → clean JSON in /public/data/
 * Run with: npx tsx scripts/process-data.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const INPUT_PATH = path.join(process.cwd(), 'data/raw/SADs___Data_on_number_of_animals_farmed.xlsx');
const OUTPUT_DIR = path.join(process.cwd(), 'public/data');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function writeJSON(filename: string, data: unknown) {
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`✓ Written ${filename} (${Array.isArray(data) ? data.length : Object.keys(data as object).length} entries)`);
}

// Helper: get sheet rows.
// Land animals sheet: Row 0=source URL, Row 1=blank, Row 2=headers → range: 2
// Fish/crustaceans/eggs sheets: Row 0=source URL, Row 1=headers → range: 1
function getSheetRows(sheet: XLSX.WorkSheet, headerRow: number = 2): Record<string, unknown>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerRow, // 0-indexed: row at headerRow becomes the column header
    defval: null,
  });
  return raw;
}

// ISO alpha-3 codes for filtering out regional aggregates
// We keep only rows where Code looks like a real ISO3 country code (3 uppercase letters)
function isCountryCode(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  return /^[A-Z]{3}$/.test(code.trim());
}

function loadWorkbook() {
  console.log('Loading workbook…');
  const buf = fs.readFileSync(INPUT_PATH);
  return XLSX.read(buf, { type: 'buffer', cellDates: true });
}

// ─── Sheet 1: land-animals-slaughtered-for-me ────────────────────────────────

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

function processLandAnimals(wb: XLSX.WorkBook): LandAnimalRow[] {
  const sheet = wb.Sheets['land-animals-slaughtered-for-me'];
  if (!sheet) throw new Error('Sheet land-animals-slaughtered-for-me not found');
  const rows = getSheetRows(sheet);

  const results: LandAnimalRow[] = [];

  for (const row of rows) {
    const code = row['Code'] ?? row['code'];
    if (!isCountryCode(code)) continue;

    const entity = String(row['Entity'] ?? row['entity'] ?? '');
    const year = Number(row['Year'] ?? row['year']);
    if (!year || isNaN(year)) continue;

    // Find columns by partial match
    const findCol = (keyword: string): number | null => {
      const key = Object.keys(row).find(k =>
        k.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!key) return null;
      const v = row[key];
      return v !== null && v !== undefined && v !== '' ? Number(v) : null;
    };

    results.push({
      entity,
      code: String(code).trim(),
      year,
      chickens: findCol('chicken'),
      ducks: findCol('duck'),
      pigs: findCol('pig'),
      geese: findCol('geese'),
      sheep: findCol('sheep'),
      rabbits: findCol('rabbit'),
      turkeys: findCol('turkey'),
      goats: findCol('goat'),
      cattle: findCol('cattle'),
      other: findCol('other'),
    });
  }

  return results;
}

// ─── Sheet 2: farmed-fish-killed ─────────────────────────────────────────────

interface FarmedFishRow {
  entity: string;
  code: string;
  year: number;
  estimate: number | null;
  upper: number | null;
  lower: number | null;
}

function processFarmedFish(wb: XLSX.WorkBook): FarmedFishRow[] {
  const sheet = wb.Sheets['farmed-fish-killed'];
  if (!sheet) throw new Error('Sheet farmed-fish-killed not found');
  const rows = getSheetRows(sheet, 1); // only 1 skip row for this sheet

  const results: FarmedFishRow[] = [];

  for (const row of rows) {
    // Entity column may be mislabelled as '¿Qué pasa?' — handle gracefully
    const entityKey = Object.keys(row).find(k =>
      k.toLowerCase().includes('entity') ||
      k.includes('pasa') ||
      k.includes('?')
    );
    const entity = entityKey ? String(row[entityKey] ?? '') : String(row['Entity'] ?? '');

    const code = row['Code'] ?? row['code'];
    if (!isCountryCode(code)) continue;

    const year = Number(row['Year'] ?? row['year']);
    if (!year || isNaN(year)) continue;

    const findCol = (keyword: string): number | null => {
      const key = Object.keys(row).find(k =>
        k.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!key) return null;
      const v = row[key];
      return v !== null && v !== undefined && v !== '' ? Number(v) : null;
    };

    // Central estimate: the column that is NOT upper/lower bound
    const estimateKey = Object.keys(row).find(k => {
      const kl = k.toLowerCase();
      return (kl.includes('estimated') || kl.includes('farmed fish')) &&
             !kl.includes('upper') && !kl.includes('lower') && !kl.includes('bound');
    });
    results.push({
      entity,
      code: String(code).trim(),
      year,
      estimate: estimateKey ? (row[estimateKey] !== null ? Number(row[estimateKey]) : null) : null,
      upper: findCol('upper'),
      lower: findCol('lower'),
    });
  }

  return results;
}

// ─── Sheet 3: farmed-crustaceans ─────────────────────────────────────────────

interface FarmedCrustaceanRow {
  entity: string;
  code: string;
  year: number;
  estimate: number | null;
  upper: number | null;
  lower: number | null;
}

function processFarmedCrustaceans(wb: XLSX.WorkBook): FarmedCrustaceanRow[] {
  const sheet = wb.Sheets['farmed-crustaceans'];
  if (!sheet) throw new Error('Sheet farmed-crustaceans not found');
  const rows = getSheetRows(sheet, 1);

  const results: FarmedCrustaceanRow[] = [];

  for (const row of rows) {
    const code = row['Code'] ?? row['code'];
    if (!isCountryCode(code)) continue;

    const entity = String(row['Entity'] ?? row['entity'] ?? '');
    const year = Number(row['Year'] ?? row['year']);
    if (!year || isNaN(year)) continue;

    const findCol = (keyword: string): number | null => {
      const key = Object.keys(row).find(k =>
        k.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!key) return null;
      const v = row[key];
      return v !== null && v !== undefined && v !== '' ? Number(v) : null;
    };

    const estimateKey = Object.keys(row).find(k => {
      const kl = k.toLowerCase();
      return (kl.includes('estimated') || kl.includes('crustacean')) &&
             !kl.includes('upper') && !kl.includes('lower') && !kl.includes('bound');
    });
    results.push({
      entity,
      code: String(code).trim(),
      year,
      estimate: estimateKey ? (row[estimateKey] !== null ? Number(row[estimateKey]) : null) : null,
      upper: findCol('upper'),
      lower: findCol('lower'),
    });
  }

  return results;
}

// ─── Sheet 4: share-of-eggs-produced-by-diffe ────────────────────────────────

interface EggHousingRow {
  entity: string;
  code: string;
  year: number;
  caged: number | null;
  barnOrAviary: number | null;
  nonOrganicFreeRange: number | null;
  organicFreeRange: number | null;
  unknown: number | null;
}

function processEggHousing(wb: XLSX.WorkBook): EggHousingRow[] {
  const sheetName = wb.SheetNames.find(n => n.includes('share-of-eggs') || n.includes('egg'));
  if (!sheetName) throw new Error('Egg housing sheet not found');
  const sheet = wb.Sheets[sheetName];
  const rows = getSheetRows(sheet, 1);

  const results: EggHousingRow[] = [];

  for (const row of rows) {
    const code = row['Code'] ?? row['code'];
    if (!isCountryCode(code)) continue;

    const entity = String(row['Entity'] ?? row['entity'] ?? '');
    const year = Number(row['Year'] ?? row['year']);
    if (!year || isNaN(year)) continue;

    const findCol = (keyword: string): number | null => {
      const key = Object.keys(row).find(k =>
        k.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!key) return null;
      const v = row[key];
      return v !== null && v !== undefined && v !== '' ? Number(v) : null;
    };

    results.push({
      entity,
      code: String(code).trim(),
      year,
      caged: findCol('cage'),
      barnOrAviary: findCol('barn') ?? findCol('aviary'),
      nonOrganicFreeRange: findCol('non-organic'),
      organicFreeRange: findCol('organic'),
      unknown: findCol('unknown'),
    });
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const wb = loadWorkbook();
  console.log('Sheets found:', wb.SheetNames);

  const landAnimals = processLandAnimals(wb);
  writeJSON('land_animals_by_country_year.json', landAnimals);

  const farmedFish = processFarmedFish(wb);
  writeJSON('farmed_fish_by_country_year.json', farmedFish);

  const crustaceans = processFarmedCrustaceans(wb);
  writeJSON('farmed_crustaceans_by_country_year.json', crustaceans);

  const eggHousing = processEggHousing(wb);
  writeJSON('egg_housing_systems_by_country.json', eggHousing);

  console.log('\n✅ All data processed successfully');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
