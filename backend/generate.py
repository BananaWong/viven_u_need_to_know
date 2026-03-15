#!/usr/bin/env python3
"""
Viven Water — DataCheck JSON Generator

Reads the EPA water quality SQLite database and generates one JSON file
per ZIP code under ./reports/. These static files are served directly
by Nginx on the VPS — no runtime server needed.

Usage:
    python generate.py                        # uses default DB path
    python generate.py --db /path/to/db       # custom DB path
    python generate.py --out /path/to/reports # custom output dir
    python generate.py --zip 90210            # single ZIP (for testing)

Update schedule: run quarterly after quick_update.py rebuilds the DB.
"""

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
DEFAULT_DB  = SCRIPT_DIR / "data" / "water_quality.db"
DEFAULT_OUT = SCRIPT_DIR / "reports"

# ── EWG Standards ────────────────────────────────────────────────────────────

sys.path.insert(0, str(SCRIPT_DIR / "src"))
from ewg_standards import EWG_STANDARDS

# Normalised lookup: "PFOA" → standard dict
_EWG_INDEX = {k.upper(): v for k, v in EWG_STANDARDS.items()}

# UCMR5 name → EWG key aliases (handles spacing / abbreviation differences)
# Contaminants in the UCMR5 table that are NOT PFAS
NON_PFAS_UCMR5 = {"lithium"}

PFAS_ALIASES = {
    "PFOA":                          "PFOA",
    "PFOS":                          "PFOS",
    "PFNA":                          "PFNA",
    "PFBS":                          "PFBS",
    "PFDA":                          "PFDA",
    "PFHXS":                         "PFHXS",
    "PFHXA":                         "PFHXA",
    "PFHPA":                         "PFHPA",
    "PFPEA":                         "PFPEA",
    "PFUNA":                         "PFUNA",
    "PFTRDA":                        "PFTRDA",
    "PFDOA":                         "PFDOA",
    "PFTA":                          "PFTA",
    "PFDS":                          "PFDS",
    "PFHPS":                         "PFHPS",
    "PFOSA":                         "PFOSA",
    "PFBA":                          "PFBA",
    "HFPO-DA":                       "HFPO-DA",
    "GENX":                          "HFPO-DA",
    "PERFLUOROOCTANOIC ACID":        "PFOA",
    "PERFLUOROOCTANE SULFONIC ACID": "PFOS",
    "PERFLUORONONANOIC ACID":        "PFNA",
    "PERFLUOROBUTANE SULFONIC ACID": "PFBS",
    "PERFLUORODECANOIC ACID":        "PFDA",
    "PERFLUOROHEXANE SULFONATE":     "PFHXS",
    "PERFLUOROHEXANOIC ACID":        "PFHXA",
}


# Contaminant name → EWG key aliases (for violations + UCMR lookups)
VIOLATION_ALIASES = {
    "COMBINED RADIUM (-226 AND -228)":      "RADIUM-226",
    "COMBINED RADIUM":                      "RADIUM-226",
    "RADIUM, COMBINED (-226 & -228)":       "RADIUM-226",
    "GROSS ALPHA, EXCL. RADON AND U":       "RADIUM-226",
    "GROSS ALPHA PARTICLE ACTIVITY":        "RADIUM-226",
    "NITRITE":                              "NITRATE",
    "1,1-DICHLOROETHYLENE":                 "1,1-DICHLOROETHANE",
    "FLUORIDE":                             None,
    "TTHM":                                 "TOTAL TRIHALOMETHANES (TTHMS)",
    "TOTAL HALOACETIC ACIDS (HAA5)":        "HALOACETIC ACIDS (HAA5)",
    "CARBON, TOTAL":                        None,
    # UCMR3/4 name aliases
    "CHROMIUM-6":                           "CHROMIUM (HEXAVALENT)",
    "HEXAVALENT CHROMIUM":                  "CHROMIUM (HEXAVALENT)",
    "CHROMIUM":                             "CHROMIUM (HEXAVALENT)",  # total chromium → use Cr-6 guideline
    "HAA9":                                 "HALOACETIC ACIDS (HAA9)",
    "HAA6BR":                               "HALOACETIC ACIDS (HAA6BR)",
    "HCFC-22":                              None,  # no EWG guideline
    "BROMOMETHANE":                         None,
}


