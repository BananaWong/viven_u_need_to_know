#!/usr/bin/env python3
"""
Import EPA Six-Year Review 4 (SYR4) monitoring data into water_quality.db.

SYR4 contains ~71 million actual lab results for regulated contaminants
(THMs, HAAs, Bromate, Chlorite) from 2012-2019, covering ~140K water systems.

This is the key data source that fills the "routine monitoring" gap — contaminants
detected in water even when they don't violate EPA limits but exceed EWG guidelines.

Source: https://www.epa.gov/dwsixyearreview

Usage:
    python import_syr4.py
"""

import csv
import io
import sqlite3
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DB_PATH  = DATA_DIR / "water_quality.db"
SYR4_DIR = DATA_DIR / "syr4"

# Map SYR4 analyte names to our canonical names (matching EWG standards)
ANALYTE_MAP = {
    # THMs
    "CHLOROFORM":             "Chloroform",
    "BROMODICHLOROMETHANE":    "Bromodichloromethane",
    "DIBROMOCHLOROMETHANE":    "Dibromochloromethane",
    "BROMOFORM":              "Bromoform",
    "TOTAL TRIHALOMETHANES (TTHM)": "Total trihalomethanes (TTHMs)",
    # HAAs
    "DICHLOROACETIC ACID":    "Dichloroacetic acid",
    "TRICHLOROACETIC ACID":   "Trichloroacetic acid",
    "DIBROMOACETIC ACID":     "Dibromoacetic acid",
    "MONOCHLOROACETIC ACID":  "Monochloroacetic acid",
    "MONOBROMOACETIC ACID":   "Monobromoacetic acid",
    "HALOACETIC ACIDS (HAA5)": "Haloacetic acids (HAA5)",
    # Bromate / Chlorite
    "BROMATE":                "Bromate",
    "CHLORITE":               "Chlorite",
}


def create_table(conn):
    """Create the syr4_results table (pre-aggregated: one row per PWSID+contaminant)."""
    conn.execute("DROP TABLE IF EXISTS syr4_results")
    conn.execute("""
        CREATE TABLE syr4_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pwsid TEXT NOT NULL,
            contaminant TEXT NOT NULL,
            avg_value REAL,
            max_value REAL,
            unit TEXT,
            sample_count INTEGER,
            detect_count INTEGER,
            latest_date TEXT,
            state TEXT
        )
    """)
    conn.execute("CREATE INDEX idx_syr4_pwsid ON syr4_results(pwsid)")
    conn.commit()


