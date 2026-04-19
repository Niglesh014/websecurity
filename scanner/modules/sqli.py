"""SQL Injection Scanner — fast version."""

import requests

SQLI_PAYLOADS = ["'", "' OR '1'='1", "1 AND 1=2"]   # reduced from 5
SQL_ERRORS    = ["sql syntax","mysql_fetch","syntax error","unclosed quotation",
                 "pg_query()","sqlite3","you have an error in your sql syntax","warning: mysql"]
TEST_PARAMS   = ["id", "q", "search", "category"]   # reduced from 8


def _get(url, timeout):
    return requests.get(url, timeout=(2, timeout), allow_redirects=True,
                        headers={"User-Agent":"SecuritySentinel/3.0"})


def check(url: str, timeout: int = 5) -> dict:
    affected_urls = []

    for param in TEST_PARAMS:
        for payload in SQLI_PAYLOADS:
            test_url = f"{url}?{param}={requests.utils.quote(payload)}"
            try:
                resp = _get(test_url, timeout)
                if any(sig in resp.text.lower() for sig in SQL_ERRORS):
                    affected_urls.append(test_url)
                    break
            except Exception:
                pass

    found = bool(affected_urls)
    return {
        "id":"SQLI-001", "name":"SQL Injection",
        "severity":"critical" if found else "info",
        "description":("SQL Injection detected — user input concatenated into SQL queries." if found else "No SQL injection indicators found."),
        "affected_urls":affected_urls,
        "businessImpact":"Attacker can steal ALL customer records and credentials in minutes — GDPR fines up to 4% of annual turnover.",
        "tech":"User-supplied input concatenated directly into SQL queries without parameterization.",
        "example":"SELECT * FROM users\nWHERE email = '' OR 1=1 --'\nAND password = 'anything'",
        "fix":"Use parameterized queries / prepared statements.",
        "effort":"2–4 hours dev time",
        "recommendation":"1. Use parameterized queries for ALL database calls.\n2. Use an ORM (Prisma, Sequelize, SQLAlchemy).\n3. Never concatenate user input into SQL.",
        "found":found,
    }