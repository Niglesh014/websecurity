"""
CSRF (Cross-Site Request Forgery) Scanner Module
Checks whether forms on the page include CSRF tokens and whether
the site sets SameSite cookie attributes (a modern CSRF defence).
"""

import requests
from bs4 import BeautifulSoup
import re


# Common CSRF token field names used by popular frameworks
CSRF_TOKEN_NAMES = [
    "csrf", "csrf_token", "_csrf", "csrftoken", "_token", "authenticity_token",
    "__requestverificationtoken", "xsrf-token", "_csrf_token", "csrf-token",
]

# Patterns that suggest a CSRF token value (long random strings)
TOKEN_VALUE_PATTERN = re.compile(r"^[a-zA-Z0-9+/=_\-]{16,}$")


def _has_csrf_token(form) -> bool:
    """Return True if a BeautifulSoup form element contains a CSRF token input."""
    for inp in form.find_all("input"):
        name = (inp.get("name") or "").lower()
        value = inp.get("value") or ""
        if any(token_name in name for token_name in CSRF_TOKEN_NAMES):
            return True
        # Also check for hidden inputs with long random values
        if inp.get("type") == "hidden" and TOKEN_VALUE_PATTERN.match(value):
            return True
    return False


def check(url: str, timeout: int = 6) -> dict:
    """
    Check for missing CSRF protection on forms and cookies.

    Returns a structured result dict.
    """
    vulnerable_forms = []
    cookie_issues = []
    affected_urls = []

    try:
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        soup = BeautifulSoup(resp.text, "html.parser")

        # --- 1. Inspect all POST forms for CSRF tokens ---
        forms = soup.find_all("form")
        for form in forms:
            method = (form.get("method") or "get").upper()
            action = form.get("action") or url
            if method == "POST":
                if not _has_csrf_token(form):
                    form_id = form.get("id") or form.get("name") or action
                    vulnerable_forms.append(str(form_id))
                    affected_urls.append(url)

        # --- 2. Check cookies for SameSite attribute ---
        for cookie in resp.cookies:
            cookie_str = str(cookie.__dict__)
            samesite = cookie._rest.get("SameSite") or cookie._rest.get("samesite")  # type: ignore[attr-defined]
            if not samesite:
                cookie_issues.append(
                    f"Cookie '{cookie.name}' missing SameSite attribute — "
                    "browsers will send it on cross-site requests."
                )

    except Exception as e:
        return {
            "id": "CSRF-001",
            "name": "CSRF Protection",
            "severity": "Error",
            "description": f"Could not scan {url}: {e}",
            "affected_urls": [url],
            "recommendation": "Ensure the URL is reachable and retry.",
            "found": False,
        }

    found = bool(vulnerable_forms or cookie_issues)
    severity = "High" if vulnerable_forms else ("Medium" if cookie_issues else "Info")

    description_parts = []
    if vulnerable_forms:
        description_parts.append(
            f"{len(vulnerable_forms)} POST form(s) lack CSRF tokens: {', '.join(vulnerable_forms[:3])}. "
            "An attacker can craft a page that silently submits these forms on behalf of logged-in users."
        )
    if cookie_issues:
        description_parts.append(
            f"{len(cookie_issues)} cookie(s) missing the SameSite attribute: " +
            "; ".join(cookie_issues[:2])
        )

    return {
        "id": "CSRF-001",
        "name": "CSRF (Cross-Site Request Forgery) Protection",
        "severity": severity,
        "description": " ".join(description_parts) if description_parts else "CSRF protection appears to be in place.",
        "affected_urls": list(set(affected_urls)),
        "vulnerable_forms": vulnerable_forms,
        "recommendation": (
            "1. Add a unique per-session CSRF token to every POST form. "
            "2. Verify the token server-side on every state-changing request. "
            "3. Use csurf (Node.js) or Django's built-in CSRF middleware. "
            "4. Set SameSite=Strict or SameSite=Lax on all cookies. "
            "5. For APIs: use the Double Submit Cookie pattern or HMAC tokens."
            if found else "No action required."
        ),
        "found": found,
    }