"""Error Disclosure Scanner — fast version with fewer trigger paths."""

import requests

ERROR_SIGS = [
    "traceback (most recent call last)","werkzeug debugger","django traceback",
    "laravel whoops","you have an error in your sql syntax","pg_query()",
    "ora-","debug mode","/var/www/","c:\\inetpub","uncaught exception",
]
# Only 3 paths instead of 5
TRIGGER_PATHS = ["/nonexistent_xyz_abc", "/?id=", "/api/nonexistent"]


def _get(url, timeout):
    return requests.get(url, timeout=(2, timeout), allow_redirects=True,
                        headers={"User-Agent":"SecuritySentinel/3.0"})


def check(url: str, timeout: int = 4) -> dict:
    leaking  = []
    patterns = []

    for path in TRIGGER_PATHS:
        try:
            resp = _get(url + path, timeout)
            body = resp.text.lower()
            for sig in ERROR_SIGS:
                if sig in body:
                    leaking.append(url + path)
                    patterns.append(sig)
                    break
        except Exception:
            pass

    found = bool(leaking)
    return {
        "id":"ERR-001", "name":"Verbose Error Messages / Debug Mode",
        "severity":"medium" if found else "info",
        "description":(f"Verbose errors on {len(leaking)} URL(s). Leaked: {', '.join(set(patterns)[:3])}." if found else "No verbose error messages detected."),
        "affected_urls":list(set(leaking)),
        "leaked_patterns":list(set(patterns)),
        "businessImpact":"Reveals tech stack, file paths, and database schema — giving attackers a free map of your infrastructure.",
        "tech":"Stack traces and database errors exposed in production responses.",
        "example":"ERROR: relation \"users_v2\"\nnot found at character 57\nFILE: /var/www/app/db.py",
        "fix":"Disable debug mode; return generic error pages; log errors server-side with Sentry.",
        "effort":"15 minutes",
        "recommendation":"1. Set DEBUG=False / NODE_ENV=production.\n2. Show only generic 404/500 pages.\n3. Use Sentry for server-side error logging.",
        "found":found,
    }