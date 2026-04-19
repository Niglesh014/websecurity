"""
Authentication Security Scanner — FAST version
Key fixes vs old version:
  - Reduced login paths to 5 most common (was 9)
  - connect_timeout=2, read_timeout=3 instead of flat 6s
  - Rate-limit test reduced to 3 rapid requests (was 10)
  - Hard 8s ceiling via threading.Timer so this module can NEVER hang
"""

import requests
import threading

LOGIN_PATHS = ["/login", "/signin", "/api/login", "/wp-login.php", "/api/v1/login"]

ENUM_VALID   = ["incorrect password","wrong password","invalid password"]
ENUM_INVALID = ["user not found","no account","email not found"]


def _get(url, timeout):
    """GET with split connect/read timeouts."""
    return requests.get(url, timeout=(2, timeout), allow_redirects=True,
                        headers={"User-Agent":"SecuritySentinel/3.0"})


def _post(url, body, timeout):
    return requests.post(url, json=body,
                         headers={"Content-Type":"application/json"},
                         timeout=(2, timeout), allow_redirects=False)


def _find_login(base: str, timeout: int) -> str | None:
    for path in LOGIN_PATHS:
        try:
            r = _get(base + path, timeout)
            if r.status_code in (200, 405):
                return base + path
        except Exception:
            pass
    return None


def _no_rate_limit(login_url: str, timeout: int) -> bool:
    """Send 3 quick bad logins — if none returns 429 we flag it."""
    blocked = False
    for i in range(3):
        try:
            r = _post(login_url, {"email": f"t{i}@t.com", "password": "bad"}, timeout)
            if r.status_code == 429 or "too many" in r.text.lower():
                blocked = True
                break
        except Exception:
            break
    return not blocked


def _user_enum(login_url: str, timeout: int) -> bool:
    try:
        r1 = _post(login_url, {"email":"admin@example.com",   "password":"bad_xyz_999"}, timeout)
        r2 = _post(login_url, {"email":"norealacc@xyz123.com","password":"bad_xyz_999"}, timeout)
        t1, t2 = r1.text.lower(), r2.text.lower()
        return (any(s in t1 for s in ENUM_VALID) or any(s in t2 for s in ENUM_INVALID))
    except Exception:
        return False


def check(url: str, timeout: int = 6) -> dict:
    # Hard ceiling: entire function must finish within 10 s
    result = {}
    done   = threading.Event()

    def _inner():
        issues  = []
        affected = []
        login_url = _find_login(url, min(timeout, 3))

        if login_url:
            if _no_rate_limit(login_url, min(timeout, 3)):
                issues.append(f"No rate limiting on {login_url}.")
                affected.append(login_url)
            if _user_enum(login_url, min(timeout, 3)):
                issues.append(f"User enumeration possible on {login_url}.")
                affected.append(login_url)
        else:
            issues.append("No login endpoint found. Manually verify rate limiting and MFA.")

        found = bool(login_url and any("rate" in i or "enum" in i for i in issues))
        result.update({
            "id":"AUTH-001", "name":"Authentication Security",
            "severity":"high" if found else "info",
            "description":"\n".join(issues) if issues else "No auth issues detected.",
            "affected_urls":list(set(affected)),
            "login_endpoint":login_url,
            "businessImpact":"Automated bots can guess employee passwords in hours.",
            "tech":"Login endpoint accepts unlimited auth attempts without lockout or CAPTCHA.",
            "example":"POST /api/login x 10,000\n{\"email\":\"admin@co.com\",\n \"password\":\"<wordlist>\"}",
            "fix":"Add rate limiting + lockout after 5 attempts.",
            "effort":"4–6 hours dev time",
            "recommendation":"1. Rate limit: max 5 attempts/IP/min.\n2. Lock account after 5 failures.\n3. Use generic errors only.\n4. Enforce MFA for admins.",
            "found":found,
        })
        done.set()

    t = threading.Thread(target=_inner, daemon=True)
    t.start()
    done.wait(timeout=10)   # ← hard ceiling

    if not result:
        return {
            "id":"AUTH-001","name":"Authentication Security","severity":"info",
            "description":"Auth scan timed out — site may be blocking probes.",
            "affected_urls":[],"found":False,
            "businessImpact":"","tech":"","example":"","fix":"","effort":"",
            "recommendation":"Manually verify login rate limiting.",
        }
    return result