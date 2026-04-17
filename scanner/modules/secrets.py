"""
Sensitive Data Exposure Scanner Module
Checks for:
  - API keys or secrets accidentally exposed in HTML/JS source
  - .env files publicly accessible
  - Git repository metadata exposed (.git/config)
  - AWS/cloud credential patterns in page source
  - Sensitive file paths accessible (backup files, config dumps)
"""

import requests
import re


# Regex patterns for common secret formats
SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS Access Key ID"),
    (re.compile(r"(?i)api[_\-]?key\s*[:=]\s*['\"]?([a-zA-Z0-9\-_]{20,})"), "API Key"),
    (re.compile(r"(?i)secret[_\-]?key\s*[:=]\s*['\"]?([a-zA-Z0-9\-_]{16,})"), "Secret Key"),
    (re.compile(r"(?i)password\s*[:=]\s*['\"]([^'\"]{8,})['\"]"), "Hardcoded Password"),
    (re.compile(r"(?i)db_password\s*[:=]\s*['\"]?([^\s'\"]{6,})"), "Database Password"),
    (re.compile(r"eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+"), "JWT Token in source"),
    (re.compile(r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"), "Private Key"),
    (re.compile(r"(?i)stripe[_\-]?(?:secret|api)[_\-]?key\s*[:=]\s*['\"]?(sk_(?:live|test)_[a-zA-Z0-9]{20,})"), "Stripe Secret Key"),
    (re.compile(r"AIza[0-9A-Za-z\-_]{35}"), "Google API Key"),
]

# Files that should never be publicly accessible
SENSITIVE_PATHS = [
    "/.env",
    "/.env.local",
    "/.env.production",
    "/.git/config",
    "/config.php",
    "/wp-config.php",
    "/config/database.yml",
    "/config/secrets.yml",
    "/backup.sql",
    "/dump.sql",
    "/db.sql",
    "/database.sql",
    "/.htpasswd",
    "/phpinfo.php",
    "/info.php",
    "/server-status",
    "/robots.txt",  # Not a security risk alone, but reveals paths
]


def _check_source_for_secrets(text: str) -> list:
    """Scan page source text for secret patterns. Returns list of finding strings."""
    findings = []
    for pattern, label in SECRET_PATTERNS:
        if pattern.search(text):
            findings.append(label)
    return findings


def check(url: str, timeout: int = 6) -> dict:
    """
    Check for exposed secrets and sensitive files.

    Returns a structured result dict.
    """
    issues = []
    affected_urls = []

    # --- 1. Check main page source for secrets ---
    try:
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        leaked = _check_source_for_secrets(resp.text)
        if leaked:
            issues.append(f"Potential secrets in page source: {', '.join(leaked)}")
            affected_urls.append(url)
    except Exception:
        pass

    # --- 2. Check for exposed sensitive files ---
    for path in SENSITIVE_PATHS:
        test_url = url + path
        try:
            resp = requests.get(test_url, timeout=timeout, allow_redirects=False)
            # 200 = file exists, ignore redirects to login pages
            if resp.status_code == 200 and len(resp.text) > 50:
                # Verify it's not a custom 404 disguised as 200
                is_not_404 = not any(
                    phrase in resp.text.lower()
                    for phrase in ["page not found", "404", "not found", "does not exist"]
                )
                if is_not_404:
                    issues.append(f"Sensitive file publicly accessible: {path}")
                    affected_urls.append(test_url)

                    # Extra check: scan .env content for secrets
                    if ".env" in path:
                        extra = _check_source_for_secrets(resp.text)
                        if extra:
                            issues.append(f"  ↳ .env contains: {', '.join(extra)}")
        except Exception:
            pass

    found = bool(issues)

    # Escalate severity if actual secrets (not just file paths) are found
    secret_issues = [i for i in issues if any(
        s in i for s in ["AWS", "API Key", "Secret Key", "Password", "JWT", "Private Key", "Stripe"]
    )]
    severity = "Critical" if secret_issues else ("High" if found else "Info")

    return {
        "id": "SECRETS-001",
        "name": "Sensitive Data & Secret Exposure",
        "severity": severity,
        "description": (
            f"{len(issues)} sensitive data issue(s) found:\n" + "\n".join(f"  • {i}" for i in issues)
            if found else
            "No exposed secrets or sensitive files detected."
        ),
        "affected_urls": list(set(affected_urls)),
        "recommendation": (
            "1. Move ALL secrets to environment variables — never hardcode in source. "
            "2. Add .env, .env.*, .git/, config/ to .gitignore immediately. "
            "3. Rotate any exposed API keys, passwords, or tokens right now. "
            "4. Block access to sensitive paths in your server config (nginx/Apache deny rules). "
            "5. Scan every commit with git-secrets or TruffleHog before pushing. "
            "6. Audit Git history — secrets remain visible even after deletion."
            if found else "No action required."
        ),
        "found": found,
    }