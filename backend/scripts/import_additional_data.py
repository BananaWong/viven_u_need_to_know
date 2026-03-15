#!/usr/bin/env python3
"""
Import additional EPA data sources into water_quality.db:
  1. UCMR3 (2013-2015): chromium-6, 1,4-dioxane, strontium, vanadium, etc.
  2. UCMR4 (2018-2020): HAA9, manganese, cyanotoxins, etc.
  3. Lead & Copper Rule (LCR) samples from SDWA download

Usage:
    python import_additional_data.py
    python import_additional_data.py --skip-lcr   # if SDWA zip not ready yet
"""

import argparse
import csv
import os
import sqlite3
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DB_PATH  = DATA_DIR / "water_quality.db"

# Contaminants we care about from UCMR3 (skip PFAS — already in UCMR5)
UCMR3_PFAS = {"PFOA", "PFOS", "PFBS", "PFHpA", "PFHxS", "PFNA"}
# Contaminants we care about from UCMR4 (skip things with no EWG relevance)
UCMR4_SKIP = set()  # keep everything


def create_tables(conn):
    """Create tables for new data sources."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ucmr3_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pwsid TEXT NOT NULL,
            contaminant TEXT NOT NULL,
            analytical_result_value REAL,
            analytical_result_sign TEXT,
            mrl REAL,
            units TEXT,
            collection_date TEXT,
            detected INTEGER DEFAULT 0,
            state TEXT,
            sample_id TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ucmr4_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pwsid TEXT NOT NULL,
            contaminant TEXT NOT NULL,
            analytical_result_value REAL,
            analytical_result_sign TEXT,
            mrl REAL,
            units TEXT,
            collection_date TEXT,
            detected INTEGER DEFAULT 0,
            state TEXT,
            sample_id TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS lcr_samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pwsid TEXT NOT NULL,
            contaminant_code TEXT,
            sample_measure REAL,
            unit_of_measure TEXT,
            sample_date TEXT,
            result_sign TEXT,
            action_level REAL,
            action_level_exceeded TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ucmr3_pwsid ON ucmr3_results(pwsid)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ucmr4_pwsid ON ucmr4_results(pwsid)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_lcr_pwsid ON lcr_samples(pwsid)")
    conn.commit()


def import_ucmr(conn, filepath, table, skip_contaminants=None):
    """Import a UCMR tab-delimited file."""
    print(f"  Importing {filepath.name} → {table}...")

    # Clear existing data
    conn.execute(f"DELETE FROM {table}")

    batch = []
    total = 0
    detected = 0

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            contaminant = row.get("Contaminant", "").strip()
            if skip_contaminants and contaminant in skip_contaminants:
                continue

            sign = row.get("AnalyticalResultsSign", "").strip()
            val_str = row.get("AnalyticalResultValue", "").strip()
            mrl_str = row.get("MRL", "").strip()

            try:
                val = float(val_str) if val_str else None
            except ValueError:
                val = None

            try:
                mrl = float(mrl_str) if mrl_str else None
            except ValueError:
                mrl = None

            is_detected = 1 if (sign == "=" and val is not None) else 0
            if is_detected:
                detected += 1

            batch.append((
                row.get("PWSID", "").strip(),
                contaminant,
                val,
                sign,
                mrl,
                row.get("Units", "").strip(),
                row.get("CollectionDate", "").strip(),
                is_detected,
                row.get("State", "").strip(),
                row.get("SampleID", "").strip(),
            ))
            total += 1

            if len(batch) >= 50000:
                conn.executemany(f"""
                    INSERT INTO {table}
                    (pwsid, contaminant, analytical_result_value, analytical_result_sign,
                     mrl, units, collection_date, detected, state, sample_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, batch)
                batch = []

    if batch:
        conn.executemany(f"""
            INSERT INTO {table}
            (pwsid, contaminant, analytical_result_value, analytical_result_sign,
             mrl, units, collection_date, detected, state, sample_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, batch)

    conn.commit()
    print(f"    {total:,} records imported, {detected:,} detected")
    return total, detected


def import_lcr(conn, filepath):
    """Import Lead & Copper Rule samples from SDWA CSV."""
    print(f"  Importing {filepath.name} → lcr_samples...")

    conn.execute("DELETE FROM lcr_samples")

    batch = []
    total = 0

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            val_str = (row.get("SAMPLE_MEASURE") or "").strip().strip('"')
            contam  = (row.get("CONTAMINANT_CODE") or "").strip().strip('"')
            # Only keep PB90 (lead) and CU90 (copper) — skip individual site samples
            if contam not in ("PB90", "CU90"):
                continue

            try:
                val = float(val_str) if val_str else None
            except ValueError:
                val = None

            batch.append((
                (row.get("PWSID") or "").strip().strip('"'),
                contam,
                val,
                (row.get("UNIT_OF_MEASURE") or "").strip().strip('"'),
                (row.get("SAMPLING_END_DATE") or "").strip().strip('"'),
                (row.get("RESULT_SIGN_CODE") or "").strip().strip('"'),
                None,  # action_level not in this dataset
                None,  # action_level_exceeded not in this dataset
            ))
            total += 1

            if len(batch) >= 50000:
                conn.executemany("""
                    INSERT INTO lcr_samples
                    (pwsid, contaminant_code, sample_measure, unit_of_measure,
                     sample_date, result_sign, action_level, action_level_exceeded)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, batch)
                batch = []

    if batch:
        conn.executemany("""
            INSERT INTO lcr_samples
            (pwsid, contaminant_code, sample_measure, unit_of_measure,
             sample_date, result_sign, action_level, action_level_exceeded)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, batch)

    conn.commit()
    print(f"    {total:,} records imported (PB90 + CU90 only)")
    return total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-lcr", action="store_true", help="Skip LCR import")
    parser.add_argument("--db", default=str(DB_PATH))
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    print("Creating tables...")
    create_tables(conn)

    # UCMR3
    ucmr3_file = DATA_DIR / "ucmr3" / "UCMR3_All.txt"
    if ucmr3_file.exists():
        import_ucmr(conn, ucmr3_file, "ucmr3_results", skip_contaminants=UCMR3_PFAS)
    else:
        print(f"  [SKIP] UCMR3 not found: {ucmr3_file}")

    # UCMR4
    ucmr4_file = DATA_DIR / "ucmr4" / "UCMR4_All.txt"
    if ucmr4_file.exists():
        import_ucmr(conn, ucmr4_file, "ucmr4_results", skip_contaminants=UCMR4_SKIP)
    else:
        print(f"  [SKIP] UCMR4 not found: {ucmr4_file}")

    # LCR
    if not args.skip_lcr:
        lcr_file = DATA_DIR / "sdwa" / "SDWA_LCR_Samples.csv"
        if lcr_file.exists():
            import_lcr(conn, lcr_file)
        else:
            print(f"  [SKIP] LCR not found: {lcr_file}")
            print(f"         Extract from sdwa_downloads.zip first")
    else:
        print("  [SKIP] LCR (--skip-lcr)")

    # Print summary
    print("\n=== Summary ===")
    for table in ["ucmr3_results", "ucmr4_results", "lcr_samples"]:
        cnt = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {cnt:,} records")

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
