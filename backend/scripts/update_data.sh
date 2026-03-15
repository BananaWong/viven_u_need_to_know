#!/bin/bash
#
# Water Quality Data Auto-Update Script
#
# Updates UCMR5 (PFAS) and SDWA (violations) data from EPA sources
# Run quarterly: January, April, July, October
#
# Usage:
#   ./scripts/update_data.sh [--force] [--skip-backup]
#

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$BASE_DIR/data"
RAW_DIR="$DATA_DIR/raw"
UCMR5_DIR="$RAW_DIR/ucmr5"
SDWA_DIR="$RAW_DIR/sdwa"
DB_PATH="$DATA_DIR/water_quality.db"
BACKUP_DIR="$DATA_DIR/backups"
LOG_FILE="$DATA_DIR/update.log"

# EPA Data URLs (as of 2026-02-12)
UCMR5_URL_BASE="https://www.epa.gov/system/files/other-files"
UCMR5_FILES=(
    "ucmr5_all_ma_wy.txt"
    "ucmr5_all_tribes_ak_la.txt"
    "ucmr5_zipcodes.txt"
)

# SDWA data from ECHO
SDWA_ZIP_URL="https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip"

# Parse arguments
FORCE=false
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--force] [--skip-backup]"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Create directories if they don't exist
mkdir -p "$UCMR5_DIR" "$SDWA_DIR" "$BACKUP_DIR"

log "========================================="
log "Starting Water Quality Data Update"
log "========================================="

# Step 1: Backup existing database
if [ -f "$DB_PATH" ] && [ "$SKIP_BACKUP" = false ]; then
    BACKUP_NAME="water_quality_$(date +%Y%m%d_%H%M%S).db"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    log "Backing up existing database to: $BACKUP_NAME"
    cp "$DB_PATH" "$BACKUP_PATH" || error_exit "Backup failed"

    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -t water_quality_*.db | tail -n +6 | xargs -r rm
    log "Kept last 5 backups, removed older ones"
fi

# Step 2: Download UCMR5 data
log "Downloading UCMR5 (PFAS) data..."
cd "$UCMR5_DIR"

# Note: EPA URLs change with each release. Try multiple sources.
for file in "${UCMR5_FILES[@]}"; do
    log "  Downloading $file..."

    # Try current date's release first
    if curl -f -L -o "$file.tmp" "$UCMR5_URL_BASE/2025-11/$file" 2>/dev/null; then
        mv "$file.tmp" "$file"
        log "  ✓ Downloaded from Nov 2025 release"
    elif curl -f -L -o "$file.tmp" "$UCMR5_URL_BASE/2025-10/$file" 2>/dev/null; then
        mv "$file.tmp" "$file"
        log "  ✓ Downloaded from Oct 2025 release"
    elif [ -f "$file" ]; then
        log "  ⚠ Download failed, using existing file"
    else
        log "  ⚠ WARNING: Could not download $file and no existing file found"
    fi
done

# Download summary PDF (for documentation)
log "  Downloading data summary..."
curl -f -L -o "UCMR5_DataSummary_Latest.pdf" \
    "https://www.epa.gov/system/files/documents/2025-11/ucmr5-data-summary.pdf" 2>/dev/null || \
    log "  ⚠ Could not download summary PDF"

# Step 3: Download SDWA data
log "Downloading SDWA violations data..."
cd "$RAW_DIR"

# Download SDWA ZIP file
if curl -f -L -o "sdwa_national.zip.tmp" "$SDWA_ZIP_URL"; then
    mv "sdwa_national.zip.tmp" "sdwa_national.zip"
    log "  ✓ Downloaded SDWA national dataset"

    # Extract to sdwa directory
    log "  Extracting SDWA data..."
    unzip -o -q "sdwa_national.zip" -d "$SDWA_DIR/"
    log "  ✓ Extracted successfully"
else
    if [ -f "sdwa_national.zip" ]; then
        log "  ⚠ Download failed, using existing SDWA data"
    else
        log "  ⚠ WARNING: Could not download SDWA data and no existing file found"
    fi
fi

# Step 4: Verify downloads
log "Verifying downloaded data..."
UCMR5_SIZE=$(du -sh "$UCMR5_DIR" | cut -f1)
SDWA_SIZE=$(du -sh "$SDWA_DIR" | cut -f1)
log "  UCMR5 directory: $UCMR5_SIZE"
log "  SDWA directory: $SDWA_SIZE"

# Step 5: Rebuild database
log "Rebuilding database..."
cd "$BASE_DIR"

if [ "$FORCE" = true ]; then
    python3 scripts/build_database.py --force || error_exit "Database rebuild failed"
else
    python3 scripts/build_database.py || error_exit "Database rebuild failed"
fi

# Step 6: Verify new database
if [ ! -f "$DB_PATH" ]; then
    error_exit "Database file not created!"
fi

NEW_DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
log "New database size: $NEW_DB_SIZE"

# Get record counts
log "Database statistics:"
python3 << EOF
import sqlite3
conn = sqlite3.connect('$DB_PATH')
cursor = conn.execute("SELECT COUNT(*) FROM water_systems")
print(f"  Water systems: {cursor.fetchone()[0]:,}")
cursor = conn.execute("SELECT COUNT(DISTINCT zipcode) FROM zip_to_pwsid")
print(f"  ZIP codes: {cursor.fetchone()[0]:,}")
cursor = conn.execute("SELECT COUNT(*) FROM violations")
print(f"  Violations: {cursor.fetchone()[0]:,}")
cursor = conn.execute("SELECT COUNT(*) FROM pfas_results")
print(f"  PFAS results: {cursor.fetchone()[0]:,}")
conn.close()
EOF

# Step 7: Test database
log "Testing database query..."
python3 << 'EOF'
import sys
sys.path.insert(0, 'src')
from water_lookup import WaterQualityLookup

lookup = WaterQualityLookup()
result = lookup.lookup_zip('90210')
if result['found']:
    print(f"  ✓ Test query successful: Found {len(result['systems'])} systems for ZIP 90210")
else:
    print("  ⚠ WARNING: Test query found no results")
EOF

# Step 8: Update metadata
log "Recording update timestamp..."
python3 << EOF
import sqlite3
from datetime import datetime
conn = sqlite3.connect('$DB_PATH')
conn.execute("""
    INSERT OR REPLACE INTO metadata (key, value, updated_at)
    VALUES ('last_update', ?, datetime('now'))
""", (datetime.now().isoformat(),))
conn.commit()
conn.close()
EOF

log "========================================="
log "Update completed successfully!"
log "========================================="
log "Database: $DB_PATH ($NEW_DB_SIZE)"
log "Backup: $BACKUP_DIR"
log "Log: $LOG_FILE"
log ""
log "Next update recommended: $(date -d '+3 months' '+%Y-%m-%d' 2>/dev/null || date -v+3m '+%Y-%m-%d' 2>/dev/null || echo 'in 3 months')"
