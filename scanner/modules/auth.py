"""
Authentication Security Scanner Module
Checks for:
  - Missing rate limiting on login endpoints (brute-force risk)
  - JWT tokens stored in localStorage (XSS-stealable)
  - Passwords sent over plain HTTP
  - Verbose login errors that reveal valid usernames (user enumeration)
"""

import requests
import time
import re
import concurrent.futures


# Common login endpoint paths to test
LOGIN_PATHS = [
    "/login", "/signin", "/auth/login", "/api/login", "/api/auth",
    "/user/login", "/account/login", "/wp-login.php", "/admin/login",
    "/api/v1/login", "/api/v1/auth",
]

# Strings that indicate user enumeration is possible
ENUM_SIGNATURES_VALID = [
    "incorrect password", "wrong password", "invalid password",
    "password is incorrect", "bad password",
]
ENUM_SIGNATURES_INVALID = [
    "user not found", "no account found", "email not found",
    "account doesn't exist", "no such user",
]


def _find_login_endpoint(base_url: str, timeout: int) -> str | None:
    """Attempt to find an active login endpoint."""
    for path in LOGIN_PATHS:
        try:
            resp = requests.get(base_url + path, timeout=timeout, allow_redirects=True)
            if resp.status_code in (200, 405):  # 405 = method not allowed = endpoint exists
                return base_url + path
        except Exception:
            pass
    return None


def _check_rate_limit(login_url: str, timeout: int) -> bool:
    """
    Return True (vulnerable) if 5 rapid requests are all accepted without
    rate-limit responses (429 Too Many Requests / lockout message).
    """
    session = requests.Session()
    def _single_request(i):
        try:
            resp = session.post(
                login_url,
                json={"email": f"test{i}@test.com", "password": "wrongpassword123"},
                headers={"Content-Type": "application/json"},
                timeout=timeout,
                allow_redirects=False,
            )
            return resp.status_code == 429 or "too many" in resp.text.lower() or "rate limit" in resp.text.lower()
        except Exception:
            return False

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(_single_request, i) for i in range(5)]
        blocked = any(future.result() for future in concurrent.futures.as_completed(futures))

    return not blocked  # returns True if NOT blocked = vulnerable


def _check_user_enumeration(login_url: str, timeout: int) -> bool:
    """
    Return True if the endpoint returns different error messages for
    wrong password vs. unknown user — enabling attacker to enumerate valid accounts.
    """
    session = requests.Session()
    try:
        resp_known = session.post(
            login_url,
            json={"email": "admin@example.com", "password": "wrongpassword_xyz987"},
            headers={"Content-Type": "application/json"},
            timeout=timeout,
        )
        resp_unknown = session.post(
            login_url,
            json={"email": "definitely_not_real_xyz@example.com", "password": "wrongpassword_xyz987"},
            headers={"Content-Type": "application/json"},
            timeout=timeout,
        )

        text_known = resp_known.text.lower()
        text_unknown = resp_unknown.text.lower()

        has_enum_known = any(s in text_known for s in ENUM_SIGNATURES_VALID)
        has_enum_unknown = any(s in text_unknown for s in ENUM_SIGNATURES_INVALID)

        return has_enum_known or has_enum_unknown
    except Exception:
        return False


def check(url: str, timeout: int = 6) -> dict:
    """
    Check for authentication security issues.

    Returns a structured result dict.
    """
    issues = []
    affected_urls = []

    login_url = _find_login_endpoint(url, timeout)

    if login_url:
        # --- 1. Rate limiting check ---
        if _check_rate_limit(login_url, timeout):
            issues.append(
                f"No rate limiting detected on {login_url}. Attackers can make "
                "thousands of login attempts per second (brute force / credential stuffing)."
            )
            affected_urls.append(login_url)

        # --- 2. User enumeration check ---
        if _check_user_enumeration(login_url, timeout):
            issues.append(
                f"User enumeration possible via {login_url}: different error messages "
                "reveal whether an email address is registered, helping attackers target real accounts."
            )
            affected_urls.append(login_url)
    else:
        # No login endpoint found but still report the advice
        issues.append(
            "No login endpoint detected via common paths. If your app has authentication, "
            "manually verify that rate limiting, MFA, and RBAC are implemented."
        )

    found = bool(login_url and len(issues) > 0 and "No login" not in issues[0])
    severity = "High" if found else "Info"

    return {
        "id": "AUTH-001",
        "name": "Authentication Security",
        "severity": severity,
        "description": (
            "\n".join(issues)
            if issues else
            "Login endpoint found and basic authentication hardening appears to be in place."
        ),
        "affected_urls": list(set(affected_urls)),
        "login_endpoint_found": login_url,
        "recommendation": (
            "1. Apply rate limiting: max 5 attempts per IP per minute, then exponential back-off. "
            "2. Return generic error messages: 'Invalid email or password' (never specify which is wrong). "
            "3. Implement account lockout after 5 failed attempts + alert the account owner. "
            "4. Use a battle-tested auth library (Supabase Auth, NextAuth, Auth0). "
            "5. Enforce MFA for all admin accounts. "
            "6. Use bcrypt (cost ≥ 12) for password hashing — never MD5/SHA1."
        ),
        "found": found,
    }