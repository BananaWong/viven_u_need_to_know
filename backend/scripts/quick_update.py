#!/usr/bin/env python3
"""
Quick Water Quality Data Update Script

Simplified version that:
1. Downloads the latest SDWA violations data
2. Rebuilds the database with existing UCMR5 data (which is already current)

UCMR5 data from Oct 2025 is already 89% complete - no need to update until Q1 2026
"""

import subprocess
import sys
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
SDWA_DIR = RAW_DIR / "sdwa"
DB_PATH = DATA_DIR / "water_quality.db"
BACKUP_DIR = DATA_DIR / "backups"

# SDWA violations data URL
SDWA_ZIP_URL = "https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip"


def log(message):
    """Print message with timestamp."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}", flush=True)


def main():
    print("=" * 70)
    log("Water Quality Database Quick Update")
    print("=" * 70)

    # Create directories
    SDWA_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Backup existing database
    if DB_PATH.exists():
        backup_name = f"water_quality_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        backup_path = BACKUP_DIR / backup_name
        log(f"Backing up database to: {backup_name}")

        import shutil
        shutil.copy2(DB_PATH, backup_path)

        # Keep only last 5 backups
        backups = sorted(BACKUP_DIR.glob("water_quality_*.db"),
                        key=lambda p: p.stat().st_mtime,
                        reverse=True)
        for old_backup in backups[5:]:
            old_backup.unlink()
            log(f"  Removed old backup: {old_backup.name}")

    # Step 2: Download SDWA data
    log("Downloading latest SDWA violations data...")
    sdwa_zip = RAW_DIR / "sdwa_national.zip"

    try:
        req = urllib.request.Request(
            SDWA_ZIP_URL,
            headers={'User-Agent': 'Mozilla/5.0'}
        )

        with urllib.request.urlopen(req, timeout=120) as response:
            total_size = int(response.headers.get('Content-Length', 0))
            downloaded = 0

            with open(sdwa_zip, 'wb') as f:
                while True:
                    chunk = response.read(1024 * 1024)  # 1MB chunks
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)

                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\r  Progress: {progress:.1f}% ({downloaded / (1024*1024):.1f} MB)", end='', flush=True)

        print()  # New line after progress
        log(f"[OK] Downloaded {sdwa_zip.stat().st_size / (1024*1024):.1f} MB")

    except Exception as e:
        log(f"[WARN] Download failed: {e}")
        if sdwa_zip.exists():
            log("  Using existing SDWA data")
        else:
            log("[ERROR] No SDWA data available!")
            return 1

    # Step 3: Extract SDWA data
    if sdwa_zip.exists():
        log("Extracting SDWA data...")
        try:
            with zipfile.ZipFile(sdwa_zip, 'r') as zip_ref:
                zip_ref.extractall(SDWA_DIR)
            log("[OK] Extracted successfully")
        except Exception as e:
            log(f"[ERROR] Extraction failed: {e}")
            return 1

    # Step 4: Rebuild database
    log("Rebuilding database (this may take 10-20 minutes)...")
    log("  - Loading water systems...")
    log("  - Loading violations (filtering last 10 years)...")
    log("  - Loading PFAS data (from existing UCMR5 files)...")

    build_script = BASE_DIR / "scripts" / "build_database.py"

    try:
        result = subprocess.run(
            [sys.executable, str(build_script), '--force'],
            cwd=BASE_DIR,
            capture_output=False,  # Show output in real-time
            timeout=1800  # 30 minutes max
        )

        if result.returncode != 0:
            log("[ERROR] Database rebuild failed!")
            return 1

    except subprocess.TimeoutExpired:
        log("[ERROR] Database rebuild timed out after 30 minutes")
        return 1
    except Exception as e:
        log(f"[ERROR] Database rebuild failed: {e}")
        return 1

    # Step 5: Verify
    if not DB_PATH.exists():
        log("[ERROR] Database file not created!")
        return 1

    db_size = DB_PATH.stat().st_size / (1024 * 1024)
    log(f"[OK] New database: {db_size:.1f} MB")

    # Test query
    try:
        import sqlite3
        conn = sqlite3.connect(DB_PATH)

        cursor = conn.execute("SELECT COUNT(*) FROM water_systems")
        systems = cursor.fetchone()[0]

        cursor = conn.execute("SELECT COUNT(DISTINCT zipcode) FROM zip_to_pwsid")
        zipcodes = cursor.fetchone()[0]

        cursor = conn.execute("SELECT COUNT(*) FROM violations")
        violations = cursor.fetchone()[0]

        cursor = conn.execute("SELECT COUNT(*) FROM pfas_results")
        pfas = cursor.fetchone()[0]

        conn.close()

        log("Database statistics:")
        log(f"  Water systems: {systems:,}")
        log(f"  ZIP codes: {zipcodes:,}")
        log(f"  Violations: {violations:,}")
        log(f"  PFAS results: {pfas:,}")

    except Exception as e:
        log(f"[WARN] Could not query database: {e}")

    print("=" * 70)
    log("Update completed successfully!")
    print("=" * 70)
    log(f"Database: {DB_PATH}")
    log(f"Backups: {BACKUP_DIR}")
    log("")
    log("Next update recommended: 2026-05-01 (quarterly)")

    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Update interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[FATAL] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
