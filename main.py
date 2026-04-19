"""
SecuritySentinel — Flask Backend v3.0 (AI-Powered)
Fixed API key loading for Windows — reads from .env file directly
so you never have to set environment variables manually again.

HOW TO SET YOUR API KEY (choose ONE method):

METHOD 1 (Easiest) — Create a .env file next to main.py:
  Create file:  security/.env
  Add line:     ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

METHOD 2 — PowerShell (must run BEFORE python main.py in same terminal):
  $env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR_KEY_HERE"
  python main.py

METHOD 3 — Set it permanently in Windows:
  [System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY","sk-ant-api03-...", "User")
  Then restart PowerShell and run python main.py
"""

import os
import sys
import requests as req_lib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Load .env file FIRST before anything else ─────────────────────────────────
def _load_dotenv():
    """
    Manually load .env file from the same directory as main.py.
    Works on Windows without needing python-dotenv installed.
    """
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(env_path):
        return False

    loaded = 0
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Skip comments and blank lines
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                key   = key.strip()
                value = value.strip().strip('"').strip("'")  # remove surrounding quotes
                if key and value:
                    os.environ[key] = value
                    loaded += 1
    return loaded > 0

_dotenv_loaded = _load_dotenv()

# ── NOW import scanner and AI (they read env vars at import time) ─────────────
import scanner
from ai.claude_ai import enhance_with_ai, ai_risk_analysis, _reload_client

# Reload the claude client with the freshly loaded key
_reload_client()

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]}})


def _get_key_status():
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    return bool(key) and key.startswith("sk-ant")


# ── GET /health ───────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":     "ok",
        "service":    "SecuritySentinel v3 (AI-Powered)",
        "ai_enabled": _get_key_status(),
        "dotenv":     _dotenv_loaded,
    })


# ── POST /scan ────────────────────────────────────────────────────────────────
@app.route("/scan", methods=["POST"])
def scan_endpoint():
    data = request.get_json(silent=True) or {}
    url  = str(data.get("url", "")).strip()

    if not url:
        return jsonify({"error": "Request body must include a 'url' field."}), 400

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    key_set = _get_key_status()

    try:
        # STEP 1 — Run all 9 scanner modules concurrently
        report          = scanner.scan(url)
        vulnerabilities = report.get("vulnerabilities", [])

        # STEP 2 — Claude AI: batch enrich every vuln (ONE API call)
        if vulnerabilities and key_set:
            vulnerabilities = enhance_with_ai(vulnerabilities)
            report["vulnerabilities"] = vulnerabilities

        # STEP 3 — Claude AI: deep page source analysis (ONE API call)
        page_content = _fetch_page_source(url)
        if key_set:
            ai_analysis = ai_risk_analysis(page_content, url)
        else:
            ai_analysis = {
                "summary":       "ANTHROPIC_API_KEY not set. See instructions at top of main.py.",
                "overall_risk":  "Unknown",
                "ai_risks":      [],
                "owasp_signals": [],
            }

        return jsonify({
            "status":          "success",
            "url":             report["url"],
            "scan_duration_s": report["scan_duration_s"],
            "summary":         report["summary"],
            "vulnerabilities": vulnerabilities,
            "findings":        report.get("findings", []),
            "ai_analysis":     ai_analysis,
            "ai_enabled":      key_set,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Scan failed: {str(e)}"}), 500


# ── POST /ai-summary ──────────────────────────────────────────────────────────
@app.route("/ai-summary", methods=["POST"])
def ai_summary_endpoint():
    data  = request.get_json(silent=True) or {}
    vulns = data.get("vulnerabilities", [])
    url   = data.get("url", "the scanned site")

    key_set = _get_key_status()

    if not key_set:
        text = (
            "No vulnerabilities detected. Your site looks safe — keep scanning monthly."
            if not vulns else
            f"Your site has {len(vulns)} finding(s). Follow the remediation roadmap below to fix them."
        )
        return jsonify({"content": [{"type": "text", "text": text}]})

    vuln_list = (
        "No vulnerabilities found."
        if not vulns else
        "\n".join(
            f"{i+1}. {v.get('name','Unknown')} ({v.get('severity','?')})"
            for i, v in enumerate(vulns[:15])
        )
    )

    prompt = (
        f"You are a friendly security advisor for a small business owner with no technical background.\n\n"
        f"A security scan of {url} found:\n{vuln_list}\n\n"
        f"Write 3-4 plain English sentences explaining the business risk and urgency.\n"
        f"No bullet points. No jargon. Be honest but not alarmist.\n"
        f"If nothing was found, say the site looks safe and recommend monthly scans."
    )

    try:
        from ai.claude_ai import client, MODEL
        if not client:
            raise Exception("Claude client not initialized")

        response = client.messages.create(
            model      = MODEL,
            max_tokens = 300,
            messages   = [{"role": "user", "content": prompt}],
        )
        text = response.content[0].text
        return jsonify({"content": [{"type": "text", "text": text}]})

    except Exception as e:
        print(f"[ai-summary] error: {e}")
        fallback = (
            "No vulnerabilities found. Keep scanning monthly."
            if not vulns else
            "Security issues detected. Review the findings below and follow the fix roadmap."
        )
        return jsonify({"content": [{"type": "text", "text": fallback}]})


# ── helper ────────────────────────────────────────────────────────────────────
def _fetch_page_source(url: str, timeout: int = 8) -> str:
    try:
        r = req_lib.get(
            url, timeout=timeout, allow_redirects=True,
            headers={"User-Agent": "SecuritySentinel/3.0"},
        )
        return r.text[:10000]
    except Exception:
        return ""


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    key_set = _get_key_status()
    key     = os.environ.get("ANTHROPIC_API_KEY", "")

    print("\n" + "=" * 62)
    print("  SecuritySentinel v3.0 — AI-Powered Scanner")
    print("  http://localhost:5000")
    print("-" * 62)

    if _dotenv_loaded:
        print("  ✓ .env file loaded")

    if key_set:
        print(f"  ✓ ANTHROPIC_API_KEY detected: {key[:12]}...{key[-4:]}")
        print("  ✓ Claude AI is ACTIVE")
    else:
        print("  ✗ ANTHROPIC_API_KEY NOT FOUND")
        print("")
        print("  FIX — Create a file called  .env  next to main.py")
        print("  with this content (no quotes):")
        print("")
        print("    ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE")
        print("")
        print("  OR run in PowerShell BEFORE python main.py:")
        print('    $env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR_KEY"')

    print("-" * 62)
    print("  POST /scan       { url: 'https://target.com' }")
    print("  POST /ai-summary { vulnerabilities: [...] }")
    print("  GET  /health")
    print("=" * 62 + "\n")

    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)