def ewg_lookup(name: str) -> dict | None:
    key = name.upper().strip()
    # Check PFAS aliases first
    alias = PFAS_ALIASES.get(key)
    if alias:
        return _EWG_INDEX.get(alias.upper())
    # Check violation aliases
    viol_alias = VIOLATION_ALIASES.get(key)
    if viol_alias is not None:
        return _EWG_INDEX.get(viol_alias.upper())
    if viol_alias is None and key in VIOLATION_ALIASES:
        return None  # explicitly no match
    # Direct lookup
    if key in _EWG_INDEX:
        return _EWG_INDEX[key]
    # Fuzzy: substring match
    for k, v in _EWG_INDEX.items():
        if key in k or k in key:
            return v
    return None


# ── Database helpers ──────────────────────────────────────────────────────────

def get_primary_system(conn: sqlite3.Connection, zipcode: str) -> dict | None:
    """Return the largest water system serving this ZIP (by population)."""
    row = conn.execute("""
        SELECT ws.pwsid, ws.name, ws.city_name, ws.state_code,
               ws.population_served, ws.service_connections,
               ws.primary_source_code, ws.pws_type_code
        FROM water_systems ws
        JOIN zip_to_pwsid zp ON ws.pwsid = zp.pwsid
        WHERE zp.zipcode = ?
          AND ws.pws_type_code = 'CWS'
        ORDER BY ws.population_served DESC NULLS LAST
        LIMIT 1
    """, (zipcode,)).fetchone()

    # Fallback: any system type if no CWS found
    if not row:
        row = conn.execute("""
            SELECT ws.pwsid, ws.name, ws.city_name, ws.state_code,
                   ws.population_served, ws.service_connections,
                   ws.primary_source_code, ws.pws_type_code
            FROM water_systems ws
            JOIN zip_to_pwsid zp ON ws.pwsid = zp.pwsid
            WHERE zp.zipcode = ?
            ORDER BY ws.population_served DESC NULLS LAST
            LIMIT 1
        """, (zipcode,)).fetchone()

    if not row:
        return None

    source_map = {
        "GW":  "Groundwater",
        "GWP": "Purchased Groundwater",
        "SW":  "Surface Water",
        "SWP": "Purchased Surface Water",
        "GU":  "Groundwater under surface water influence",
    }

    return {
        "pwsid":       row["pwsid"],
        "name":        row["name"] or "Unknown Water System",
        "city":        row["city_name"] or "",
        "state":       row["state_code"] or "",
        "population":  row["population_served"],
        "connections": row["service_connections"],
        "source_type": source_map.get(row["primary_source_code"] or "", "Unknown"),
    }


def get_health_violations(conn: sqlite3.Connection, pwsid: str, years: int = 5) -> list[dict]:
    """Health-based violations in last N years, date filtered in SQL."""
    cutoff = (datetime.now() - timedelta(days=years * 365)).strftime("%Y-%m-%d")
    rows = conn.execute("""
        SELECT contaminant_code, violation_code, violation_category_code,
               violation_status, federal_mcl, state_mcl,
               compl_per_begin_date, compl_per_end_date, is_major_viol,
               viol_measure, unit_of_measure
        FROM violations
        WHERE pwsid = ?
          AND is_health_based = 1
          AND (
            compl_per_begin_date IS NULL
            OR (
              LENGTH(compl_per_begin_date) = 10
              AND SUBSTR(compl_per_begin_date,7,4) || '-' ||
                  SUBSTR(compl_per_begin_date,1,2) || '-' ||
                  SUBSTR(compl_per_begin_date,4,2) >= ?
            )
          )
        ORDER BY compl_per_begin_date DESC
    """, (pwsid.strip(), cutoff)).fetchall()

    results = []
    for row in rows:
        code = row["contaminant_code"] or ""
        results.append({
            "contaminant_code": code,
            "status":           row["violation_status"] or "Unknown",
            "begin_date":       row["compl_per_begin_date"] or "",
            "end_date":         row["compl_per_end_date"] or "",
            "is_major":         bool(row["is_major_viol"]),
            "federal_mcl":      row["federal_mcl"],
            "viol_measure":     row["viol_measure"],
            "unit_of_measure":  row["unit_of_measure"],
        })
    return results


