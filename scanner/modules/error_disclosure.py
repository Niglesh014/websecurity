"""
Error Disclosure Scanner Module
Checks whether the application leaks stack traces, database errors,
file paths, or framework version info in HTTP responses.

Verbose error messages give attackers a free map of your infrastructure.
"""

import requests

# Patterns that indicate verbose error leakage
ERROR_SIGNATURES = [
    # Stack traces
    "traceback (most recent call last)",
    "at object.<anonymous>",
    "stack trace:",
    "exception in thread",
    "java.lang.",
    "at com.",

    # Database errors
    "you have an error in your sql syntax",
    "pg_query()",
    "uncaught exception",
    "sqlstate",
    "db2 sql error",
    "ora-",
    "sqlite3",

    # Framework/debug modes
    "debug mode",
    "werkzeug debugger",
    "django traceback",
    "laravel whoops",
    "rails application trace",
    "symfony exception",

    # File paths
    "/var/www/",
    "/home/",
    "c:\\inetpub",
    "c:\\xampp",
    "app/models/",
    "views/errors/",
]

# Paths that tend to trigger error states
ERROR_TRIGGER_PATHS = [
    "/nonexistent_page_xyz_abc",
    "/?id=",
    "/?page=../../../../etc/passwd",
    "/api/nonexistent",
    "/admin/nonexistent",
]


def check(url: str, timeout: int = 6) -> dict:
    """
    Check whether the app exposes verbose error messages in production.

    Returns a structured result dict.
    """
    leaking_urls = []
    leaked_patterns = []

    for path in ERROR_TRIGGER_PATHS:
        test_url = url + path
        try:
            resp = requests.get(test_url, timeout=timeout, allow_redirects=True)
            body_lower = resp.text.lower()

            for sig in ERROR_SIGNATURES:
                if sig in body_lower:
                    leaking_urls.append(test_url)
                    leaked_patterns.append(sig)
                    break  # One match per URL is enough
        except Exception:
            pass

    found = bool(leaking_urls)
    unique_patterns = list(set(leaked_patterns))

    return {
        "id": "ERR-001",
        "name": "Verbose Error Messages / Debug Mode",
        "severity": "Medium" if found else "Info",
        "description": (
            f"Verbose error messages detected on {len(leaking_urls)} URL(s). "
            f"Leaked indicators: {', '.join(unique_patterns[:4])}. "
            "This reveals your tech stack, file paths, and database structure — "
            "giving attackers a free reconnaissance report."
            if found else
            "No verbose error messages or debug output detected."
        ),
        "affected_urls": list(set(leaking_urls)),
        "leaked_patterns": unique_patterns,
        "recommendation": (
            "1. Set your framework to production mode (DEBUG=False in Django, NODE_ENV=production, etc.). "
            "2. Return only generic error pages to users: '404 Not Found', '500 Server Error'. "
            "3. Log full error details server-side with Sentry or similar — never expose to the client. "
            "4. Disable default framework error pages in production."
            if found else "No action required."
        ),
        "found": found,
    }