def process_zip(zippath, conn):
    """Process all files in a SYR4 zip, aggregating by PWSID+contaminant."""
    print(f"\n  Processing {zippath.name}...")
    zf = zipfile.ZipFile(zippath)

    for fname in zf.namelist():
        print(f"    Reading {fname}...", end="", flush=True)

        # Aggregate: (pwsid, contaminant) -> {values, dates, state, unit}
        agg = defaultdict(lambda: {"values": [], "dates": [], "state": "", "unit": ""})
        total_rows = 0
        detected_rows = 0

        with zf.open(fname) as f:
            reader = csv.DictReader(
                io.TextIOWrapper(f, encoding="utf-8", errors="replace"),
                delimiter="\t"
            )
            for row in reader:
                total_rows += 1
                detect = (row.get("DETECT") or "").strip().strip('"')
                if detect != "1":
                    continue

                detected_rows += 1
                pwsid = (row.get("PWSID") or "").strip().strip('"')
                analyte = (row.get("ANALYTE_NAME") or "").strip().strip('"')
                val_str = (row.get("VALUE") or "").strip().strip('"')
                unit = (row.get("UNIT") or "").strip().strip('"')
                date = (row.get("SAMPLE_COLLECTION_DATE") or "").strip().strip('"')
                state = (row.get("STATE_CODE") or "").strip().strip('"')

                contaminant = ANALYTE_MAP.get(analyte.upper(), analyte)

                try:
                    val = float(val_str)
                except (ValueError, TypeError):
                    continue

                key = (pwsid, contaminant)
                agg[key]["values"].append(val)
                agg[key]["dates"].append(date)
                agg[key]["state"] = state
                agg[key]["unit"] = unit

        # Insert aggregated results
        batch = []
        for (pwsid, contaminant), data in agg.items():
            vals = data["values"]
            avg_val = sum(vals) / len(vals)
            max_val = max(vals)
            latest = max(data["dates"]) if data["dates"] else ""

            batch.append((
                pwsid,
                contaminant,
                round(avg_val, 4),
                round(max_val, 4),
                data["unit"],
                len(vals) + (total_rows - detected_rows) // max(len(agg), 1),  # approximate total samples
                len(vals),
                latest,
                data["state"],
            ))

        if batch:
            conn.executemany("""
                INSERT INTO syr4_results
                (pwsid, contaminant, avg_value, max_value, unit, sample_count, detect_count, latest_date, state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, batch)
            conn.commit()

        print(f" {total_rows:,} rows, {detected_rows:,} detected, {len(agg):,} unique PWSID+contaminant pairs")

    zf.close()


def compute_national_averages(conn):
    """Compute national and state averages for each contaminant."""
    print("\n  Computing national averages...")
    conn.execute("DROP TABLE IF EXISTS syr4_averages")
    conn.execute("""
        CREATE TABLE syr4_averages (
            contaminant TEXT NOT NULL,
            scope TEXT NOT NULL,
            scope_value TEXT,
            avg_value REAL,
            system_count INTEGER,
            PRIMARY KEY (contaminant, scope, scope_value)
        )
    """)

    # National averages
    rows = conn.execute("""
        SELECT contaminant, AVG(avg_value) as nat_avg, COUNT(DISTINCT pwsid) as cnt
        FROM syr4_results
        WHERE detect_count > 0
        GROUP BY contaminant
    """).fetchall()
    for r in rows:
        conn.execute(
            "INSERT INTO syr4_averages VALUES (?, 'national', 'US', ?, ?)",
            (r[0], round(r[1], 4), r[2])
        )

    # State averages
    rows = conn.execute("""
        SELECT contaminant, state, AVG(avg_value) as state_avg, COUNT(DISTINCT pwsid) as cnt
        FROM syr4_results
        WHERE detect_count > 0 AND state != ''
        GROUP BY contaminant, state
    """).fetchall()
    for r in rows:
        conn.execute(
            "INSERT INTO syr4_averages VALUES (?, 'state', ?, ?, ?)",
            (r[0], r[1], round(r[2], 4), r[3])
        )

    conn.commit()
    cnt = conn.execute("SELECT COUNT(*) FROM syr4_averages").fetchone()[0]
    print(f"    {cnt:,} average entries (national + state)")


def main():
    if not SYR4_DIR.exists():
        print(f"[ERROR] SYR4 directory not found: {SYR4_DIR}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")

    print("Creating syr4_results table...")
    create_table(conn)

    # Process each zip
    for zipname in ["SYR4_THMs.zip", "SYR4_HAAs.zip", "SYR4_Bromate_Chlorite.zip"]:
        zippath = SYR4_DIR / zipname
        if zippath.exists():
            process_zip(zippath, conn)
        else:
            print(f"  [SKIP] {zipname} not found")

    # Compute averages
    compute_national_averages(conn)

    # Summary
    print("\n=== Summary ===")
    total = conn.execute("SELECT COUNT(*) FROM syr4_results").fetchone()[0]
    pwsids = conn.execute("SELECT COUNT(DISTINCT pwsid) FROM syr4_results").fetchone()[0]
    contams = conn.execute("SELECT COUNT(DISTINCT contaminant) FROM syr4_results").fetchone()[0]
    print(f"  Total records: {total:,}")
    print(f"  Unique water systems: {pwsids:,}")
    print(f"  Unique contaminants: {contams:,}")

    print("\n  Per contaminant:")
    for r in conn.execute("""
        SELECT contaminant, COUNT(DISTINCT pwsid) as systems, ROUND(AVG(avg_value), 3) as avg
        FROM syr4_results WHERE detect_count > 0
        GROUP BY contaminant ORDER BY systems DESC
    """):
        print(f"    {r[0]:45s} {r[1]:>7,} systems  avg={r[2]}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
