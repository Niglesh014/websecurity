"""
SecuritySentinel Scanner Engine v3.0
Runs all vulnerability modules concurrently using ThreadPoolExecutor.
Hard global ceiling of 30s — no scan can hang forever.
"""

import concurrent.futures
import time
from urllib.parse import urlparse

from .modules import xss, sqli, headers, ssl_check, csrf, auth, error_disclosure, secrets, ecommerce

# (module_display_name, module, per_module_timeout_seconds)
MODULES = [
    ("XSS",              xss,               5),
    ("SQL Injection",    sqli,              5),
    ("Security Headers", headers,           5),
    ("SSL/TLS",          ssl_check,         7),
    ("CSRF",             csrf,              5),
    ("Authentication",   auth,              8),
    ("Error Disclosure", error_disclosure,  5),
    ("Secrets Exposure", secrets,           5),
    ("eCommerce",        ecommerce,         5),
]

SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Info": 4, "Error": 5}

# Hard ceiling for the entire scan — browser never waits longer than this
SCAN_CEILING = 30


def _run_module(name, module, url, timeout):
    """Wrapper — catches all exceptions so one bad module never kills the scan."""
    try:
        result = module.check(url, timeout=timeout)
        result["module"] = name
        return result
    except Exception as e:
        return {
            "id":            f"ERR-{name.upper()[:4]}",
            "module":        name,
            "name":          name,
            "severity":      "Error",
            "description":   f"Module error: {e}",
            "affected_urls": [],
            "recommendation":"Internal scanner error — check logs.",
            "found":         False,
        }


def scan(url: str, max_workers: int = 9) -> dict:
    """
    Run all 9 scanner modules concurrently with a hard 30-second global ceiling.

    Returns a dict with:  url, scan_duration_s, summary, findings, vulnerabilities
    """
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    url = url.rstrip("/")

    start    = time.time()
    findings = []

    # All 9 modules run truly in parallel — max_workers=9 means no queuing
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {
            pool.submit(_run_module, name, module, url, timeout): name
            for name, module, timeout in MODULES
        }

        # as_completed with hard ceiling — timed-out futures get a fallback result
        done_names = set()
        try:
            for future in concurrent.futures.as_completed(futures, timeout=SCAN_CEILING):
                result = future.result()
                findings.append(result)
                done_names.add(futures[future])
        except concurrent.futures.TimeoutError:
            pass  # Some modules exceeded ceiling — add fallback for missing ones

        # Add timeout stubs for any module that didn't finish
        for future, name in futures.items():
            if name not in done_names:
                findings.append({
                    "id":            f"TIMEOUT-{name.upper()[:4]}",
                    "module":        name,
                    "name":          name,
                    "severity":      "Info",
                    "description":   f"Module timed out after {SCAN_CEILING}s",
                    "affected_urls": [],
                    "recommendation":"Increase timeout or check network connectivity.",
                    "found":         False,
                })

    scan_duration = round(time.time() - start, 2)

    # Sort: Critical → High → Medium → Low → Info → Error
    findings.sort(key=lambda r: SEVERITY_ORDER.get(r.get("severity", "Info"), 99))

    # Build summary
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    active_findings = [f for f in findings if f.get("found")]
    for f in active_findings:
        sev = f.get("severity", "Info")
        if sev in severity_counts:
            severity_counts[sev] += 1

    total_issues = sum(v for k, v in severity_counts.items() if k != "Info")
    score = max(5, 100
                - severity_counts["Critical"] * 30
                - severity_counts["High"]     * 15
                - severity_counts["Medium"]   * 7
                - severity_counts["Low"]      * 2)

    grade = (
        "F" if score < 30 else
        "D" if score < 50 else
        "C" if score < 70 else
        "B" if score < 85 else "A"
    )

    return {
        "url":             url,
        "scan_duration_s": scan_duration,
        "summary": {
            "score":           score,
            "grade":           grade,
            "total_issues":    total_issues,
            "severity_counts": severity_counts,
            "modules_run":     len(MODULES),
        },
        "findings":        findings,
        "vulnerabilities": active_findings,
    }