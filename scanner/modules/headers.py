"""
Security Headers Scanner Module
Checks for missing HTTP security headers that protect against a range
of common attacks (clickjacking, MIME sniffing, XSS, downgrade attacks).

Based on the eCommerce Security Checklist recommendations:
  - Content-Security-Policy (XSS mitigation)
  - X-Frame-Options (clickjacking)
  - X-Content-Type-Options (MIME sniffing)
  - Strict-Transport-Security (HTTPS enforcement)
  - Referrer-Policy (information leakage)
  - Permissions-Policy (browser feature control)
"""

import requests

# Each entry: (header_name_lowercase, display_name, why_it_matters, fix)
REQUIRED_HEADERS = [
    (
        "content-security-policy",
        "Content-Security-Policy (CSP)",
        "Blocks execution of injected scripts. Without it, any XSS payload "
        "will run freely in visitors' browsers.",
        "Add: Content-Security-Policy: default-src 'self'; script-src 'self'",
    ),
    (
        "x-frame-options",
        "X-Frame-Options",
        "Prevents your site from being embedded in an <iframe> on malicious "
        "pages, blocking clickjacking attacks.",
        "Add: X-Frame-Options: DENY  (or use CSP frame-ancestors)",
    ),
    (
        "x-content-type-options",
        "X-Content-Type-Options",
        "Stops the browser from guessing file types (MIME sniffing), preventing "
        "attackers from tricking browsers into running uploaded files as scripts.",
        "Add: X-Content-Type-Options: nosniff",
    ),
    (
        "strict-transport-security",
        "Strict-Transport-Security (HSTS)",
        "Forces browsers to always use HTTPS, preventing SSL-stripping attacks "
        "where an attacker downgrades your connection to plain HTTP.",
        "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    ),
    (
        "referrer-policy",
        "Referrer-Policy",
        "Controls how much URL information is shared when users click links "
        "leaving your site — prevents leaking internal URLs or session tokens.",
        "Add: Referrer-Policy: strict-origin-when-cross-origin",
    ),
    (
        "permissions-policy",
        "Permissions-Policy",
        "Restricts which browser features (camera, microphone, geolocation) "
        "can be used — reduces attack surface from malicious iframes.",
        "Add: Permissions-Policy: geolocation=(), microphone=(), camera=()",
    ),
]


def check(url: str, timeout: int = 6) -> dict:
    """
    Check for missing HTTP security headers.

    Returns a structured result dict.
    """
    missing = []
    present = []

    try:
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        headers_lower = {k.lower() for k in resp.headers.keys()}

        for header_key, display_name, reason, fix in REQUIRED_HEADERS:
            if header_key not in headers_lower:
                missing.append({
                    "header": display_name,
                    "why": reason,
                    "fix": fix,
                })
            else:
                present.append(display_name)

    except Exception as e:
        return {
            "id": "HDR-001",
            "name": "Missing Security Headers",
            "severity": "Error",
            "description": f"Could not connect to {url}: {e}",
            "affected_urls": [url],
            "missing_headers": [],
            "present_headers": [],
            "recommendation": "Ensure the URL is reachable and retry.",
            "found": False,
        }

    found = bool(missing)
    severity_map = {0: "Info", 1: "Low", 2: "Low", 3: "Medium", 4: "Medium", 5: "High", 6: "High"}
    severity = severity_map.get(len(missing), "High")

    missing_names = [m["header"] for m in missing]
    fixes = [m["fix"] for m in missing]

    return {
        "id": "HDR-001",
        "name": "Missing Security Headers",
        "severity": severity if found else "Info",
        "description": (
            f"{len(missing)} of {len(REQUIRED_HEADERS)} recommended security headers are missing: "
            f"{', '.join(missing_names)}. "
            "Missing headers leave your site exposed to clickjacking, XSS, MIME sniffing, "
            "and SSL downgrade attacks."
            if found else
            f"All {len(REQUIRED_HEADERS)} recommended security headers are present."
        ),
        "affected_urls": [url] if found else [],
        "missing_headers": missing,
        "present_headers": present,
        "recommendation": (
            "Use Helmet.js (Node.js) or set headers manually in your server config (nginx/Apache). "
            "Specific fixes:\n" + "\n".join(f"  • {f}" for f in fixes)
            if found else "No action required."
        ),
        "found": found,
    }