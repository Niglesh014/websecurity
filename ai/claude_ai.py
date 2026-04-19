"""
ai/claude_ai.py  —  SecuritySentinel v3.0
All Claude API calls live here.

Two public functions:
  enhance_with_ai(vulnerabilities)  — batch enrich vulns with AI explanation + fix
  ai_risk_analysis(page_content, url) — deep page analysis for AI-specific risks

Plus one utility:
  _reload_client()  — called by main.py after .env is loaded so the client
                      picks up the key even if it wasn't set at import time
"""

import os
import json
import re
import anthropic

MODEL      = "claude-sonnet-4-20250514"
MAX_TOKENS = 2000

# ── Client initialised at import — may be None if key not set yet ─────────────
_api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
client   = anthropic.Anthropic(api_key=_api_key) if _api_key else None


def _reload_client():
    """
    Re-initialise the Anthropic client after main.py loads the .env file.
    Called explicitly from main.py right after _load_dotenv().
    """
    global client, _api_key
    _api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if _api_key and _api_key.startswith("sk-ant"):
        client = anthropic.Anthropic(api_key=_api_key)
        print(f"[claude_ai] Client initialised: {_api_key[:12]}...{_api_key[-4:]}")
    else:
        client = None
        print("[claude_ai] No valid API key — AI features disabled")


def _clean_json(text: str) -> str:
    """Strip markdown code fences before json.loads."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$",          "", text)
    return text.strip()


# ══════════════════════════════════════════════════════════════════════════════
# FUNCTION 1 — enhance_with_ai
# ══════════════════════════════════════════════════════════════════════════════

def enhance_with_ai(vulnerabilities: list) -> list:
    """
    Send ALL vulnerabilities to Claude in ONE batch API call.

    Claude adds two fields per finding:
      ai_explanation — plain English (beginner-friendly, 2-3 sentences)
      ai_fix         — 2-3 concrete developer steps to fix it

    Gracefully degrades if API key missing or call fails.
    """
    if not client or not vulnerabilities:
        return vulnerabilities

    vuln_list = "\n".join(
        f"{i+1}. Name: {v.get('name','Unknown')}"
        f" | Severity: {v.get('severity','?')}"
        f" | Description: {str(v.get('description',''))[:200]}"
        for i, v in enumerate(vulnerabilities)
    )

    prompt = f"""You are a security expert explaining vulnerabilities to a beginner developer.

Here are {len(vulnerabilities)} vulnerabilities found by a scanner:

{vuln_list}

Return ONLY a valid JSON array (no markdown, no preamble) with exactly {len(vulnerabilities)} objects.
Each object must have these exact keys:
  "index"          : integer (1-based, matching the list above)
  "ai_explanation" : string (2-3 plain English sentences — what it is and why it's dangerous)
  "ai_fix"         : string (2-3 concrete developer steps, fastest win first)

Return ONLY the JSON array. No other text."""

    try:
        # ── CLAUDE API CALL ───────────────────────────────────────────────────
        response = client.messages.create(
            model      = MODEL,
            max_tokens = MAX_TOKENS,
            messages   = [{"role": "user", "content": prompt}],
        )
        # ─────────────────────────────────────────────────────────────────────

        raw        = response.content[0].text
        ai_results = json.loads(_clean_json(raw))
        ai_map     = {item["index"]: item for item in ai_results if "index" in item}

        for i, vuln in enumerate(vulnerabilities):
            entry = ai_map.get(i + 1, {})
            vuln["ai_explanation"] = entry.get("ai_explanation", "")
            vuln["ai_fix"]         = entry.get("ai_fix", "")

        return vulnerabilities

    except json.JSONDecodeError:
        for v in vulnerabilities:
            v.setdefault("ai_explanation", "AI analysis unavailable for this finding.")
            v.setdefault("ai_fix",         "Review the recommendation in the Technical Detail tab.")
        return vulnerabilities

    except Exception as e:
        print(f"[claude_ai] enhance_with_ai error: {e}")
        return vulnerabilities


# ══════════════════════════════════════════════════════════════════════════════
# FUNCTION 2 — ai_risk_analysis
# ══════════════════════════════════════════════════════════════════════════════

def ai_risk_analysis(page_content: str, url: str = "") -> dict:
    """
    Deep-analyse raw page HTML with Claude.

    Detects:
      • Prompt Injection — hidden text targeting AI agents
      • Exposed Secrets  — API keys / tokens visible in source
      • Insecure AI      — LLM endpoints, debug flags, unsafe patterns
      • OWASP Top-10     — signals in the page source

    Returns structured dict with summary, overall_risk, ai_risks[], owasp_signals[].
    """
    empty = {
        "summary":       "AI analysis not available — ANTHROPIC_API_KEY not set.",
        "overall_risk":  "Unknown",
        "ai_risks":      [],
        "owasp_signals": [],
    }

    if not client:
        return empty

    content_snippet = (page_content or "")[:8000]
    if not content_snippet.strip():
        return {
            "summary":       "Page source could not be fetched for AI analysis.",
            "overall_risk":  "Unknown",
            "ai_risks":      [],
            "owasp_signals": [],
        }

    prompt = f"""You are a senior application security researcher analysing the HTML source of a webpage.

URL: {url}

PAGE SOURCE (first 8000 characters):
\"\"\"
{content_snippet}
\"\"\"

Analyse this page for security risks. Return ONLY a valid JSON object (no markdown):

{{
  "summary": "2-3 sentence plain-English summary of the overall security posture",
  "overall_risk": "one of: Critical, High, Medium, Low",
  "ai_risks": [
    {{
      "type": "one of: Prompt Injection, Exposed API Key, Exposed Secret, Insecure AI Pattern, Sensitive Data Exposure",
      "severity": "one of: Critical, High, Medium, Low",
      "detail": "specific evidence found in the source",
      "recommendation": "1-2 sentence fix"
    }}
  ],
  "owasp_signals": [
    {{
      "category": "OWASP Top-10 category (e.g. A03 Injection)",
      "risk": "one of: Critical, High, Medium, Low",
      "evidence": "1 sentence describing the signal in the source"
    }}
  ]
}}

Rules:
- ai_risks: only include REAL findings — return [] if nothing detected
- owasp_signals: only include categories with actual evidence
- Return ONLY the JSON object. No explanation, no markdown."""

    try:
        # ── CLAUDE API CALL ───────────────────────────────────────────────────
        response = client.messages.create(
            model      = MODEL,
            max_tokens = MAX_TOKENS,
            messages   = [{"role": "user", "content": prompt}],
        )
        # ─────────────────────────────────────────────────────────────────────

        result = json.loads(_clean_json(response.content[0].text))
        result.setdefault("summary",       "Analysis complete.")
        result.setdefault("overall_risk",  "Unknown")
        result.setdefault("ai_risks",      [])
        result.setdefault("owasp_signals", [])
        return result

    except json.JSONDecodeError:
        return {
            "summary":       "AI returned non-JSON output. Partial analysis only.",
            "overall_risk":  "Unknown",
            "ai_risks":      [],
            "owasp_signals": [],
        }
    except Exception as e:
        print(f"[claude_ai] ai_risk_analysis error: {e}")
        return empty