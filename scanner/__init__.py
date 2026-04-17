"""
SecuritySentinel Scanner Engine
Runs all vulnerability modules concurrently using ThreadPoolExecutor
and aggregates results into a structured JSON report.
"""

import concurrent.futures
import time
from urllib.parse import urlparse

from .modules import xss, sqli, headers, ssl_check, csrf, auth, error_disclosure, secrets, ecommerce


# All modules with their display name and scan timeout
MODULES = [
    ("XSS",              xss,               6),
    ("SQL Injection",    sqli,              8),
    ("Security Headers", headers,           6),
    ("SSL/TLS",          ssl_check,         8),
    ("CSRF",             csrf,              6),
    ("Authentication",   auth,             12),  # Needs multiple requests
    ("Error Disclosure", error_disclosure,  6),
    ("Secrets Exposure", secrets,          10),  # Checks many paths
    ("eCommerce",        ecommerce,         6),
]

SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Info": 4, "Error": 5}


def _run_module(name, module, url, timeout):
    """Wrapper that captures exceptions from a module so one failure doesn't stop the scan."""
    try:
        result = module.check(url, timeout=timeout)
        result["module"] = name
        return result
    except Exception as e:
        return {
            "id": f"ERR-{name.upper()[:4]}",
            "module": name,
            "name": name,
            "severity": "Error",
            "description": f"Module crashed: {e}",
            "affected_urls": [],
            "recommendation": "Internal scanner error — check server logs.",
            "found": False,
        }


def scan(url: str, max_workers: int = 6) -> dict:
    """
    Run all scanner modules concurrently and return a full report.

    Args:
        url: The target URL (must start with http:// or https://)
        max_workers: Thread pool size for concurrent scanning

    Returns:
        A dict with keys: url, scan_duration_s, summary, findings
    """
    # Normalise URL
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    url = url.rstrip("/")

    start = time.time()

    # Run all modules concurrently
    findings = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {
            pool.submit(_run_module, name, module, url, timeout): name
            for name, module, timeout in MODULES
        }
        for future in concurrent.futures.as_completed(futures):
            findings.append(future.result())

    scan_duration = round(time.time() - start, 2)

    # Sort by severity (Critical first)
    findings.sort(key=lambda r: SEVERITY_ORDER.get(r.get("severity", "Info"), 99))

    # Build summary counts
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    active_findings = [f for f in findings if f.get("found")]
    for f in active_findings:
        sev = f.get("severity", "Info")
        if sev in severity_counts:
            severity_counts[sev] += 1

    total_issues = sum(v for k, v in severity_counts.items() if k != "Info")
    score = max(5, 100 - severity_counts["Critical"] * 30
                   - severity_counts["High"] * 15
                   - severity_counts["Medium"] * 7
                   - severity_counts["Low"] * 2)

    grade = (
        "F" if score < 30 else
        "D" if score < 50 else
        "C" if score < 70 else
        "B" if score < 85 else "A"
    )

    return {
        "url": url,
        "scan_duration_s": scan_duration,
        "summary": {
            "score": score,
            "grade": grade,
            "total_issues": total_issues,
            "severity_counts": severity_counts,
            "modules_run": len(MODULES),
        },
        "findings": findings,
        # Convenience: only findings where something was actually found
        "vulnerabilities": [f for f in findings if f.get("found")],
    }