def get_contaminant_name(conn: sqlite3.Connection, code: str) -> str:
    row = conn.execute(
        "SELECT name FROM contaminant_codes WHERE code = ?", (code,)
    ).fetchone()
    return row["name"] if row else code


def get_pfas_results(conn: sqlite3.Connection, pwsid: str) -> list[dict]:
    """
    PFAS test results (detected, with numeric values).

    UCMR5 stores values in µg/L (= ppb). PFAS EWG standards are in ppt.
    1 ppb = 1000 ppt. We convert everything to ppt for PFAS compounds
    so comparisons against EWG standards are correct.
    """
    rows = conn.execute("""
        SELECT contaminant, analytical_result_sign,
               analytical_result_value, mrl, units, collection_date
        FROM pfas_results
        WHERE pwsid = ?
          AND detected = 1
          AND analytical_result_value IS NOT NULL
        ORDER BY analytical_result_value DESC
    """, (pwsid.strip(),)).fetchall()

    seen = set()
    results = []
    for row in rows:
        name = row["contaminant"] or ""
        # Skip non-PFAS contaminants (e.g. lithium) that are in the UCMR5 table
        if name.lower() in NON_PFAS_UCMR5:
            continue
        if name in seen:
            continue
        seen.add(name)

        raw_value = float(row["analytical_result_value"])

        # UCMR5 data is in µg/L (ppb). Convert to ppt for PFAS.
        # µg/L → ppb (1:1), ppb → ppt (×1000)
        value_ppt = raw_value * 1000.0

        results.append({
            "name":       name,
            "value":      round(value_ppt, 2),
            "unit":       "ppt",
            "sample_date": row["collection_date"] or "",
        })
    return results


def get_ucmr_results(conn: sqlite3.Connection, pwsid: str, table: str) -> list[dict]:
    """
    Get detected contaminant results from UCMR3 or UCMR4 tables.
    Values are in µg/L (= ppb). We keep them in ppb for non-PFAS contaminants
    since EWG standards for these are typically in ppb or ppm.
    """
    # Check if table exists
    exists = conn.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone()[0]
    if not exists:
        return []

    rows = conn.execute(f"""
        SELECT contaminant, analytical_result_value, units, collection_date
        FROM {table}
        WHERE pwsid = ?
          AND detected = 1
          AND analytical_result_value IS NOT NULL
        ORDER BY analytical_result_value DESC
    """, (pwsid.strip(),)).fetchall()

    seen = set()
    results = []
    for row in rows:
        name = row["contaminant"] or ""
        if name.lower() in ("lithium",):
            continue
        if name in seen:
            continue
        seen.add(name)

        raw_value = float(row["analytical_result_value"])
        # UCMR data is in µg/L = ppb
        results.append({
            "name":        name,
            "value":       round(raw_value, 4),
            "unit":        "ppb",
            "sample_date": row["collection_date"] or "",
        })
    return results


def get_lcr_results(conn: sqlite3.Connection, pwsid: str) -> dict | None:
    """
    Get Lead and Copper Rule 90th percentile results.
    Returns dict with lead and copper values, or None.
    """
    exists = conn.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='lcr_samples'"
    ).fetchone()[0]
    if not exists:
        return None

    # Get the most recent 90th percentile for lead (code 1030) and copper (code 1022)
    result = {}
    for code, name in [("PB90", "Lead"), ("CU90", "Copper"), ("1030", "Lead"), ("1022", "Copper")]:
        row = conn.execute("""
            SELECT sample_measure, unit_of_measure, sample_date, action_level_exceeded
            FROM lcr_samples
            WHERE pwsid = ?
              AND contaminant_code = ?
              AND sample_measure IS NOT NULL
            ORDER BY sample_date DESC
            LIMIT 1
        """, (pwsid.strip(), code)).fetchone()
        if row and row["sample_measure"] is not None:
            result[name.lower()] = {
                "value":    round(row["sample_measure"], 4),
                "unit":     (row["unit_of_measure"] or "").upper(),
                "date":     row["sample_date"] or "",
                "exceeds_action_level": row["action_level_exceeded"] == "Y",
            }

    return result if result else None


