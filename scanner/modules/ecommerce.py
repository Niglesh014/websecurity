"""
eCommerce-Specific Security Scanner Module
Checks for issues specific to online stores:
  - Payment data handling indicators (PCI DSS risk)
  - Price validation signals (client-side pricing risk)
  - CORS misconfiguration (wildcard * in production)
  - Subresource Integrity (SRI) on CDN scripts
  - JWT in localStorage (detectable via source inspection)
"""

import requests
from bs4 import BeautifulSoup
import re


# Patterns suggesting raw card data may be handled
CARD_DATA_PATTERNS = [
    re.compile(r"(?i)card[_\-]?number"),
    re.compile(r"(?i)cvv|cvc|card[_\-]?security"),
    re.compile(r"(?i)expir"),
    re.compile(r"(?i)credit[_\-]?card"),
]

# Patterns suggesting client-side price calculation
CLIENT_PRICE_PATTERNS = [
    re.compile(r"(?i)total\s*=\s*price\s*\*"),
    re.compile(r"(?i)calculateTotal|computePrice|getCartTotal"),
    re.compile(r"(?i)localStorage\.setItem\(['\"]price"),
    re.compile(r"(?i)sessionStorage\.setItem\(['\"]price"),
]

# Patterns indicating JWT stored in localStorage (bad practice)
LOCALSTORAGE_JWT_PATTERNS = [
    re.compile(r"(?i)localStorage\.setItem\(['\"](?:token|jwt|access_token|auth_token)"),
    re.compile(r"(?i)localStorage\.getItem\(['\"](?:token|jwt|access_token|auth_token)"),
]


def check(url: str, timeout: int = 6) -> dict:
    """
    Check for eCommerce-specific security issues.

    Returns a structured result dict.
    """
    issues = []
    affected_urls = []

    try:
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        headers = resp.headers
        source = resp.text
        soup = BeautifulSoup(source, "html.parser")

        # --- 1. CORS Wildcard ---
        acao = headers.get("Access-Control-Allow-Origin", "")
        if acao == "*":
            issues.append(
                "CORS wildcard (*) detected: ANY website can call your API. "
                "In production, only list your trusted frontend domains."
            )
            affected_urls.append(url)

        # --- 2. CDN Scripts without Subresource Integrity (SRI) ---
        scripts = soup.find_all("script", src=True)
        sri_missing = []
        for script in scripts:
            src = script.get("src", "")
            if any(cdn in src for cdn in ["cdn.", "cdnjs.", "unpkg.", "jsdelivr.", "googleapis."]):
                if not script.get("integrity"):
                    sri_missing.append(src[:80])
        if sri_missing:
            issues.append(
                f"{len(sri_missing)} CDN script(s) loaded without Subresource Integrity (SRI) hash. "
                "If the CDN is compromised, attackers can run arbitrary code on your site. "
                f"Examples: {', '.join(sri_missing[:2])}"
            )
            affected_urls.append(url)

        # --- 3. JWT in localStorage ---
        for pattern in LOCALSTORAGE_JWT_PATTERNS:
            if pattern.search(source):
                issues.append(
                    "JWT/auth token stored in localStorage detected. "
                    "localStorage is accessible to any JavaScript on the page — "
                    "an XSS attack can steal the token instantly. "
                    "Use HttpOnly cookies instead."
                )
                affected_urls.append(url)
                break

        # --- 4. Card data form fields (PCI DSS risk indicator) ---
        for pattern in CARD_DATA_PATTERNS:
            if pattern.search(source):
                issues.append(
                    "HTML forms suggest raw payment card data may be collected directly. "
                    "PCI DSS violation: never handle raw card numbers. "
                    "Use Stripe.js or Razorpay — they tokenise card data so your server never sees it. "
                    "PCI DSS fines: $5,000–$100,000/month."
                )
                affected_urls.append(url)
                break

        # --- 5. Client-side price calculation ---
        for pattern in CLIENT_PRICE_PATTERNS:
            if pattern.search(source):
                issues.append(
                    "Client-side price calculation detected. "
                    "Attackers can modify prices to $0.01 via browser DevTools or intercepting requests. "
                    "ALWAYS recalculate the total server-side from the database before charging."
                )
                affected_urls.append(url)
                break

    except Exception as e:
        return {
            "id": "ECOM-001",
            "name": "eCommerce Security",
            "severity": "Error",
            "description": f"Could not scan {url}: {e}",
            "affected_urls": [url],
            "recommendation": "Ensure the URL is reachable and retry.",
            "found": False,
        }

    found = bool(issues)
    severity = "Critical" if any("PCI" in i or "card" in i.lower() for i in issues) else \
               "High" if found else "Info"

    return {
        "id": "ECOM-001",
        "name": "eCommerce-Specific Security",
        "severity": severity,
        "description": (
            "\n".join(f"• {i}" for i in issues)
            if found else
            "No eCommerce-specific security issues detected."
        ),
        "affected_urls": list(set(affected_urls)),
        "recommendation": (
            "Summary of required actions:\n"
            "1. CORS: restrict Access-Control-Allow-Origin to your specific domain(s).\n"
            "2. SRI: generate integrity hashes for all CDN scripts at https://www.srihash.org/.\n"
            "3. Auth tokens: move from localStorage → HttpOnly cookies.\n"
            "4. Payments: delegate entirely to Stripe/Razorpay — never touch raw card data.\n"
            "5. Pricing: always recalculate totals server-side before any payment call."
            if found else "No action required."
        ),
        "found": found,
    }