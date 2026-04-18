"""
SecuritySentinel — Flask API
Run with:
    pip install flask flask-cors requests beautifulsoup4
    python main.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import scanner  # your scanner package

app = Flask(__name__)

# ✅ CORS (allow frontend)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:4173",
        ]
    }
})

# ─────────────────────────────────────────────
# ✅ HEALTH CHECK
# ─────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "SecuritySentinel Scanner"
    })


# ─────────────────────────────────────────────
# ✅ SCAN ENDPOINT
# ─────────────────────────────────────────────
@app.route("/scan", methods=["POST"])
def scan():
    data = request.get_json(silent=True)

    if not data or not data.get("url"):
        return jsonify({"error": "Request must include 'url'"}), 400

    url = str(data["url"]).strip()

    if not url.startswith("http"):
        return jsonify({"error": "Invalid URL (include http/https)"}), 400

    try:
        report = scanner.scan(url)

        return jsonify(report)

    except Exception as e:
        return jsonify({"error": f"Scan failed: {str(e)}"}), 500


# ─────────────────────────────────────────────
# ✅ AI SUMMARY (Claude)
# ─────────────────────────────────────────────
@app.route("/ai-summary", methods=["POST"])
def ai_summary():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Missing request body"}), 400

    vulns = data.get("vulnerabilities", [])

    # Convert vulnerabilities into readable text
    if len(vulns) == 0:
        vuln_text = "No vulnerabilities found."
    else:
        vuln_text = "\n".join([
            f"{i+1}. {v.get('name')} ({v.get('severity')})"
            for i, v in enumerate(vulns)
        ])

    prompt = f"""
You are a cybersecurity advisor explaining risks to a small business owner.

Scan Results:
{vuln_text}

Instructions:
- Write 3–4 simple sentences
- No technical jargon
- Explain business impact (money, reputation, customers)
- If no issues → say site looks safe but suggest regular scans
"""

    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": "YOUR_API_KEY_HERE",   # 🔴 PUT YOUR KEY
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        data = response.json()

        # Extract clean text
        text = ""
        if "content" in data:
            for block in data["content"]:
                if block["type"] == "text":
                    text += block["text"]

        return jsonify({"summary": text.strip()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# 🚀 RUN SERVER
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  SecuritySentinel Backend Running")
    print("  http://localhost:5000")
    print("  POST /scan")
    print("  POST /ai-summary")
    print("=" * 55)

    app.run(port=5000, debug=True)