def get_syr4_results(conn: sqlite3.Connection, pwsid: str) -> list[dict]:
    """
    Get SYR4 (Six-Year Review 4) monitoring results for regulated contaminants.
    THMs, HAAs, Bromate, Chlorite — routine monitoring data from 2012-2019.
    Values are stored in µg/L (= ppb). EWG standards for these are also in ppb.
    """
    exists = conn.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='syr4_results'"
    ).fetchone()[0]
    if not exists:
        return []

    rows = conn.execute("""
        SELECT contaminant, avg_value, max_value, unit, sample_count,
               detect_count, latest_date
        FROM syr4_results
        WHERE pwsid = ?
          AND detect_count > 0
          AND avg_value IS NOT NULL
        ORDER BY avg_value DESC
    """, (pwsid.strip(),)).fetchall()

    results = []
    for row in rows:
        results.append({
            "name":         row["contaminant"],
            "value":        round(float(row["avg_value"]), 4),
            "max_value":    round(float(row["max_value"]), 4),
            "unit":         "ppb",
            "sample_count": row["sample_count"],
            "detect_count": row["detect_count"],
            "latest_date":  row["latest_date"] or "",
        })
    return results


def build_syr4_contaminants(detected: list[dict]) -> list[dict]:
    """
    Cross-reference SYR4 detected contaminants with EWG standards.
    Values are in ppb (µg/L). EWG standards for these are also in ppb.
    """
    contaminants = []
    for p in detected:
        std = ewg_lookup(p["name"])
        value_ppb = p["value"]  # average value in ppb

        entry = {
            "name":          p["name"],
            "type":          "syr4",
            "value":         value_ppb,
            "unit":          "ppb",
            "sample_date":   p["latest_date"],
            "exceeds_epa":   False,
            "exceeds_ewg":   False,
            "epa_limit_str": "No legal limit",
            "ewg_limit_str": None,
            "ewg_multiplier": None,
            "health_effects": None,
        }

        if std:
            ewg_val = std["ewg_limit"]
            ewg_unit = std["unit"]

            entry["epa_limit_str"]  = std["epa_limit_str"]
            entry["ewg_limit_str"]  = std["ewg_limit_str"]
            entry["health_effects"] = std["health_effects"]

            # Convert value to EWG unit for comparison
            if ewg_unit == "ppb":
                cmp_value = value_ppb
            elif ewg_unit == "ppm":
                cmp_value = value_ppb / 1000.0
            elif ewg_unit == "ppt":
                cmp_value = value_ppb * 1000.0
            else:
                cmp_value = value_ppb

            epa_limit = std["epa_limit"]
            if epa_limit and epa_limit > 0 and cmp_value > epa_limit:
                entry["exceeds_epa"] = True

            if ewg_val and ewg_val > 0:
                entry["exceeds_ewg"] = cmp_value > ewg_val
                if entry["exceeds_ewg"]:
                    entry["ewg_multiplier"] = round(cmp_value / ewg_val)

        contaminants.append(entry)

    contaminants.sort(key=lambda x: x["ewg_multiplier"] or 0, reverse=True)
    return contaminants


def get_pfas_total_tested(conn: sqlite3.Connection, pwsid: str) -> int:
    row = conn.execute("""
        SELECT COUNT(DISTINCT contaminant) as cnt
        FROM pfas_results
        WHERE pwsid = ?
    """, (pwsid.strip(),)).fetchone()
    return row["cnt"] if row else 0


# ── Report builder ────────────────────────────────────────────────────────────

