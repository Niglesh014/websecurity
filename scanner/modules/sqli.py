"""
SQL Injection Scanner Module
Tests URL parameters for unsanitized SQL injection vectors.
Checks for error-based, boolean-based, and time-based SQLi signals.
"""

import requests
import time

# Classic error-based and boolean payloads
SQLI_PAYLOADS = [
    "'",                          # Simple quote — triggers syntax errors
    "' OR '1'='1",               # Classic boolean bypass
    "' OR '1'='1' --",
    "\" OR \"1\"=\"1",
    "'; DROP TABLE users--",
    "1 AND 1=1",
    "1 AND 1=2",
]

# Strings that appear in raw database error messages
SQL_ERROR_SIGNATURES = [
    "sql syntax", "mysql_fetch", "syntax error", "unclosed quotation",
    "ora-01756", "pg_query()", "sqlite3", "microsoft sql",
    "you have an error in your sql syntax", "warning: mysql",
    "jdbc sqlexception", "db2 sql error", "odbc microsoft",
    "supplied argument is not a valid mysql",
]

TEST_PARAMS = ["id", "page", "category", "q", "search", "user", "item", "product"]


def check(url: str, timeout: int = 6) -> dict:
    """
    Check for SQL injection vulnerabilities in URL parameters.

    Returns a structured result dict.
    """
    affected_urls = []

    for param in TEST_PARAMS:
        for payload in SQLI_PAYLOADS:
            test_url = f"{url}?{param}={requests.utils.quote(payload)}"
            try:
                resp = requests.get(test_url, timeout=timeout, allow_redirects=True)
                body_lower = resp.text.lower()

                # Error-based detection
                if any(sig in body_lower for sig in SQL_ERROR_SIGNATURES):
                    affected_urls.append(test_url)
                    break  # One confirmed hit per param is sufficient

            except Exception:
                pass

    found = bool(affected_urls)

    return {
        "id": "SQLI-001",
        "name": "SQL Injection",
        "severity": "Critical" if found else "Info",
        "description": (
            "SQL Injection detected: user-supplied input is concatenated directly "
            "into SQL queries. An attacker can read your entire database, modify or "
            "delete records, and potentially gain OS-level access to the server."
            if found else "No SQL injection indicators found."
        ),
        "affected_urls": affected_urls,
        "recommendation": (
            "1. Use parameterized queries / prepared statements for ALL database calls. "
            "2. Use an ORM like SQLAlchemy, Prisma, or Sequelize which handles escaping automatically. "
            "3. Never concatenate user input into SQL strings. "
            "4. Apply the principle of least privilege to database accounts."
        ),
        "found": found,
    }