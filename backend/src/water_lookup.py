#!/usr/bin/env python3
"""
National Water Quality Lookup Tool (SQLite-backed)

Provides ZIP code → water system → quality/violations/PFAS lookup
for all 50 US states.
"""

import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / "data" / "water_quality.db"
PROCESSED_DIR = BASE_DIR / "data" / "processed"


class WaterQualityLookup:
    """Main lookup class for national water quality data."""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None

        # Keep these for backward compatibility with app.py stats endpoint
        self.zip_to_pwsid: Dict[str, List[str]] = {}
        self.pwsid_to_system: Dict[str, dict] = {}
        self.contaminant_reference: Dict[str, dict] = {}
        self.contaminant_codes: Dict[str, str] = {}
        self._loaded = False

    def _get_conn(self) -> sqlite3.Connection:
        """Get database connection (lazy initialization)."""
        if self._conn is None:
            if not self.db_path.exists():
                raise FileNotFoundError(
                    f"Database not found at {self.db_path}. "
                    "Run: python scripts/build_database.py"
                )
            self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._conn.row_factory = sqlite3.Row
        return self._conn

    def load_data(self):
        """
        Load reference data.

        For backward compatibility with existing code that checks
        len(self.zip_to_pwsid) etc. We load counts from DB.
        """
        if self._loaded:
            return

        conn = self._get_conn()

        # Load ZIP counts (for stats endpoint)
        cursor = conn.execute("SELECT COUNT(DISTINCT zipcode) FROM zip_to_pwsid")
        zip_count = cursor.fetchone()[0]
        self.zip_to_pwsid = {str(i): [] for i in range(zip_count)}

        # Load system counts
        cursor = conn.execute("SELECT COUNT(*) FROM water_systems")
        system_count = cursor.fetchone()[0]
        self.pwsid_to_system = {str(i): {} for i in range(system_count)}

        # Load contaminant codes into memory (small, used frequently)
        cursor = conn.execute("SELECT code, name FROM contaminant_codes")
        self.contaminant_codes = {row['code']: row['name'] for row in cursor}

        # Load contaminant reference into memory (small)
        cursor = conn.execute("SELECT * FROM contaminant_reference")
        for row in cursor:
            name = row['chemical_name'].upper()
            self.contaminant_reference[name] = dict(row)

        self._loaded = True
        print(f"Loaded {zip_count} ZIP codes, {system_count} water systems")

    def lookup_zip(self, zipcode: str) -> dict:
        """
        Main lookup function: ZIP code → water system info.

        Returns dict with:
        - systems: List of water systems serving this ZIP
        - found: bool indicating if ZIP was found
        """
        self.load_data()
        conn = self._get_conn()

        zipcode = zipcode.strip()

        # Query water systems for this ZIP
        query = """
            SELECT ws.*
            FROM water_systems ws
            JOIN zip_to_pwsid zp ON ws.pwsid = zp.pwsid
            WHERE zp.zipcode = ?
        """
        cursor = conn.execute(query, (zipcode,))
        rows = cursor.fetchall()

        if not rows:
            return {
                'found': False,
                'zipcode': zipcode,
                'systems': [],
                'message': f'ZIP code {zipcode} not found in database. It may be served by a small system not in our database.'
            }

        systems = []
        for row in rows:
            systems.append({
                'pwsid': row['pwsid'],
                'name': row['name'] or 'Unknown',
                'county': '',  # County not in national data
                'city': row['city_name'] or '',
                'source_type': self._format_source_type(row['primary_source_code']),
                'population': str(row['population_served']) if row['population_served'] else 'Unknown',
                'connections': str(row['service_connections']) if row['service_connections'] else 'Unknown',
                'system_type': row['pws_type_code'] or '',
                'owner_type': row['owner_type_code'] or '',
            })

        return {
            'found': True,
            'zipcode': zipcode,
            'systems': systems,
            'system_count': len(systems)
        }

    def _format_source_type(self, code: str) -> str:
        """Convert source type code to readable text."""
        source_types = {
            'GW': 'Groundwater',
            'GWP': 'Purchased Groundwater',
            'SW': 'Surface Water',
            'SWP': 'Purchased Surface Water',
            'GU': 'Groundwater Under Influence of Surface Water',
        }
        return source_types.get(code, code or 'Unknown')

    def get_violations(self, pwsid: str, years: int = 5) -> Tuple[List[dict], int]:
        """
        Get violations for a water system from the last N years.

        Args:
            pwsid: Public Water System ID
            years: How many years back to look (default 5)

        Returns:
            Tuple of (recent violations list, historical count of older violations)
        """
        conn = self._get_conn()

        cutoff_date = datetime.now() - timedelta(days=years * 365)
        normalized_pwsid = pwsid.strip().replace(' ', '')

        # Query all violations for this system
        query = """
            SELECT * FROM violations
            WHERE REPLACE(pwsid, ' ', '') = ?
            ORDER BY compl_per_begin_date DESC
        """
        cursor = conn.execute(query, (normalized_pwsid,))

        violations = []
        historical_count = 0

        for row in cursor:
            begin_date_str = row['compl_per_begin_date']

            # Parse and check date
            is_recent = True
            if begin_date_str:
                try:
                    begin_date = datetime.strptime(begin_date_str, '%m/%d/%Y')
                    is_recent = begin_date >= cutoff_date
                except ValueError:
                    pass

            if not is_recent:
                historical_count += 1
                continue

            contaminant_code = row['contaminant_code']
            contaminant_name = self.contaminant_codes.get(contaminant_code, '')

            violations.append({
                'violation_id': row['violation_id'],
                'contaminant_code': contaminant_code,
                'contaminant_name': contaminant_name,
                'violation_code': row['violation_code'],
                'category': row['violation_category_code'],
                'is_health_based': bool(row['is_health_based']),
                'status': row['violation_status'] or '',
                'federal_mcl': row['federal_mcl'],
                'state_mcl': row['state_mcl'],
                'begin_date': begin_date_str,
                'end_date': row['compl_per_end_date'],
                'is_major': bool(row['is_major_viol']),
            })

        return violations, historical_count

    def get_pfas_results(self, pwsid: str) -> List[dict]:
        """
        Get PFAS testing results for a water system from UCMR5.

        Args:
            pwsid: Public Water System ID

        Returns:
            List of PFAS test results
        """
        conn = self._get_conn()

        normalized_pwsid = pwsid.strip().replace(' ', '')

        query = """
            SELECT * FROM pfas_results
            WHERE REPLACE(pwsid, ' ', '') = ?
            ORDER BY collection_date DESC
        """
        cursor = conn.execute(query, (normalized_pwsid,))

        results = []
        for row in cursor:
            results.append({
                'contaminant': row['contaminant'],
                'detected': bool(row['detected']),
                'result_sign': row['analytical_result_sign'] or '',
                'result_value': str(row['analytical_result_value']) if row['analytical_result_value'] else '',
                'mrl': str(row['mrl']) if row['mrl'] else '',
                'units': row['units'] or '',
                'sample_date': row['collection_date'] or '',
                'facility': row['facility_name'] or '',
                'water_type': row['facility_water_type'] or '',
            })

        return results

    def get_contaminant_info(self, chemical_name: str) -> Optional[dict]:
        """Get health/regulatory info for a contaminant."""
        self.load_data()

        name = chemical_name.upper().strip()

        # Try exact match first
        if name in self.contaminant_reference:
            return self.contaminant_reference[name]

        # Try partial match
        for ref_name, info in self.contaminant_reference.items():
            if name in ref_name or ref_name in name:
                return info

        return None

    def full_report(self, zipcode: str) -> dict:
        """
        Generate a complete water quality report for a ZIP code.

        Returns comprehensive dict with:
        - Source info
        - Water quality concerns
        - Violations
        - PFAS results
        - Recommendations
        """
        lookup = self.lookup_zip(zipcode)

        if not lookup['found']:
            return lookup

        report = {
            'zipcode': zipcode,
            'found': True,
            'systems': [],
            'generated_at': datetime.now().isoformat(),
        }

        for system in lookup['systems']:
            pwsid = system['pwsid']

            # Get violations
            violations, historical_count = self.get_violations(pwsid)
            health_violations = [v for v in violations if v['is_health_based']]
            open_violations = [v for v in violations if v['status'] != 'Resolved']

            # Get PFAS
            pfas = self.get_pfas_results(pwsid)
            pfas_detected = [p for p in pfas if p['detected']]

            # Get all test dates to find the range
            all_test_dates = [p['sample_date'] for p in pfas if p['sample_date']]
            detected_dates = [p['sample_date'] for p in pfas_detected if p['sample_date']]

            # Parse and sort dates to find most recent
            def parse_date(d):
                try:
                    parts = d.split('/')
                    return datetime(int(parts[2]), int(parts[0]), int(parts[1]))
                except:
                    return datetime.min

            sorted_all_dates = sorted(all_test_dates, key=parse_date, reverse=True)
            sorted_detected_dates = sorted(detected_dates, key=parse_date, reverse=True)

            most_recent_test = sorted_all_dates[0] if sorted_all_dates else None
            oldest_test = sorted_all_dates[-1] if sorted_all_dates else None
            most_recent_detection = sorted_detected_dates[0] if sorted_detected_dates else None

            # Group all PFAS results by date for display
            pfas_by_date = {}
            for p in pfas:
                date = p['sample_date'] or 'Unknown'
                if date not in pfas_by_date:
                    pfas_by_date[date] = {'date': date, 'total': 0, 'detected': 0, 'chemicals': []}
                pfas_by_date[date]['total'] += 1
                if p['detected']:
                    pfas_by_date[date]['detected'] += 1
                    pfas_by_date[date]['chemicals'].append(p['contaminant'])

            # Sort by date (most recent first)
            pfas_history = sorted(pfas_by_date.values(), key=lambda x: parse_date(x['date']), reverse=True)

            system_report = {
                **system,
                'violations': {
                    'total_5yr': len(violations),
                    'health_based': len(health_violations),
                    'open': len(open_violations),
                    'historical': historical_count,
                    'details': violations[:10],
                },
                'pfas': {
                    'total_samples': len(pfas),
                    'detected': len(pfas_detected),
                    'details': pfas_detected,
                    'all_results': pfas_history,
                    'most_recent_test': most_recent_test,
                    'oldest_test': oldest_test,
                    'most_recent_detection': most_recent_detection,
                },
                'risk_level': self._calculate_risk_level(violations, pfas_detected),
            }

            report['systems'].append(system_report)

        return report

    def _calculate_risk_level(self, violations: list, pfas_detected: list) -> str:
        """Calculate overall risk level based on data."""
        health_violations = [v for v in violations if v['is_health_based']]
        open_violations = [v for v in violations if v['status'] != 'Resolved']

        if len(open_violations) > 0 and any(v['is_health_based'] for v in open_violations):
            return 'HIGH'
        elif len(pfas_detected) > 2 or len(health_violations) > 5:
            return 'MODERATE'
        elif len(health_violations) > 0 or len(pfas_detected) > 0:
            return 'LOW'
        else:
            return 'MINIMAL'


def main():
    """Demo usage."""
    lookup = WaterQualityLookup()

    # Test with ZIP codes from different states
    test_zips = ['94579', '10001', '60601', '77001', '90210']

    for zipcode in test_zips:
        print(f"\n{'='*60}")
        print(f"Looking up ZIP: {zipcode}")
        print('='*60)

        result = lookup.lookup_zip(zipcode)

        if not result['found']:
            print(f"  Not found: {result['message']}")
            continue

        for system in result['systems']:
            print(f"\n  System: {system['name']}")
            print(f"  PWSID: {system['pwsid']}")
            print(f"  Source: {system['source_type']}")
            print(f"  City: {system['city']}")
            print(f"  Population: {system['population']}")

            # Get violations
            violations, historical = lookup.get_violations(system['pwsid'])
            print(f"  Violations (5yr): {len(violations)}, Historical: {historical}")

            # Get PFAS
            pfas = lookup.get_pfas_results(system['pwsid'])
            detected = [p for p in pfas if p['detected']]
            print(f"  PFAS samples: {len(pfas)}, Detected: {len(detected)}")


if __name__ == '__main__':
    main()
