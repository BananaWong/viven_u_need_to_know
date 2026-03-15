# Viven Water — DataCheck Backend

## Quick Context

This is the water quality data backend for vivenwater.com. It generates static JSON reports (one per US ZIP code) from EPA water quality data, served by Nginx in production.

**No runtime API server** — everything is pre-generated.

## Directory Layout

```
backend/
├── generate.py              ← CORE: reads SQLite DB → outputs 20,608 ZIP JSON reports
├── src/ewg_standards.py     ← 110 EWG health standards (PFAS + conventional contaminants)
├── src/app.py               ← Legacy Flask API (dev only, not used in production)
├── scripts/                 ← Data import pipeline scripts
│   ├── build_database.py         ← Step 1: build base DB (water_systems, pfas, violations)
│   ├── import_additional_data.py ← Step 2: import UCMR3 + UCMR4 + LCR
│   └── import_violations_enforcement.py ← Step 3: replace violations with enhanced data (16x more)
├── data/
│   ├── water_quality.db     ← SQLite DB (1.16 GB, 6 data sources, 10M+ records)
│   ├── sdwa/                ← SDWA raw CSVs (LCR, violations enforcement)
│   ├── ucmr3/, ucmr4/       ← UCMR raw TSVs
│   └── raw/                 ← Original EPA downloads
├── reports/                 ← Generated JSON output (20,608 files)
├── docs/                    ← Detailed docs (PROJECT_OVERVIEW, DATA_SCHEMA, DATA_GAPS)
└── nginx.conf               ← Production Nginx config template
```

## Key Commands

```bash
# Generate all reports (~43 seconds)
python generate.py

# Test single ZIP
python generate.py --zip 07927

# Copy to frontend for dev testing
cp reports/*.json ../public/

# Full data pipeline (only when updating EPA data)
python scripts/build_database.py --force
python scripts/import_additional_data.py
python scripts/import_violations_enforcement.py
python generate.py
```

## Data Sources in DB (6 total)

| Source | Table | Records | Content |
|--------|-------|---------|---------|
| UCMR5 | pfas_results | 1.8M | 26 PFAS "forever chemicals" |
| UCMR3 | ucmr3_results | 847K | chromium-6, 1,4-dioxane, strontium, vanadium |
| UCMR4 | ucmr4_results | 932K | HAA9, HAA5, HAA6Br, manganese |
| LCR | lcr_samples | 917K | Lead (PB90), Copper (CU90) 90th percentile |
| Violations | violations | 5.4M | EPA violations + enforcement (982K with measured values) |
| Systems | water_systems | 433K | All US public water systems |

## Critical Details

- **Unit conversions** in generate.py: UCMR5 µg/L→ppt (×1000 for PFAS), LCR mg/L→ppb (×1000), violations MG/L→ppb
- **Contaminant aliasing**: `VIOLATION_ALIASES` dict maps EPA names to EWG standard names (e.g. "CHROMIUM-6" → "CHROMIUM (HEXAVALENT)")
- **Deduplication**: other_contaminants deduped by both name AND EWG standard key
- **Import order matters**: Step 3 (violations_enforcement) REPLACES Step 1's violations data — don't skip it
- **PWSID format**: 2-letter state + 7 digits (e.g. NJ1424001). No spaces in DB — queries use direct `WHERE pwsid = ?`

## Frontend Integration

- React frontend at `../src/pages/DataCheckPage.jsx`
- Dev: `VITE_API_URL=` (empty) → fetches `/07927.json` from `../public/`
- Prod: `VITE_API_URL=https://api.vivenwater.com` → fetches from Nginx
- Uses `??` not `||` for API_BASE (empty string is falsy, `||` would fallback to prod URL)

## Reference System

NJ1424001 (SOUTHEAST MORRIS COUNTY MUA), ZIP 07927
- EWG page: https://www.ewg.org/tapwater/system.php?pws=NJ1424001
- Our result: 21 contaminants, 9 EWG exceedances, 8 PFAS

## Detailed Docs

For comprehensive documentation, read:
- `docs/PROJECT_OVERVIEW.md` — full architecture, data flow, deployment guide
- `docs/DATA_SCHEMA.md` — all table schemas, indexes, join keys
- `docs/DATA_GAPS.md` — missing data analysis, expansion opportunities