def build_contaminants(pfas_detected: list[dict]) -> list[dict]:
    """
    Cross-reference detected PFAS with EWG standards.
    All values are already in ppt (converted in get_pfas_results).
    EWG PFAS standards are also in ppt, so comparisons are direct.
    Returns list sorted by ewg_multiplier descending (most alarming first).
    """
    contaminants = []
    for p in pfas_detected:
        std = ewg_lookup(p["name"])
        value = p["value"]  # already in ppt

        entry = {
            "name":         p["name"],
            "type":         "pfas",
            "source":       "EPA UCMR5 Monitoring (2023–2025)",
            "value":        value,
            "unit":         "ppt",
            "sample_date":  p["sample_date"],
            "exceeds_epa":  False,
            "exceeds_ewg":  False,
            "epa_limit_str": "No legal limit",
            "ewg_limit_str": None,
            "ewg_multiplier": None,
            "health_effects": None,
        }

        if std:
            ewg_val = std["ewg_limit"]
            entry["epa_limit_str"]  = std["epa_limit_str"]
            entry["ewg_limit_str"]  = std["ewg_limit_str"]
            entry["health_effects"] = std["health_effects"]

            # Compare in same unit (ppt)
            if std["epa_limit"] and value > std["epa_limit"]:
                entry["exceeds_epa"] = True

            if ewg_val and ewg_val > 0:
                entry["exceeds_ewg"] = value > ewg_val
                if entry["exceeds_ewg"]:
                    entry["ewg_multiplier"] = round(value / ewg_val)

        contaminants.append(entry)

    contaminants.sort(key=lambda x: x["ewg_multiplier"] or 0, reverse=True)
    return contaminants


def build_ucmr_contaminants(detected: list[dict], source: str) -> list[dict]:
    """
    Cross-reference detected UCMR3/4 contaminants with EWG standards.
    Values are in ppb (µg/L). EWG standards may be in ppb or ppm.
    """
    contaminants = []
    for p in detected:
        std = ewg_lookup(p["name"])
        value_ppb = p["value"]  # already in ppb

        entry = {
            "name":          p["name"],
            "type":          source,  # "ucmr3" or "ucmr4"
            "value":         value_ppb,
            "unit":          "ppb",
            "sample_date":   p["sample_date"],
            "exceeds_epa":   False,
            "exceeds_ewg":   False,
            "epa_limit_str": "No legal limit",
            "ewg_limit_str": None,
            "ewg_multiplier": None,
            "health_effects": None,
        }

        if std:
            ewg_val = std["ewg_limit"]
            ewg_unit = std["unit"]

            entry["epa_limit_str"]  = std["epa_limit_str"]
            entry["ewg_limit_str"]  = std["ewg_limit_str"]
            entry["health_effects"] = std["health_effects"]

            # Convert value to EWG unit for comparison
            if ewg_unit == "ppb":
                cmp_value = value_ppb
            elif ewg_unit == "ppm":
                cmp_value = value_ppb / 1000.0
            elif ewg_unit == "ppt":
                cmp_value = value_ppb * 1000.0
            elif ewg_unit == "pci/l":
                cmp_value = None  # can't convert ppb to pCi/L
            else:
                cmp_value = value_ppb

            if cmp_value is not None:
                epa_limit = std["epa_limit"]
                if epa_limit and epa_limit > 0 and cmp_value > epa_limit:
                    entry["exceeds_epa"] = True

                if ewg_val and ewg_val > 0:
                    entry["exceeds_ewg"] = cmp_value > ewg_val
                    if entry["exceeds_ewg"]:
                        entry["ewg_multiplier"] = round(cmp_value / ewg_val)

        contaminants.append(entry)

    contaminants.sort(key=lambda x: x["ewg_multiplier"] or 0, reverse=True)
    return contaminants


def build_lcr_contaminants(lcr: dict | None) -> list[dict]:
    """Build contaminant entries for lead and copper."""
    if not lcr:
        return []

    results = []

    if "lead" in lcr:
        lead = lcr["lead"]
        # Lead LCR data is in MG/L, convert to ppb for display
        val_ppb = lead["value"] * 1000.0 if lead["unit"] == "MG/L" else lead["value"]

        # EWG says no safe level of lead; guideline is 1 ppb, EPA action level 15 ppb
        results.append({
            "name":          "Lead",
            "type":          "lcr",
            "value":         round(val_ppb, 2),
            "unit":          "ppb",
            "sample_date":   lead["date"],
            "exceeds_epa":   val_ppb > 15,
            "exceeds_ewg":   val_ppb > 1,
            "epa_limit_str": "15 ppb (action level)",
            "ewg_limit_str": "1 ppb",
            "ewg_multiplier": round(val_ppb / 1) if val_ppb > 1 else None,
            "health_effects": "Brain and nervous system damage; learning disabilities in children; cardiovascular effects",
        })

    if "copper" in lcr:
        copper = lcr["copper"]
        val_ppb = copper["value"] * 1000.0 if copper["unit"] == "MG/L" else copper["value"]

        # EPA action level 1300 ppb, EWG guideline ~300 ppb
        results.append({
            "name":          "Copper",
            "type":          "lcr",
            "value":         round(val_ppb, 2),
            "unit":          "ppb",
            "sample_date":   copper["date"],
            "exceeds_epa":   val_ppb > 1300,
            "exceeds_ewg":   val_ppb > 300,
            "epa_limit_str": "1,300 ppb (action level)",
            "ewg_limit_str": "300 ppb",
            "ewg_multiplier": round(val_ppb / 300) if val_ppb > 300 else None,
            "health_effects": "Liver and kidney damage; gastrointestinal distress",
        })

    return results


