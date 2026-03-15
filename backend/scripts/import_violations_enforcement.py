#!/usr/bin/env python3
"""
Replace violations table with the full SDWA_VIOLATIONS_ENFORCEMENT.csv data.
This has 16x more measured values (982K vs 62K) and covers 110K water systems.

Deduplicates by (PWSID, VIOLATION_ID), keeping the row with the highest VIOL_MEASURE.
"""
import csv
import sqlite3
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DB_PATH  = DATA_DIR / "water_quality.db"
CSV_PATH = DATA_DIR / "sdwa" / "SDWA_VIOLATIONS_ENFORCEMENT.csv"

def main():
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")

    # Backup count
    old_count = conn.execute("SELECT COUNT(*) FROM violations").fetchone()[0]
    old_measured = conn.execute("SELECT COUNT(*) FROM violations WHERE viol_measure IS NOT NULL").fetchone()[0]
    print(f"Current violations: {old_count:,} ({old_measured:,} with measures)")

    # Clear and reimport
    print("Clearing violations table...")
    conn.execute("DELETE FROM violations")
    conn.commit()

    print(f"Importing {CSV_PATH.name} (3.8 GB, this takes a few minutes)...")
    batch = []
    total = 0
    skipped_dupes = 0
    seen = {}  # (pwsid, violation_id) -> max viol_measure

    # First pass: deduplicate, keeping highest viol_measure per violation
    with open(CSV_PATH, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pwsid = (row.get("PWSID") or "").strip().strip('"')
            vid   = (row.get("VIOLATION_ID") or "").strip().strip('"')
            vm_s  = (row.get("VIOL_MEASURE") or "").strip().strip('"')
            
            try:
                vm = float(vm_s) if vm_s else None
            except ValueError:
                vm = None

            key = (pwsid, vid)
            if key in seen:
                old_vm = seen[key][0]
                # Keep the one with higher measured value
                if vm is not None and (old_vm is None or vm > old_vm):
                    seen[key] = (vm, row)
                skipped_dupes += 1
                continue
            
            seen[key] = (vm, row)
            total += 1
            if total % 1000000 == 0:
                print(f"  ...scanned {total:,} unique violations")

    print(f"  Scanned complete: {len(seen):,} unique violations, {skipped_dupes:,} duplicate rows skipped")

    # Second pass: insert all unique violations
    batch = []
    inserted = 0
    for (pwsid, vid), (vm, row) in seen.items():
        hb = (row.get("IS_HEALTH_BASED_IND") or "").strip().strip('"')
        mj = (row.get("IS_MAJOR_VIOL_IND") or "").strip().strip('"')

        try:
            fm = (row.get("FEDERAL_MCL") or "").strip().strip('"')
        except:
            fm = ""
        try:
            sm = (row.get("STATE_MCL") or "").strip().strip('"')
        except:
            sm = ""

        batch.append((
            pwsid,
            vid,
            (row.get("FACILITY_ID") or "").strip().strip('"'),
            (row.get("COMPL_PER_BEGIN_DATE") or "").strip().strip('"'),
            (row.get("COMPL_PER_END_DATE") or "").strip().strip('"'),
            (row.get("VIOLATION_CODE") or "").strip().strip('"'),
            (row.get("VIOLATION_CATEGORY_CODE") or "").strip().strip('"'),
            1 if hb == "Y" else 0,
            (row.get("CONTAMINANT_CODE") or "").strip().strip('"'),
            vm,
            (row.get("UNIT_OF_MEASURE") or "").strip().strip('"') if vm is not None else None,
            fm,
            sm,
            1 if mj == "Y" else 0,
            (row.get("VIOLATION_STATUS") or "").strip().strip('"'),
            (row.get("RULE_CODE") or "").strip().strip('"'),
            (row.get("RULE_FAMILY_CODE") or "").strip().strip('"'),
        ))
        inserted += 1

        if len(batch) >= 100000:
            conn.executemany("""
                INSERT INTO violations
                (pwsid, violation_id, facility_id, compl_per_begin_date, compl_per_end_date,
                 violation_code, violation_category_code, is_health_based, contaminant_code,
                 viol_measure, unit_of_measure, federal_mcl, state_mcl, is_major_viol,
                 violation_status, rule_code, rule_family_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, batch)
            batch = []
            if inserted % 500000 == 0:
                print(f"  ...inserted {inserted:,}")

    if batch:
        conn.executemany("""
            INSERT INTO violations
            (pwsid, violation_id, facility_id, compl_per_begin_date, compl_per_end_date,
             violation_code, violation_category_code, is_health_based, contaminant_code,
             viol_measure, unit_of_measure, federal_mcl, state_mcl, is_major_viol,
             violation_status, rule_code, rule_family_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, batch)

    conn.commit()

    # Verify
    new_count = conn.execute("SELECT COUNT(*) FROM violations").fetchone()[0]
    new_measured = conn.execute("SELECT COUNT(*) FROM violations WHERE viol_measure IS NOT NULL").fetchone()[0]
    new_health = conn.execute("SELECT COUNT(*) FROM violations WHERE is_health_based = 1 AND viol_measure IS NOT NULL").fetchone()[0]
    new_pwsids = conn.execute("SELECT COUNT(DISTINCT pwsid) FROM violations WHERE viol_measure IS NOT NULL").fetchone()[0]

    print(f"\n=== Import Complete ===")
    print(f"  Total violations: {new_count:,} (was {old_count:,})")
    print(f"  With measured values: {new_measured:,} (was {old_measured:,})")
    print(f"  Health-based with measures: {new_health:,}")
    print(f"  Distinct PWSIDs with measures: {new_pwsids:,}")

    conn.close()
    print("Done.")

if __name__ == "__main__":
    main()
