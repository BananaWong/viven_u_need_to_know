#!/bin/bash
# Quarterly auto-update: refresh EPA data → regenerate JSON reports
# Cron: 0 2 1 1,4,7,10 * /var/www/vivenwater/backend/update_and_generate.sh

set -e

BACKEND_DIR="/var/www/vivenwater/backend"
CA_WATER_DIR="/var/www/vivenwater/ca-water-quality"
REPORTS_DIR="/var/www/vivenwater/reports"
LOG_FILE="/var/log/vivenwater/update.log"
PYTHON="python3"

mkdir -p "$(dirname $LOG_FILE)"
exec >> "$LOG_FILE" 2>&1

echo ""
echo "========================================"
echo "Update started: $(date)"
echo "========================================"

# Step 1: Download fresh EPA data + rebuild SQLite DB (~20 min)
echo "[1/3] Updating EPA database..."
cd "$CA_WATER_DIR"
$PYTHON scripts/quick_update.py

# Step 2: Generate new JSON files into a temp dir
echo "[2/3] Generating JSON reports..."
TEMP_REPORTS=$(mktemp -d)
$PYTHON "$BACKEND_DIR/generate.py" \
    --db "$CA_WATER_DIR/data/water_quality.db" \
    --out "$TEMP_REPORTS"

# Step 3: Swap temp dir → live dir (atomic-ish, Nginx keeps serving old files until swap)
echo "[3/3] Swapping reports..."
OLD_REPORTS="${REPORTS_DIR}_old"
rm -rf "$OLD_REPORTS"
mv "$REPORTS_DIR" "$OLD_REPORTS"
mv "$TEMP_REPORTS" "$REPORTS_DIR"
rm -rf "$OLD_REPORTS"

echo "Update complete: $(date)"
echo "========================================"
