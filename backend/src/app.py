#!/usr/bin/env python3
"""
US Water Quality API

A Flask REST API for looking up water quality by ZIP code.
Supports CORS for React frontend integration.
"""

import sys
from pathlib import Path
from datetime import datetime

# Add the src directory to path
sys.path.insert(0, str(Path(__file__).parent))

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from water_lookup import WaterQualityLookup

app = Flask(__name__, template_folder='templates', static_folder='static')

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",      # Create React App
            "http://localhost:5173",      # Vite
            "http://localhost:5174",      # Vite (alternate)
            "https://*.vercel.app",       # Vercel deployments
            "https://waterquality.com",   # Production domain
            "https://www.waterquality.com"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["X-Total-Count"],
        "supports_credentials": False,
        "max_age": 3600
    }
})

# Initialize the lookup engine (loads data once)
lookup = WaterQualityLookup()

# Version and metadata
API_VERSION = "2.0.0"
LAST_UPDATED = "2026-02-12"


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/api/lookup', methods=['GET', 'POST'])
def api_lookup():
    """
    Lookup water quality information by ZIP code.

    GET /api/lookup?zipcode=90210
    POST /api/lookup with JSON body: {"zipcode": "90210"}

    Returns:
        200: Success with water system data
        400: Invalid ZIP code
        500: Server error
    """
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            zipcode = data.get('zipcode', '')
        else:
            zipcode = request.args.get('zipcode', '')

        zipcode = zipcode.strip()

        # Validation
        if not zipcode:
            return jsonify({
                'error': 'ZIP code is required',
                'found': False
            }), 400

        if not zipcode.isdigit() or len(zipcode) != 5:
            return jsonify({
                'error': 'Invalid ZIP code format. Must be 5 digits.',
                'found': False
            }), 400

        # Perform the lookup
        result = lookup.full_report(zipcode)

        # Add metadata
        result['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        result['api_version'] = API_VERSION

        return jsonify(result), 200

    except Exception as e:
        app.logger.error(f"Error in lookup: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'found': False
        }), 500


@app.route('/api/contaminant/<name>')
def api_contaminant(name):
    """
    Get information about a specific contaminant.

    GET /api/contaminant/PFOA

    Returns:
        200: Contaminant information found
        404: Contaminant not found
    """
    try:
        info = lookup.get_contaminant_info(name)
        if info:
            return jsonify({
                'found': True,
                'contaminant': name,
                **info
            }), 200
        return jsonify({
            'found': False,
            'message': f'No information found for contaminant: {name}'
        }), 404
    except Exception as e:
        app.logger.error(f"Error in contaminant lookup: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'found': False
        }), 500


@app.route('/api/stats')
def api_stats():
    """
    Get database statistics.

    GET /api/stats

    Returns:
        200: Statistics data
    """
    try:
        lookup.load_data()
        return jsonify({
            'zip_codes': len(lookup.zip_to_pwsid),
            'water_systems': len(lookup.pwsid_to_system),
            'contaminants_reference': len(lookup.contaminant_reference),
            'last_updated': LAST_UPDATED,
            'api_version': API_VERSION
        }), 200
    except Exception as e:
        app.logger.error(f"Error in stats: {str(e)}")
        return jsonify({
            'error': 'Internal server error'
        }), 500


@app.route('/api/health')
def api_health():
    """
    Health check endpoint.

    GET /api/health

    Returns:
        200: Service is healthy
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': API_VERSION,
        'database': 'connected' if lookup._loaded else 'not_loaded'
    }), 200


@app.route('/api')
def api_info():
    """
    API information and documentation.

    GET /api

    Returns:
        200: API metadata
    """
    return jsonify({
        'name': 'US Water Quality API',
        'version': API_VERSION,
        'last_updated': LAST_UPDATED,
        'endpoints': {
            'lookup': '/api/lookup?zipcode={zipcode}',
            'contaminant': '/api/contaminant/{name}',
            'stats': '/api/stats',
            'health': '/api/health'
        },
        'documentation': 'https://github.com/your-repo/docs/API.md'
    }), 200


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({
        'error': 'Endpoint not found',
        'path': request.path
    }), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors."""
    app.logger.error(f"Internal error: {str(e)}")
    return jsonify({
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    print("=" * 60)
    print("US Water Quality API Server")
    print("=" * 60)
    print()
    print("Loading water quality data...")
    lookup.load_data()
    print(f"Ready! {len(lookup.zip_to_pwsid)} ZIP codes loaded.")
    print(f"Water systems: {len(lookup.pwsid_to_system):,}")
    print()
    print("API Server running at:")
    print(f"  - http://localhost:5001")
    print(f"  - http://127.0.0.1:5001")
    print()
    print("API Endpoints:")
    print(f"  GET  /api              - API information")
    print(f"  GET  /api/health       - Health check")
    print(f"  GET  /api/stats        - Database statistics")
    print(f"  GET  /api/lookup?zipcode=90210")
    print(f"  GET  /api/contaminant/PFOA")
    print()
    print("Press CTRL+C to stop")
    print("=" * 60)
    print()

    app.run(debug=True, host='0.0.0.0', port=5001)
