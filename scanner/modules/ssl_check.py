"""
HTTPS / SSL-TLS Scanner Module
Checks whether the site enforces HTTPS, redirects HTTP → HTTPS,
and whether the SSL certificate is valid and not expired.
"""

import requests
import socket
import ssl
from datetime import datetime


def _check_ssl_cert(hostname: str) -> dict:
    """Connect via SSL and inspect the certificate."""
    result = {"valid": False, "expires": None, "days_left": None, "error": None}
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.create_connection((hostname, 443), timeout=6),
                             server_hostname=hostname) as s:
            cert = s.getpeercert()
            expire_str = cert.get("notAfter", "")
            if expire_str:
                expire_dt = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z")
                days_left = (expire_dt - datetime.utcnow()).days
                result.update({
                    "valid": True,
                    "expires": expire_dt.strftime("%Y-%m-%d"),
                    "days_left": days_left,
                })
    except ssl.SSLCertVerificationError as e:
        result["error"] = f"Certificate verification failed: {e}"
    except ssl.SSLError as e:
        result["error"] = f"SSL error: {e}"
    except Exception as e:
        result["error"] = f"Could not connect on port 443: {e}"
    return result


def check(url: str, timeout: int = 6) -> dict:
    """
    Check HTTPS enforcement and SSL certificate health.

    Returns a structured result dict.
    """
    issues = []
    affected_urls = []

    # --- 1. Is the site using HTTPS at all? ---
    using_https = url.startswith("https://")
    if not using_https:
        issues.append("Site is served over plain HTTP — all traffic is unencrypted.")
        affected_urls.append(url)

    # --- 2. Does HTTP redirect to HTTPS? ---
    http_url = url.replace("https://", "http://") if using_https else url
    try:
        resp = requests.get(http_url, timeout=timeout, allow_redirects=False)
        if resp.status_code in (301, 302, 307, 308):
            location = resp.headers.get("Location", "")
            if not location.startswith("https://"):
                issues.append(
                    "HTTP does not redirect to HTTPS — plain HTTP is still accessible."
                )
                affected_urls.append(http_url)
        else:
            # Site responds normally over HTTP (no redirect)
            issues.append("HTTP endpoint is live with no HTTPS redirect.")
            affected_urls.append(http_url)
    except Exception:
        pass  # HTTP endpoint may be dead, which is fine

    # --- 3. SSL certificate validity ---
    try:
        from urllib.parse import urlparse
        hostname = urlparse(url).hostname or url
    except Exception:
        hostname = url

    cert_info = _check_ssl_cert(hostname)
    cert_issues = []

    if cert_info["error"]:
        cert_issues.append(cert_info["error"])
        affected_urls.append(url)
    elif cert_info["days_left"] is not None:
        if cert_info["days_left"] < 0:
            cert_issues.append("SSL certificate has EXPIRED.")
            affected_urls.append(url)
        elif cert_info["days_left"] < 14:
            cert_issues.append(
                f"SSL certificate expires in {cert_info['days_left']} days — renew immediately."
            )
        elif cert_info["days_left"] < 30:
            cert_issues.append(
                f"SSL certificate expires in {cert_info['days_left']} days — plan renewal soon."
            )

    issues.extend(cert_issues)
    found = bool(issues)

    # Determine severity
    if not using_https or (cert_info.get("error") and "expired" in str(cert_info.get("error","")).lower()):
        severity = "High"
    elif issues:
        severity = "Medium"
    else:
        severity = "Info"

    return {
        "id": "SSL-001",
        "name": "HTTPS / SSL-TLS Configuration",
        "severity": severity if found else "Info",
        "description": (
            "HTTPS issues detected: " + " | ".join(issues)
            if found else
            f"HTTPS is properly enforced. Certificate valid until {cert_info.get('expires', 'unknown')} "
            f"({cert_info.get('days_left', '?')} days remaining)."
        ),
        "affected_urls": list(set(affected_urls)),
        "cert_expires": cert_info.get("expires"),
        "cert_days_left": cert_info.get("days_left"),
        "recommendation": (
            "1. Install a free SSL certificate via Let's Encrypt (certbot). "
            "2. Configure your server to redirect all HTTP traffic to HTTPS (301). "
            "3. Add the Strict-Transport-Security header to prevent SSL-stripping. "
            "4. Enable automatic certificate renewal (certbot renew --dry-run)."
            if found else "No action required."
        ),
        "found": found,
    }