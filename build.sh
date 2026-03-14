#!/usr/bin/env bash
# build.sh — Automated build script for viven-app
# Usage: ./build.sh [--deploy]
#   --deploy   Copy dist/ to the deployment target after a successful build

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
LOG_FILE="$PROJECT_DIR/build.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "========================================"
log "Build started at $TIMESTAMP"
log "Project: $PROJECT_DIR"
log "========================================"

# ── 1. Check required tools ───────────────────────────────────────────────────
for cmd in node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    log "ERROR: '$cmd' is not installed or not in PATH."
    exit 1
  fi
done
log "Node $(node -v)  |  npm $(npm -v)"

# ── 2. Install / update dependencies ─────────────────────────────────────────
log "Installing dependencies..."
npm ci --silent
log "Dependencies ready."

# ── 3. Lint (non-blocking — warnings shown but build continues) ───────────────
log "Running linter..."
if npm run lint -- --max-warnings=0 2>&1 | tee -a "$LOG_FILE"; then
  log "Lint passed."
else
  log "Lint warnings detected — continuing build."
fi

# ── 4. Build ──────────────────────────────────────────────────────────────────
log "Building production bundle..."
npm run build 2>&1 | tee -a "$LOG_FILE"
log "Build complete. Output: $DIST_DIR"

# ── 5. Report bundle sizes ────────────────────────────────────────────────────
log "Bundle sizes:"
du -sh "$DIST_DIR"/* 2>/dev/null | while read -r line; do log "  $line"; done

# ── 6. Optional deploy step ──────────────────────────────────────────────────
if [[ "${1:-}" == "--deploy" ]]; then
  # Set DEPLOY_TARGET to your server path or rsync destination, e.g.:
  #   export DEPLOY_TARGET="user@server:/var/www/html"
  #   export DEPLOY_TARGET="/mnt/webserver/public"
  DEPLOY_TARGET="${DEPLOY_TARGET:-}"
  if [[ -z "$DEPLOY_TARGET" ]]; then
    log "ERROR: --deploy flag used but DEPLOY_TARGET env var is not set."
    exit 1
  fi
  log "Deploying to $DEPLOY_TARGET ..."
  rsync -avz --delete "$DIST_DIR/" "$DEPLOY_TARGET/"
  log "Deploy complete."
fi

log "========================================"
log "All done."
log "========================================"
