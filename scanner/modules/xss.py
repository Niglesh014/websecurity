"""
XSS (Cross-Site Scripting) Scanner Module
Checks if user-supplied input is reflected or stored without sanitization.
Also checks for missing Content Security Policy headers.
"""

import requests

# Test payloads - injected into query params to detect reflection
XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    '"><svg onload=alert(1)>',
]

# Common query parameters that often accept user input
TEST_PARAMS = ["q", "search", "query", "input", "text", "comment", "name", "s"]


def check(url: str, timeout: int = 6) -> dict:
    """
    Check for reflected XSS and missing CSP header.

    Returns a structured result dict:
    {
        "id": str,
        "name": str,
        "severity": str,
        "description": str,
        "affected_urls": list,
        "recommendation": str,
        "found": bool
    }
    """
    affected_urls = []
    details = []

    # --- 1. Check for reflected XSS via URL parameters ---
    for param in TEST_PARAMS:
        for payload in XSS_PAYLOADS:
            test_url = f"{url}?{param}={requests.utils.quote(payload)}"
            try:
                resp = requests.get(test_url, timeout=timeout, allow_redirects=True)
                # If the raw payload appears unescaped in the HTML, it's vulnerable
                if payload in resp.text:
                    affected_urls.append(test_url)
                    details.append(f"Payload reflected via ?{param}=")
                    break  # One hit per param is enough
            except Exception:
                pass

    # --- 2. Check for missing Content-Security-Policy header ---
    csp_missing = False
    try:
        resp = requests.get(url, timeout=timeout)
        csp_missing = "content-security-policy" not in {k.lower() for k in resp.headers}
    except Exception:
        pass

    found = bool(affected_urls) or csp_missing

    description_parts = []
    if affected_urls:
        description_parts.append(
            "Reflected XSS detected: user-supplied input is returned in the HTML "
            "response without sanitization. Attackers can inject scripts to steal "
            "session cookies, redirect users, or deface the page."
        )
    if csp_missing:
        description_parts.append(
            "Content-Security-Policy (CSP) header is missing. CSP tells the browser "
            "which scripts are trusted — its absence means injected scripts will execute "
            "with no browser-level defence."
        )

    return {
        "id": "XSS-001",
        "name": "Cross-Site Scripting (XSS)",
        "severity": "Critical" if affected_urls else ("Medium" if csp_missing else "Low"),
        "description": " ".join(description_parts) if description_parts else "No XSS indicators found.",
        "affected_urls": affected_urls,
        "recommendation": (
            "1. Sanitize all user input server-side and escape HTML output. "
            "2. Use DOMPurify for any client-side HTML rendering. "
            "3. Add a strict Content-Security-Policy header: "
            "Content-Security-Policy: default-src 'self'; script-src 'self'"
        ),
        "found": found,
    }
    