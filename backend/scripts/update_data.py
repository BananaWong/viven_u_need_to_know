#!/usr/bin/env python3
"""
Water Quality Data Auto-Update Script

Updates UCMR5 (PFAS) and SDWA (violations) data from EPA sources.
Run quarterly: January, April, July, October

Usage:
    python scripts/update_data.py [--force] [--skip-backup]
"""

import argparse
import os
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from datetime import datetime, timedelta
from pathlib import Path


# Configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
UCMR5_DIR = RAW_DIR / "ucmr5"
SDWA_DIR = RAW_DIR / "sdwa"
DB_PATH = DATA_DIR / "water_quality.db"
BACKUP_DIR = DATA_DIR / "backups"
LOG_FILE = DATA_DIR / "update.log"

# EPA Data URLs (as of 2026-02-12)
# UCMR5 occurrence data is distributed as ZIP files
UCMR5_ZIP_URL = "https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data.zip"
UCMR5_STATE_ZIP_URL = "https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data-by-state.zip"

# SDWA violations data
SDWA_ZIP_URL = "https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip"


def log(message):
    """Log message to console and file."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_message = f"[{timestamp}] {message}"

    # Print with error handling for Windows console encoding
    try:
        print(log_message)
    except UnicodeEncodeError:
        print(log_message.encode('gbk', errors='replace').decode('gbk'))

    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_message + '\n')


def download_file(url, dest_path, description="file"):
    """Download a file from URL to destination."""
    try:
        log(f"  Downloading {description}...")

        # Set user agent to avoid 403 errors
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )

        with urllib.request.urlopen(req, timeout=60) as response:
            with open(dest_path, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)

        file_size = dest_path.stat().st_size / (1024 * 1024)  # MB
        log(f"  ✓ Downloaded {description} ({file_size:.1f} MB)")
        return True

    except Exception as e:
        log(f"  ✗ Failed to download {description}: {e}")
        return False


def backup_database():
    """Backup existing database."""
    if not DB_PATH.exists():
        log("No existing database to backup")
        return None

    backup_name = f"water_quality_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    backup_path = BACKUP_DIR / backup_name

    log(f"Backing up existing database to: {backup_name}")
    shutil.copy2(DB_PATH, backup_path)

    # Keep only last 5 backups
    backups = sorted(BACKUP_DIR.glob("water_quality_*.db"), key=os.path.getmtime, reverse=True)
    for old_backup in backups[5:]:
        old_backup.unlink()
        log(f"  Removed old backup: {old_backup.name}")

    return backup_path


def download_ucmr5_data():
    """Download UCMR5 (PFAS) data files."""
    log("Downloading UCMR5 (PFAS) data...")

    # Download by-state version (smaller, easier to process)
    zip_path = RAW_DIR / "ucmr5_data.zip"

    if download_file(UCMR5_STATE_ZIP_URL, zip_path, "UCMR5 occurrence data (by state)"):
        log("  Extracting UCMR5 data...")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Extract only needed files
                for member in zip_ref.namelist():
                    # Look for main data files and ZIP code mapping
                    if any(x in member.upper() for x in ['_AL_', '_AK_', '_CA_', '_LA_', '_MA_', '_WY_', 'ZIP']):
                        zip_ref.extract(member, UCMR5_DIR)

            log("  [OK] Extracted successfully")

            # Organize extracted files
            for txt_file in UCMR5_DIR.rglob('*.txt'):
                if txt_file.parent != UCMR5_DIR:
                    shutil.move(str(txt_file), UCMR5_DIR / txt_file.name)

            return True
        except Exception as e:
            log(f"  [WARN] Extraction failed: {e}")
            return False
    else:
        log("  [WARN] Using existing UCMR5 data")
        return False


def download_sdwa_data():
    """Download SDWA violations data."""
    log("Downloading SDWA violations data...")

    zip_path = RAW_DIR / "sdwa_national.zip"

    if download_file(SDWA_ZIP_URL, zip_path, "SDWA national dataset"):
        log("  Extracting SDWA data...")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(SDWA_DIR)
            log("  ✓ Extracted successfully")
            return True
        except Exception as e:
            log(f"  ✗ Extraction failed: {e}")
            return False
    else:
        if zip_path.exists():
            log("  ⚠ Using existing SDWA data")
            return True
        else:
            log("  ✗ WARNING: No SDWA data available")
            return False


def rebuild_database(force=False):
    """Rebuild the water quality database."""
    log("Rebuilding database...")

    build_script = BASE_DIR / "scripts" / "build_database.py"

    cmd = [sys.executable, str(build_script)]
    if force:
        cmd.append('--force')

    try:
        result = subprocess.run(
            cmd,
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            timeout=1800  # 30 minutes max
        )

        # Print build output
        if result.stdout:
            for line in result.stdout.splitlines():
                log(f"  {line}")

        if result.returncode != 0:
            log(f"✗ Database rebuild failed with code {result.returncode}")
            if result.stderr:
                log(f"  Error: {result.stderr}")
            return False

        log("✓ Database rebuilt successfully")
        return True

    except subprocess.TimeoutExpired:
        log("✗ Database rebuild timed out after 30 minutes")
        return False
    except Exception as e:
        log(f"✗ Database rebuild failed: {e}")
        return False


def verify_database():
    """Verify the rebuilt database."""
    if not DB_PATH.exists():
        log("✗ Database file not found!")
        return False

    db_size = DB_PATH.stat().st_size / (1024 * 1024)  # MB
    log(f"New database size: {db_size:.1f} MB")

    # Test database query
    try:
        import sqlite3

        log("Database statistics:")
        conn = sqlite3.connect(DB_PATH)

        cursor = conn.execute("SELECT COUNT(*) FROM water_systems")
        log(f"  Water systems: {cursor.fetchone()[0]:,}")

        cursor = conn.execute("SELECT COUNT(DISTINCT zipcode) FROM zip_to_pwsid")
        log(f"  ZIP codes: {cursor.fetchone()[0]:,}")

        cursor = conn.execute("SELECT COUNT(*) FROM violations")
        log(f"  Violations: {cursor.fetchone()[0]:,}")

        cursor = conn.execute("SELECT COUNT(*) FROM pfas_results")
        log(f"  PFAS results: {cursor.fetchone()[0]:,}")

        # Test query
        cursor = conn.execute("""
            SELECT ws.name
            FROM water_systems ws
            JOIN zip_to_pwsid zp ON ws.pwsid = zp.pwsid
            WHERE zp.zipcode = '90210'
            LIMIT 1
        """)
        result = cursor.fetchone()

        conn.close()

        if result:
            log(f"✓ Test query successful: Found system '{result[0]}' for ZIP 90210")
            return True
        else:
            log("⚠ Test query returned no results")
            return False

    except Exception as e:
        log(f"✗ Database verification failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Update water quality data from EPA sources'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force rebuild even if database exists'
    )
    parser.add_argument(
        '--skip-backup',
        action='store_true',
        help='Skip database backup'
    )
    parser.add_argument(
        '--download-only',
        action='store_true',
        help='Download data but do not rebuild database'
    )

    args = parser.parse_args()

    # Create directories
    UCMR5_DIR.mkdir(parents=True, exist_ok=True)
    SDWA_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    log("=" * 60)
    log("Starting Water Quality Data Update")
    log("=" * 60)

    # Backup
    if not args.skip_backup:
        backup_database()

    # Download data
    ucmr5_success = download_ucmr5_data()
    sdwa_success = download_sdwa_data()

    # Verify downloads
    log("Verifying downloaded data...")
    ucmr5_size = sum(f.stat().st_size for f in UCMR5_DIR.glob('*.txt')) / (1024 * 1024)
    log(f"  UCMR5 data: {ucmr5_size:.1f} MB")

    if SDWA_DIR.exists():
        sdwa_size = sum(f.stat().st_size for f in SDWA_DIR.rglob('*') if f.is_file()) / (1024 * 1024)
        log(f"  SDWA data: {sdwa_size:.1f} MB")

    if args.download_only:
        log("Download complete (--download-only specified)")
        return 0

    # Rebuild database
    if not rebuild_database(force=args.force):
        log("=" * 60)
        log("Update FAILED - database rebuild failed")
        log("=" * 60)
        return 1

    # Verify
    if not verify_database():
        log("=" * 60)
        log("Update COMPLETED with warnings")
        log("=" * 60)
        return 1

    # Success
    log("=" * 60)
    log("Update completed successfully!")
    log("=" * 60)
    log(f"Database: {DB_PATH} ({DB_PATH.stat().st_size / (1024*1024):.1f} MB)")
    log(f"Backup: {BACKUP_DIR}")
    log(f"Log: {LOG_FILE}")
    log("")

    next_update = datetime.now() + timedelta(days=90)
    log(f"Next update recommended: {next_update.strftime('%Y-%m-%d')}")

    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("\nUpdate cancelled by user")
        sys.exit(1)
    except Exception as e:
        log(f"\nFATAL ERROR: {e}")
        import traceback
        log(traceback.format_exc())
        sys.exit(1)
