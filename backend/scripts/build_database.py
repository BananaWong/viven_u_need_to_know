#!/usr/bin/env python3
"""
Build national water quality SQLite database from raw data files.

Usage:
    python scripts/build_database.py [--force]

Options:
    --force    Rebuild database even if it exists

Estimated time: 15-20 minutes for full build
"""

import argparse
import csv
import io
import sqlite3
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
DB_PATH = BASE_DIR / "data" / "water_quality.db"
TEMP_DB_PATH = DB_PATH.with_suffix('.db.tmp')

# Only import violations from last N years
VIOLATION_CUTOFF_YEARS = 10

# Batch size for inserts
BATCH_SIZE = 10000


def create_schema(conn: sqlite3.Connection):
    """Create database tables."""
    conn.executescript("""
        -- Water systems (from SDWA_PUB_WATER_SYSTEMS.csv)
        CREATE TABLE IF NOT EXISTS water_systems (
            pwsid TEXT PRIMARY KEY,
            name TEXT,
            state_code TEXT,
            primacy_agency_code TEXT,
            epa_region TEXT,
            pws_type_code TEXT,
            owner_type_code TEXT,
            population_served INTEGER,
            service_connections INTEGER,
            primary_source_code TEXT,
            city_name TEXT,
            zip_code TEXT,
            pws_activity_code TEXT
        );

        -- ZIP code to water system mapping (from UCMR5_ZIPCodes.txt)
        CREATE TABLE IF NOT EXISTS zip_to_pwsid (
            zipcode TEXT NOT NULL,
            pwsid TEXT NOT NULL,
            PRIMARY KEY (zipcode, pwsid)
        );

        -- Violations (from SDWA_VIOLATIONS_ENFORCEMENT.csv)
        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pwsid TEXT NOT NULL,
            violation_id TEXT NOT NULL,
            facility_id TEXT,
            compl_per_begin_date TEXT,
            compl_per_end_date TEXT,
            violation_code TEXT,
            violation_category_code TEXT,
            is_health_based INTEGER DEFAULT 0,
            contaminant_code TEXT,
            viol_measure REAL,
            unit_of_measure TEXT,
            federal_mcl TEXT,
            state_mcl TEXT,
            is_major_viol INTEGER DEFAULT 0,
            violation_status TEXT,
            rule_code TEXT,
            rule_family_code TEXT
        );

        -- PFAS results (from UCMR5_All_*.txt files)
        CREATE TABLE IF NOT EXISTS pfas_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pwsid TEXT NOT NULL,
            facility_id TEXT,
            facility_name TEXT,
            facility_water_type TEXT,
            sample_point_id TEXT,
            collection_date TEXT,
            sample_id TEXT,
            contaminant TEXT NOT NULL,
            mrl REAL,
            units TEXT,
            analytical_result_sign TEXT,
            analytical_result_value REAL,
            detected INTEGER DEFAULT 0,
            state_code TEXT
        );

        -- Contaminant codes (from SDWA_REF_CODE_VALUES.csv)
        CREATE TABLE IF NOT EXISTS contaminant_codes (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );

        -- Contaminant health reference (from contaminant_reference.csv)
        CREATE TABLE IF NOT EXISTS contaminant_reference (
            chemical_name TEXT PRIMARY KEY,
            category TEXT,
            ca_mcl TEXT,
            ca_mcl_unit TEXT,
            federal_mcl TEXT,
            federal_mcl_unit TEXT,
            health_effects TEXT,
            sources TEXT
        );

        -- Metadata for tracking data freshness
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()


def create_indexes(conn: sqlite3.Connection):
    """Create indexes for query performance."""
    print("Creating indexes...")
    conn.executescript("""
        CREATE INDEX IF NOT EXISTS idx_zip_zipcode ON zip_to_pwsid(zipcode);
        CREATE INDEX IF NOT EXISTS idx_violations_pwsid ON violations(pwsid);
        CREATE INDEX IF NOT EXISTS idx_pfas_pwsid ON pfas_results(pwsid);
        CREATE INDEX IF NOT EXISTS idx_water_systems_state ON water_systems(state_code);
    """)
    conn.commit()


def load_contaminant_codes(conn: sqlite3.Connection):
    """Load contaminant code to name mapping."""
    print("Loading contaminant codes...")
    ref_file = DATA_DIR / "sdwa" / "SDWA_REF_CODE_VALUES.csv"
    if not ref_file.exists():
        print(f"  Warning: {ref_file} not found, skipping")
        return

    count = 0
    with open(ref_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('VALUE_TYPE') == 'CONTAMINANT_CODE':
                code = row.get('VALUE_CODE', '').strip('"')
                name = row.get('VALUE_DESCRIPTION', '').strip('"')
                if code and name:
                    conn.execute(
                        "INSERT OR REPLACE INTO contaminant_codes (code, name) VALUES (?, ?)",
                        (code, name)
                    )
                    count += 1
    conn.commit()
    print(f"  Loaded {count} contaminant codes")


def load_contaminant_reference(conn: sqlite3.Connection):
    """Load contaminant health reference data."""
    print("Loading contaminant reference...")
    ref_file = PROCESSED_DIR / "contaminant_reference.csv"
    if not ref_file.exists():
        print(f"  Warning: {ref_file} not found, skipping")
        return

    count = 0
    with open(ref_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            conn.execute("""
                INSERT OR REPLACE INTO contaminant_reference
                (chemical_name, category, ca_mcl, ca_mcl_unit, federal_mcl, federal_mcl_unit, health_effects, sources)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row.get('chemical_name', ''),
                row.get('category', ''),
                row.get('ca_mcl', ''),
                row.get('ca_mcl_unit', ''),
                row.get('federal_mcl', ''),
                row.get('federal_mcl_unit', ''),
                row.get('health_effects', ''),
                row.get('sources', ''),
            ))
            count += 1
    conn.commit()
    print(f"  Loaded {count} contaminant references")


