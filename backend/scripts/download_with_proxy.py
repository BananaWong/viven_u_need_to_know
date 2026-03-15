#!/usr/bin/env python3
"""
Download SDWA data using proxy
Proxy: localhost:10808
"""

import os
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

# Proxy settings
PROXY_HOST = "127.0.0.1"
PROXY_PORT = "10808"

# Data URL
SDWA_URL = "https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip"


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def download_with_proxy():
    """Download SDWA data using proxy."""

    # Setup proxy
    proxy_url = f"http://{PROXY_HOST}:{PROXY_PORT}"
    proxy = urllib.request.ProxyHandler({
        'http': proxy_url,
        'https': proxy_url
    })
    opener = urllib.request.build_opener(proxy)
    urllib.request.install_opener(opener)

    log(f"Using proxy: {proxy_url}")
    log(f"Downloading from: {SDWA_URL}")

    dest_path = RAW_DIR / "sdwa_national.zip"

    try:
        req = urllib.request.Request(
            SDWA_URL,
            headers={'User-Agent': 'Mozilla/5.0'}
        )

        with urllib.request.urlopen(req, timeout=300) as response:
            total_size = int(response.headers.get('Content-Length', 0))
            downloaded = 0

            log(f"File size: {total_size / (1024*1024):.1f} MB")

            with open(dest_path, 'wb') as f:
                while True:
                    chunk = response.read(1024 * 1024)  # 1MB chunks
                    if not chunk:
                        break

                    f.write(chunk)
                    downloaded += len(chunk)

                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        speed_mb = (downloaded / (1024*1024))
                        print(f"\r  Progress: {progress:.1f}% ({speed_mb:.1f} MB)", end='', flush=True)

        print()  # New line
        log(f"Download complete: {dest_path.stat().st_size / (1024*1024):.1f} MB")
        return True

    except Exception as e:
        print()
        log(f"Download failed: {e}")
        return False


def extract_data(zip_path):
    """Extract SDWA data."""
    log("Extracting data...")

    try:
        SDWA_DIR.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(SDWA_DIR)

        log(f"Extracted to: {SDWA_DIR}")
        return True

    except Exception as e:
        log(f"Extraction failed: {e}")
        return False


def main():
    print("=" * 70)
    log("SDWA Data Download (with Proxy)")
    print("=" * 70)

    # Create directories
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Download
    zip_path = RAW_DIR / "sdwa_national.zip"

    if not download_with_proxy():
        log("ERROR: Download failed")
        return 1

    # Extract
    if not extract_data(zip_path):
        log("ERROR: Extraction failed")
        return 1

    print("=" * 70)
    log("Download and extraction complete!")
    print("=" * 70)
    log("")
    log("Next step: Rebuild database")
    log("  python scripts/build_database.py --force")

    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