def _normalize_to_ewg_unit(value: float, db_unit: str, ewg_unit: str) -> float | None:
    """Convert a violation measured value to the same unit as the EWG standard."""
    if value is None:
        return None

    db_unit = (db_unit or "").upper().strip()
    ewg_unit = (ewg_unit or "").lower().strip()

    # Build a conversion: db_unit → base (µg/L) → ewg_unit
    # 1 MG/L = 1 ppm = 1000 ppb = 1000 µg/L
    # 1 UG/L = 1 ppb
    # 1 PCI/L stays as pCi/L

    # Convert DB value to ppb (µg/L) first
    if db_unit in ("UG/L", "PPB"):
        value_ppb = value
    elif db_unit in ("MG/L", "PPM"):
        value_ppb = value * 1000.0
    elif db_unit in ("PCI/L",):
        # pCi/L doesn't convert to ppb — handle separately
        if ewg_unit == "pci/l":
            return value
        return None
    else:
        return None

    # Convert ppb to target EWG unit
    if ewg_unit == "ppb":
        return value_ppb
    elif ewg_unit == "ppm":
        return value_ppb / 1000.0
    elif ewg_unit == "ppt":
        return value_ppb * 1000.0

    return None


def build_violations(conn: sqlite3.Connection, raw_violations: list[dict]) -> list[dict]:
    """Enrich health violations with contaminant names, measured values, and EWG comparisons."""
    results = []
    seen_codes = set()

    for v in raw_violations:
        code = v["contaminant_code"]
        if code in seen_codes:
            continue
        seen_codes.add(code)

        name = get_contaminant_name(conn, code)
        std  = ewg_lookup(name)

        measured_value = None
        measured_unit  = None
        ewg_multiplier = None
        exceeds_ewg    = False
        exceeds_epa    = False

        if v["viol_measure"] is not None and std:
            ewg_unit = std["unit"]
            converted = _normalize_to_ewg_unit(v["viol_measure"], v["unit_of_measure"], ewg_unit)
            if converted is not None:
                measured_value = round(converted, 4)
                measured_unit  = ewg_unit

                ewg_limit = std["ewg_limit"]
                if ewg_limit and ewg_limit > 0:
                    exceeds_ewg = converted > ewg_limit
                    if exceeds_ewg:
                        ewg_multiplier = round(converted / ewg_limit)

                epa_limit = std["epa_limit"]
                if epa_limit and epa_limit > 0:
                    exceeds_epa = converted > epa_limit
        elif v["viol_measure"] is not None:
            # No EWG standard, just store the raw value
            measured_value = round(v["viol_measure"], 4)
            raw_unit = (v["unit_of_measure"] or "").upper()
            unit_map = {"UG/L": "ppb", "MG/L": "ppm", "PCI/L": "pCi/L", "PPB": "ppb", "PPM": "ppm"}
            measured_unit = unit_map.get(raw_unit, raw_unit)

        results.append({
            "contaminant_code": code,
            "contaminant_name": name,
            "status":           v["status"],
            "begin_date":       v["begin_date"],
            "end_date":         v["end_date"],
            "is_major":         v["is_major"],
            "measured_value":   measured_value,
            "measured_unit":    measured_unit,
            "exceeds_ewg":      exceeds_ewg,
            "exceeds_epa":      exceeds_epa,
            "ewg_multiplier":   ewg_multiplier,
            "epa_limit_str":    std["epa_limit_str"] if std else v.get("federal_mcl"),
            "ewg_limit_str":    std["ewg_limit_str"] if std else None,
            "health_effects":   std["health_effects"] if std else None,
        })

    # Sort: violations with EWG multiplier first (descending), then by status
    results.sort(key=lambda x: (x["ewg_multiplier"] or 0), reverse=True)
    return results