def load_water_systems(conn: sqlite3.Connection):
    """Load water systems from national ZIP file."""
    print("Loading water systems...")
    zip_path = DATA_DIR / "sdwa_national.zip"

    if not zip_path.exists():
        # Fallback to extracted file if available
        csv_path = DATA_DIR / "sdwa" / "SDWA_PUB_WATER_SYSTEMS.csv"
        if csv_path.exists():
            print(f"  Using extracted file: {csv_path}")
            with open(csv_path, 'r', encoding='utf-8') as f:
                _load_water_systems_from_file(conn, f)
            return
        print(f"  Error: {zip_path} not found")
        return

    with zipfile.ZipFile(zip_path, 'r') as zf:
        with zf.open('SDWA_PUB_WATER_SYSTEMS.csv') as f:
            text_file = io.TextIOWrapper(f, encoding='utf-8')
            _load_water_systems_from_file(conn, text_file)


def _load_water_systems_from_file(conn: sqlite3.Connection, f):
    """Helper to load water systems from a file object."""
    reader = csv.DictReader(f)
    batch = []
    count = 0

    for row in reader:
        pwsid = row.get('PWSID', '').strip().strip('"')
        if not pwsid:
            continue

        state_code = row.get('STATE_CODE', '').strip().strip('"')
        if not state_code:
            state_code = pwsid[:2] if len(pwsid) >= 2 else ''

        pop_str = row.get('POPULATION_SERVED_COUNT', '').strip().strip('"')
        conn_str = row.get('SERVICE_CONNECTIONS_COUNT', '').strip().strip('"')

        batch.append((
            pwsid,
            row.get('PWS_NAME', '').strip().strip('"'),
            state_code,
            row.get('PRIMACY_AGENCY_CODE', '').strip().strip('"'),
            row.get('EPA_REGION', '').strip().strip('"'),
            row.get('PWS_TYPE_CODE', '').strip().strip('"'),
            row.get('OWNER_TYPE_CODE', '').strip().strip('"'),
            int(pop_str) if pop_str.isdigit() else None,
            int(conn_str) if conn_str.isdigit() else None,
            row.get('PRIMARY_SOURCE_CODE', '').strip().strip('"'),
            row.get('CITY_NAME', '').strip().strip('"'),
            row.get('ZIP_CODE', '').strip().strip('"'),
            row.get('PWS_ACTIVITY_CODE', '').strip().strip('"'),
        ))
        count += 1

        if len(batch) >= BATCH_SIZE:
            conn.executemany("""
                INSERT OR REPLACE INTO water_systems
                (pwsid, name, state_code, primacy_agency_code, epa_region, pws_type_code,
                 owner_type_code, population_served, service_connections, primary_source_code,
                 city_name, zip_code, pws_activity_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, batch)
            batch = []
            print(f"  Loaded {count} water systems...", end='\r')

    if batch:
        conn.executemany("""
            INSERT OR REPLACE INTO water_systems
            (pwsid, name, state_code, primacy_agency_code, epa_region, pws_type_code,
             owner_type_code, population_served, service_connections, primary_source_code,
             city_name, zip_code, pws_activity_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, batch)

    conn.commit()
    print(f"  Loaded {count} water systems")


def load_zip_mapping(conn: sqlite3.Connection):
    """Load ZIP code to PWSID mapping from UCMR5."""
    print("Loading ZIP code mapping...")
    zip_file = DATA_DIR / "ucmr5" / "UCMR5_ZIPCodes.txt"

    if not zip_file.exists():
        print(f"  Warning: {zip_file} not found, skipping")
        return

    count = 0
    with open(zip_file, 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        batch = []

        for row in reader:
            pwsid = row.get('PWSID', '').strip()
            zipcode = row.get('ZIPCODE', '').strip()

            if pwsid and zipcode:
                batch.append((zipcode, pwsid))
                count += 1

                if len(batch) >= BATCH_SIZE:
                    conn.executemany(
                        "INSERT OR IGNORE INTO zip_to_pwsid (zipcode, pwsid) VALUES (?, ?)",
                        batch
                    )
                    batch = []

        if batch:
            conn.executemany(
                "INSERT OR IGNORE INTO zip_to_pwsid (zipcode, pwsid) VALUES (?, ?)",
                batch
            )

    conn.commit()
    print(f"  Loaded {count} ZIP code mappings")


def load_violations(conn: sqlite3.Connection):
    """Load violations from national ZIP file (streaming, filtered, deduplicated)."""
    print("Loading violations (this may take 10-15 minutes)...")
    zip_path = DATA_DIR / "sdwa_national.zip"

    if not zip_path.exists():
        # Fallback to CA-only file
        ca_file = DATA_DIR / "sdwa" / "CA_violations.csv"
        if ca_file.exists():
            print(f"  Using CA-only file: {ca_file}")
            _load_violations_from_ca_file(conn, ca_file)
            return
        print(f"  Error: {zip_path} not found")
        return

    cutoff_date = datetime.now() - timedelta(days=VIOLATION_CUTOFF_YEARS * 365)
    seen_violations = set()
    batch = []
    count = 0
    skipped_old = 0
    skipped_dup = 0

    with zipfile.ZipFile(zip_path, 'r') as zf:
        with zf.open('SDWA_VIOLATIONS_ENFORCEMENT.csv') as f:
            text_file = io.TextIOWrapper(f, encoding='utf-8', errors='replace')
            reader = csv.DictReader(text_file)

            for row in reader:
                violation_id = row.get('VIOLATION_ID', '').strip().strip('"')
                if not violation_id:
                    continue

                pwsid = row.get('PWSID', '').strip().strip('"')

                # Deduplicate by (pwsid, violation_id)
                key = (pwsid, violation_id)
                if key in seen_violations:
                    skipped_dup += 1
                    continue
                seen_violations.add(key)

                # Date filter
                begin_date_str = row.get('COMPL_PER_BEGIN_DATE', '').strip().strip('"')
                if begin_date_str:
                    try:
                        begin_date = datetime.strptime(begin_date_str, '%m/%d/%Y')
                        if begin_date < cutoff_date:
                            skipped_old += 1
                            continue
                    except ValueError:
                        pass

                batch.append((
                    pwsid,
                    violation_id,
                    row.get('FACILITY_ID', '').strip().strip('"') or None,
                    begin_date_str,
                    row.get('COMPL_PER_END_DATE', '').strip().strip('"'),
                    row.get('VIOLATION_CODE', '').strip().strip('"'),
                    row.get('VIOLATION_CATEGORY_CODE', '').strip().strip('"'),
                    1 if row.get('IS_HEALTH_BASED_IND', '').strip().strip('"') == 'Y' else 0,
                    row.get('CONTAMINANT_CODE', '').strip().strip('"'),
                    _parse_float(row.get('VIOL_MEASURE', '')),
                    row.get('UNIT_OF_MEASURE', '').strip().strip('"'),
                    row.get('FEDERAL_MCL', '').strip().strip('"'),
                    row.get('STATE_MCL', '').strip().strip('"'),
                    1 if row.get('IS_MAJOR_VIOL_IND', '').strip().strip('"') == 'Y' else 0,
                    row.get('VIOLATION_STATUS', '').strip().strip('"'),
                    row.get('RULE_CODE', '').strip().strip('"'),
                    row.get('RULE_FAMILY_CODE', '').strip().strip('"'),
                ))
                count += 1

                if len(batch) >= BATCH_SIZE:
                    _insert_violations_batch(conn, batch)
                    batch = []
                    print(f"  Loaded {count} violations (skipped {skipped_old} old, {skipped_dup} dups)...", end='\r')

            if batch:
                _insert_violations_batch(conn, batch)

    conn.commit()
    print(f"  Loaded {count} violations (skipped {skipped_old} old, {skipped_dup} duplicates)")


def _load_violations_from_ca_file(conn: sqlite3.Connection, filepath: Path):
    """Fallback: Load violations from CA-only file."""
    header_file = filepath.parent / "CA_violations_header.csv"

    with open(header_file, 'r') as f:
        header = f.read().strip().replace('"', '').split(',')

    cutoff_date = datetime.now() - timedelta(days=VIOLATION_CUTOFF_YEARS * 365)
    batch = []
    count = 0

    with open(filepath, 'r') as f:
        for line in f:
            values = line.strip().split(',')
            row = dict(zip(header, [v.strip('"') for v in values]))

            violation_id = row.get('VIOLATION_ID', '')
            if not violation_id:
                continue

            begin_date_str = row.get('COMPL_PER_BEGIN_DATE', '')
            if begin_date_str:
                try:
                    begin_date = datetime.strptime(begin_date_str, '%m/%d/%Y')
                    if begin_date < cutoff_date:
                        continue
                except ValueError:
                    pass

            batch.append((
                row.get('PWSID', ''),
                violation_id,
                row.get('FACILITY_ID', '') or None,
                begin_date_str,
                row.get('COMPL_PER_END_DATE', ''),
                row.get('VIOLATION_CODE', ''),
                row.get('VIOLATION_CATEGORY_CODE', ''),
                1 if row.get('IS_HEALTH_BASED_IND', '') == 'Y' else 0,
                row.get('CONTAMINANT_CODE', ''),
                _parse_float(row.get('VIOL_MEASURE', '')),
                row.get('UNIT_OF_MEASURE', ''),
                row.get('FEDERAL_MCL', ''),
                row.get('STATE_MCL', ''),
                1 if row.get('IS_MAJOR_VIOL_IND', '') == 'Y' else 0,
                row.get('VIOLATION_STATUS', ''),
                row.get('RULE_CODE', ''),
                row.get('RULE_FAMILY_CODE', ''),
            ))
            count += 1

            if len(batch) >= BATCH_SIZE:
                _insert_violations_batch(conn, batch)
                batch = []

        if batch:
            _insert_violations_batch(conn, batch)

    conn.commit()
    print(f"  Loaded {count} violations (CA only)")


def _insert_violations_batch(conn: sqlite3.Connection, batch: list):
    """Insert a batch of violations."""
    conn.executemany("""
        INSERT INTO violations
        (pwsid, violation_id, facility_id, compl_per_begin_date, compl_per_end_date,
         violation_code, violation_category_code, is_health_based, contaminant_code,
         viol_measure, unit_of_measure, federal_mcl, state_mcl, is_major_viol,
         violation_status, rule_code, rule_family_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, batch)


def load_pfas_results(conn: sqlite3.Connection):
    """Load PFAS results from UCMR5 files."""
    print("Loading PFAS results...")
    ucmr5_files = [
        DATA_DIR / "ucmr5" / "UCMR5_All_Tribes_AK_LA.txt",
        DATA_DIR / "ucmr5" / "UCMR5_All_MA_WY.txt",
    ]

    total_count = 0

    for filepath in ucmr5_files:
        if not filepath.exists():
            print(f"  Warning: {filepath} not found, skipping")
            continue

        print(f"  Processing {filepath.name}...")
        batch = []
        count = 0

        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f, delimiter='\t')

            for row in reader:
                pwsid = row.get('PWSID', '').strip()
                state_code = pwsid[:2] if len(pwsid) >= 2 else ''

                sign = row.get('AnalyticalResultsSign', '').strip()
                value = _parse_float(row.get('AnalyticalResultValue', ''))
                detected = 1 if sign != '<' and value and value > 0 else 0

                batch.append((
                    pwsid,
                    row.get('FacilityID', '').strip(),
                    row.get('FacilityName', '').strip(),
                    row.get('FacilityWaterType', '').strip(),
                    row.get('SamplePointID', '').strip(),
                    row.get('CollectionDate', '').strip(),
                    row.get('SampleID', '').strip(),
                    row.get('Contaminant', '').strip(),
                    _parse_float(row.get('MRL', '')),
                    row.get('Units', '').strip(),
                    sign,
                    value,
                    detected,
                    state_code,
                ))
                count += 1

                if len(batch) >= BATCH_SIZE:
                    _insert_pfas_batch(conn, batch)
                    batch = []
                    print(f"    Loaded {count} PFAS results...", end='\r')

            if batch:
                _insert_pfas_batch(conn, batch)

        conn.commit()
        total_count += count
        print(f"    Loaded {count} PFAS results from {filepath.name}")

    print(f"  Total: {total_count} PFAS results")


def _insert_pfas_batch(conn: sqlite3.Connection, batch: list):
    """Insert a batch of PFAS results."""
    conn.executemany("""
        INSERT INTO pfas_results
        (pwsid, facility_id, facility_name, facility_water_type, sample_point_id,
         collection_date, sample_id, contaminant, mrl, units,
         analytical_result_sign, analytical_result_value, detected, state_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, batch)


def _parse_float(value: str) -> float:
    """Safely parse a float value."""
    if not value:
        return None
    value = value.strip().strip('"')
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def update_metadata(conn: sqlite3.Connection):
    """Update metadata table with build info."""
    conn.execute("""
        INSERT OR REPLACE INTO metadata (key, value, updated_at)
        VALUES ('build_date', ?, datetime('now'))
    """, (datetime.now().isoformat(),))

    # Get counts
    for table in ['water_systems', 'zip_to_pwsid', 'violations', 'pfas_results']:
        cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        conn.execute("""
            INSERT OR REPLACE INTO metadata (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        """, (f'{table}_count', str(count)))

    conn.commit()


def main():
    parser = argparse.ArgumentParser(description='Build water quality database')
    parser.add_argument('--force', action='store_true', help='Rebuild even if exists')
    args = parser.parse_args()

    # Check if database exists
    if DB_PATH.exists() and not args.force:
        print(f"Database already exists at {DB_PATH}")
        print("Use --force to rebuild")
        sys.exit(0)

    print(f"Building database at {TEMP_DB_PATH}...")
    start_time = datetime.now()

    # Remove temp file if exists
    if TEMP_DB_PATH.exists():
        TEMP_DB_PATH.unlink()

    # Create connection
    conn = sqlite3.connect(TEMP_DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")

    try:
        # Build database
        create_schema(conn)
        load_contaminant_codes(conn)
        load_contaminant_reference(conn)
        load_water_systems(conn)
        load_zip_mapping(conn)
        load_violations(conn)
        load_pfas_results(conn)
        create_indexes(conn)
        update_metadata(conn)

        # Vacuum to reclaim space
        print("Optimizing database...")
        conn.execute("VACUUM")
        conn.close()

        # Atomic rename
        if DB_PATH.exists():
            DB_PATH.unlink()
        TEMP_DB_PATH.rename(DB_PATH)

        elapsed = datetime.now() - start_time
        size_mb = DB_PATH.stat().st_size / (1024 * 1024)
        print(f"\nDatabase built successfully!")
        print(f"  Path: {DB_PATH}")
        print(f"  Size: {size_mb:.1f} MB")
        print(f"  Time: {elapsed}")

    except Exception as e:
        conn.close()
        if TEMP_DB_PATH.exists():
            TEMP_DB_PATH.unlink()
        print(f"\nError building database: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
