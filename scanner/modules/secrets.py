"""
Secrets Exposure Scanner — FAST version
Key fixes:
  - Reduced sensitive paths from 12 to 6 highest-signal paths
  - connect_timeout=1.5, read_timeout=3 per path
  - Hard 8s ceiling via threading.Timer
"""

import requests
import re
import threading

SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"),                                                  "AWS Access Key ID"),
    (re.compile(r"(?i)api[_\-]?key\s*[:=]\s*['\"]?([a-zA-Z0-9\-_]{20,})"),           "API Key"),
    (re.compile(r"(?i)secret[_\-]?key\s*[:=]\s*['\"]?([a-zA-Z0-9\-_]{16,})"),        "Secret Key"),
    (re.compile(r"(?i)password\s*[:=]\s*['\"]([^'\"]{8,})['\"]"),                     "Hardcoded Password"),
    (re.compile(r"eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+"),        "JWT Token in source"),
    (re.compile(r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"),                   "Private Key"),
    (re.compile(r"AIza[0-9A-Za-z\-_]{35}"),                                            "Google API Key"),
    (re.compile(r"sk_(?:live|test)_[a-zA-Z0-9]{20,}"),                                "Stripe Secret Key"),
]

# Only the 6 highest-signal paths
SENSITIVE_PATHS = [
    "/.env",
    "/.git/config",
    "/wp-config.php",
    "/.env.local",
    "/phpinfo.php",
    "/.htpasswd",
]


def _scan_source(text: str) -> list:
    return [label for pattern, label in SECRET_PATTERNS if pattern.search(text)]


def _get(url, connect_t=1.5, read_t=3):
    return requests.get(url, timeout=(connect_t, read_t),
                        allow_redirects=False,
                        headers={"User-Agent":"SecuritySentinel/3.0"})


def check(url: str, timeout: int = 4) -> dict:
    result = {}
    done   = threading.Event()

    def _inner():
        issues  = []
        affected = []

        # Scan main page source
        try:
            resp = _get(url, 2, min(timeout, 4))
            leaked = _scan_source(resp.text)
            if leaked:
                issues.append(f"Potential secrets in page source: {', '.join(leaked)}")
                affected.append(url)
        except Exception:
            pass

        # Check sensitive paths
        for path in SENSITIVE_PATHS:
            try:
                resp = _get(url + path, 1.5, 3)
                if resp.status_code == 200 and len(resp.text) > 50:
                    not_404 = not any(p in resp.text.lower() for p in ["page not found","404","not found"])
                    if not_404:
                        issues.append(f"Sensitive file accessible: {path}")
                        affected.append(url + path)
                        extra = _scan_source(resp.text)
                        if extra:
                            issues.append(f"  ↳ Contains: {', '.join(extra)}")
            except Exception:
                pass

        found = bool(issues)
        has_secrets = any(any(s in i for s in ["AWS","API Key","Secret","Password","JWT","Private","Stripe"]) for i in issues)
        severity = "critical" if has_secrets else ("high" if found else "info")

        result.update({
            "id":"SECRETS-001", "name":"Sensitive Data & Secret Exposure",
            "severity":severity,
            "description":("\n".join(f"• {i}" for i in issues) if found else "No exposed secrets or sensitive files detected."),
            "affected_urls":list(set(affected)),
            "businessImpact":"Exposed API keys give attackers full access to your cloud services and databases within minutes.",
            "tech":"Secrets hardcoded in source or .env files publicly accessible via direct URL.",
            "example":"GET /.env HTTP/1.1\n→ DB_PASSWORD=supersecret\n   STRIPE_SECRET=sk_live_...",
            "fix":"Move secrets to env vars. Block /.env, /.git in server config.",
            "effort":"1–2 hours",
            "recommendation":"1. Rotate any exposed keys immediately.\n2. Add .env* to .gitignore.\n3. Block sensitive paths in nginx/Apache.\n4. Scan commits with git-secrets.",
            "found":found,
        })
        done.set()

    t = threading.Thread(target=_inner, daemon=True)
    t.start()
    done.wait(timeout=8)

    if not result:
        return {
            "id":"SECRETS-001","name":"Sensitive Data & Secret Exposure","severity":"info",
            "description":"Secrets scan timed out.","affected_urls":[],"found":False,
            "businessImpact":"","tech":"","example":"","fix":"","effort":"",
            "recommendation":"Manually check for exposed .env files.",
        }
    return result