def calculate_risk(contaminants: list[dict], violations: list[dict], pfas_total_detected: int) -> str:
    open_violations   = [v for v in violations if v["status"] not in ("Resolved", "Returned to Compliance")]
    high_pfas_mult    = [c for c in contaminants if (c["ewg_multiplier"] or 0) >= 50]
    high_viol_mult    = [v for v in violations if (v.get("ewg_multiplier") or 0) >= 50]
    pfas_exceeds_epa  = [c for c in contaminants if c["exceeds_epa"]]
    viol_exceeds_epa  = [v for v in violations if v.get("exceeds_epa")]

    if open_violations or pfas_exceeds_epa or viol_exceeds_epa or high_pfas_mult or high_viol_mult:
        return "HIGH"
    if pfas_total_detected >= 3 or len(violations) >= 2 or len(contaminants) >= 3:
        return "MODERATE"
    if contaminants or violations:
        return "LOW"
    return "MINIMAL"


def build_report(conn: sqlite3.Connection, zipcode: str) -> dict:
    system = get_primary_system(conn, zipcode)
    if not system:
        return {"zip": zipcode, "found": False}

    pwsid = system["pwsid"]

    # ── Gather all data sources ──
    raw_violations  = get_health_violations(conn, pwsid)
    pfas_detected   = get_pfas_results(conn, pwsid)
    pfas_total      = get_pfas_total_tested(conn, pwsid)
    ucmr3_detected  = get_ucmr_results(conn, pwsid, "ucmr3_results")
    ucmr4_detected  = get_ucmr_results(conn, pwsid, "ucmr4_results")
    lcr_data        = get_lcr_results(conn, pwsid)
    syr4_detected   = get_syr4_results(conn, pwsid)

    # ── Build structured lists ──
    pfas_contaminants  = build_contaminants(pfas_detected)
    ucmr3_contaminants = build_ucmr_contaminants(ucmr3_detected, "ucmr3")
    ucmr4_contaminants = build_ucmr_contaminants(ucmr4_detected, "ucmr4")
    lcr_contaminants   = build_lcr_contaminants(lcr_data)
    syr4_contaminants  = build_syr4_contaminants(syr4_detected)
    violations         = build_violations(conn, raw_violations)

    # Merge all non-PFAS contaminants into one sorted list
    other_contaminants = ucmr3_contaminants + ucmr4_contaminants + lcr_contaminants + syr4_contaminants
    # Deduplicate by name AND by EWG standard key (e.g. chromium / chromium-6 → same standard)
    seen_names = set()
    seen_ewg_keys = set()
    deduped = []
    for c in sorted(other_contaminants, key=lambda x: x["ewg_multiplier"] or 0, reverse=True):
        name_key = c["name"].lower()
        # Also check if this maps to the same EWG standard as a previous entry
        ewg_key = None
        alias = VIOLATION_ALIASES.get(c["name"].upper())
        if alias:
            ewg_key = alias.upper()
        elif c["name"].upper() in _EWG_INDEX:
            ewg_key = c["name"].upper()

        if name_key in seen_names:
            continue
        if ewg_key and ewg_key in seen_ewg_keys:
            continue

        seen_names.add(name_key)
        if ewg_key:
            seen_ewg_keys.add(ewg_key)
        deduped.append(c)
    other_contaminants = deduped

    # All contaminants combined for risk calculation
    all_contaminants = pfas_contaminants + other_contaminants
    risk = calculate_risk(all_contaminants, violations, len(pfas_detected))

    # ── Summary stats ──
    all_ewg = sum(1 for c in all_contaminants if c["exceeds_ewg"])
    viol_ewg = sum(1 for v in violations if v["exceeds_ewg"])
    total_ewg = all_ewg + viol_ewg
    epa_violations = sum(1 for v in violations if v["status"] not in ("Resolved", "Returned to Compliance"))
    total_contaminants = len(all_contaminants) + sum(1 for v in violations if v["measured_value"] is not None)

    return {
        "zip":          zipcode,
        "found":        True,
        "generated_at": datetime.now().strftime("%Y-%m-%d"),
        "system":       system,
        "risk_level":   risk,
        "summary": {
            "total_contaminants":    total_contaminants,
            "ewg_exceedances":       total_ewg,
            "pfas_detected":         len(pfas_detected),
            "pfas_total_tested":     pfas_total,
            "epa_health_violations": epa_violations,
        },
        "contaminants":       pfas_contaminants,
        "other_contaminants": other_contaminants,
        "violations":         violations,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate water quality JSON reports.")
    parser.add_argument("--db",  default=str(DEFAULT_DB),  help="Path to water_quality.db")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output directory for JSON files")
    parser.add_argument("--zip", default=None,             help="Generate a single ZIP (for testing)")
    args = parser.parse_args()

    db_path  = Path(args.db)
    out_path = Path(args.out)

    if not db_path.exists():
        print(f"[ERROR] Database not found: {db_path}")
        print("        Update DEFAULT_DB in generate.py or pass --db <path>")
        sys.exit(1)

    out_path.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Fetch all ZIP codes (or just one for testing)
    if args.zip:
        zipcodes = [args.zip.strip()]
    else:
        rows = conn.execute("SELECT DISTINCT zipcode FROM zip_to_pwsid ORDER BY zipcode").fetchall()
        zipcodes = [r["zipcode"] for r in rows]

    total   = len(zipcodes)
    written = 0
    skipped = 0
    errors  = 0

    print(f"Generating reports for {total} ZIP codes → {out_path}")
    start = datetime.now()

    for i, zip_code in enumerate(zipcodes, 1):
        try:
            report = build_report(conn, zip_code)
            out_file = out_path / f"{zip_code}.json"

            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(report, f, separators=(",", ":"))  # compact, no whitespace

            if report["found"]:
                written += 1
            else:
                skipped += 1

        except Exception as e:
            errors += 1
            print(f"\n[WARN] {zip_code}: {e}")

        # Progress every 500 ZIPs
        if i % 500 == 0 or i == total:
            elapsed   = (datetime.now() - start).total_seconds()
            rate      = i / elapsed if elapsed > 0 else 0
            remaining = (total - i) / rate if rate > 0 else 0
            print(f"  {i}/{total} ({i/total*100:.0f}%)  "
                  f"{rate:.0f} ZIP/s  "
                  f"~{remaining/60:.1f}min remaining", flush=True)

    # Generate locations.json index for fuzzy search
    if not args.zip:
        print("Generating locations.json index...")
        loc_rows = conn.execute("""
            SELECT zp.zipcode, ws.city_name, ws.state_code
            FROM zip_to_pwsid zp
            JOIN water_systems ws ON zp.pwsid = ws.pwsid
            WHERE ws.city_name IS NOT NULL
            ORDER BY zp.zipcode, ws.population_served DESC NULLS LAST
        """).fetchall()

        locations = {}
        for r in loc_rows:
            z = r["zipcode"]
            if z not in locations:
                city = (r["city_name"] or "").strip().title()
                state = (r["state_code"] or "").strip().upper()
                if city and state:
                    locations[z] = [city, state]

        loc_output = sorted([[z, c, s] for z, (c, s) in locations.items()])
        loc_file = out_path / "locations.json"
        with open(loc_file, "w", encoding="utf-8") as f:
            json.dump(loc_output, f, separators=(",", ":"))
        print(f"  locations.json: {len(loc_output):,} entries")

    conn.close()

    elapsed_total = (datetime.now() - start).total_seconds()
    print(f"\nDone in {elapsed_total:.0f}s")
    print(f"  Written:  {written:,}")
    print(f"  No data:  {skipped:,}  (ZIP exists in DB but no water system found)")
    print(f"  Errors:   {errors:,}")
    print(f"  Output:   {out_path.resolve()}")


if __name__ == "__main__":
    main()
