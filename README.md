# SADs Explorer

An interactive, research-grade data visualisation dashboard for exploring **Suffering-Adjusted Days (SADs)** across farmed animal species globally. Built for animal welfare researchers, policy makers, and NGOs.

Modelled after [GBD Compare](https://vizhub.healthdata.org/gbd-compare/) in scope and intent.

---

## Features

| View | Description |
|---|---|
| **Treemap** | Area-proportional boxes by SAD burden, grouped by species. Click to drill down. |
| **Bar Chart** | Sortable horizontal bars by total burden, SADs/animal, or animals/yr. |
| **Bubble Chart** | X = animals/yr (log), Y = SADs/animal, size = total burden. |
| **World Map** | Choropleth of estimated total SADs per country. Year slider, per-capita toggle. |
| **Timeline** | Multi-country line chart of animal counts 1961–2023. Species selector. |
| **Data Table** | Sortable, filterable table with CSV export. |

**Sidebar controls:** view switcher, metric selector, animal filter, pain level filter, sub-scenario toggle, grouping mode, normalisation, country search, year range.

**What-If Calculator:** Estimate SADs averted per year given N people adopting a vegan diet, with diet breakdown sliders and a donut chart output.

**Comparison Panel:** Pin up to 3 scenarios and compare them on a radar chart.

---

## Data Sources

### Source 1 — XLSX (country-level animal counts)
`data/raw/SADs___Data_on_number_of_animals_farmed.xlsx`

Five sheets from Our World in Data:
- `land-animals-slaughtered-for-me` — ~11,500 country × year rows, 1961–2023
- `farmed-fish-killed` — 579 country × year rows, 2020–2022
- `farmed-crustaceans` — 256 country × year rows
- `share-of-eggs-produced-by-diffe` — egg housing system shares by country

Processed to JSON at build time via `scripts/process-data.ts`. Output lives in `public/data/`.

### Source 2 — SADs Scenarios (embedded TypeScript)
`app/data/sads-scenarios.ts`

37 welfare scenarios for farming systems across 19 animal types, drawn from the Rethink Priorities SADs framework. Each row includes SADs per farming year, animals slaughtered/year, total SAD burden, and pain level classification.

> **Shrimp data warning:** OWID reports ~310B farmed crustaceans/yr total. This dataset uses 125B per system × 4 systems = 500B total, which may double-count. Flagged in the UI.

---

## Running locally

```bash
# 1. Clone
git clone https://github.com/benjyb1/sads-explorer.git
cd sads-explorer

# 2. Install
npm install

# 3. Add the XLSX source file
cp /path/to/SADs___Data_on_number_of_animals_farmed.xlsx data/raw/

# 4. Start dev server (processes data automatically)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The `npm run dev` and `npm run build` commands both run `scripts/process-data.ts` first, which parses the XLSX and writes JSON to `public/data/`.

---

## Project structure

```
sads-explorer/
├── app/
│   ├── page.tsx                  # Main dashboard layout
│   ├── layout.tsx
│   ├── globals.css
│   ├── components/
│   │   ├── Treemap.tsx           # D3 treemap (View 1)
│   │   ├── BarChart.tsx          # Horizontal bar chart (View 2)
│   │   ├── BubbleChart.tsx       # Bubble chart (View 3)
│   │   ├── WorldMap.tsx          # Choropleth map (View 4)
│   │   ├── TimelineChart.tsx     # Trend lines (View 5)
│   │   ├── DataTable.tsx         # Sortable table (View 6)
│   │   ├── Sidebar.tsx           # All filter/control panels
│   │   ├── StatsBar.tsx          # Top summary strip
│   │   ├── ComparisonPanel.tsx   # Pinned scenario comparison
│   │   ├── WhatIfCalculator.tsx  # Diet impact slider tool
│   │   └── Tooltip.tsx           # Shared tooltip + formatters
│   ├── data/
│   │   └── sads-scenarios.ts     # Typed SADs scenario data
│   ├── hooks/
│   │   ├── useFilteredData.ts    # Derived filtered/aggregated views
│   │   └── useCountryData.ts     # Load and join country XLSX data
│   └── store/
│       └── dashboardStore.ts     # Zustand store for all UI state
├── data/
│   ├── raw/                      # Source XLSX (not committed)
│   └── processed/                # Intermediate (not used — output goes to public/)
├── public/
│   └── data/                     # Processed JSON (committed for Vercel)
├── scripts/
│   └── process-data.ts           # XLSX → JSON build script
└── vercel.json
```

---

## Adding new scenarios

Edit `app/data/sads-scenarios.ts` and add a new entry to the `SAD_SCENARIOS` array. The `isSubScenario` flag controls whether the row is excluded from default aggregates (set `true` for rows that are sub-components of a parent scenario).

```ts
{
  animal: 'Layers',
  scenario: 'My new scenario',
  avgSadsPerFarmingYear: 6.0,
  animalsSlaughteredPerYear: 10_000_000_000,
  totalSadBurden: 6e10,
  painLevel: 'moderate',
  isSubScenario: false,
}
```

---

## Deployment

Deployed on Vercel. The build command (`npm run build`) runs `process-data.ts` first, so the processed JSON is always up to date.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/benjyb1/sads-explorer)

---

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **D3 v7** — Treemap, BubbleChart, WorldMap, TimelineChart
- **Recharts** — RadarChart (ComparisonPanel), PieChart (WhatIfCalculator)
- **Zustand** — global UI state
- **Tailwind CSS v4**
- **xlsx** — XLSX parsing at build time
- **DM Sans + DM Mono** — Google Fonts

---

## Licence

MIT
