"""
SecuritySentinel — Flask API
Entry point for the security scanner backend.

Run with:
    pip install flask flask-cors requests beautifulsoup4
    python main.py

Endpoints:
    POST /scan      { "url": "https://example.com" }
    GET  /health    → { "status": "ok" }
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import scanner  # The scanner package in the same directory

app = Flask(__name__)

# Allow requests from your Vite dev server and production frontend
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",   # Vite default
            "http://localhost:3000",   # CRA / Next.js
            "http://localhost:4173",   # Vite preview
            # Add your production domain here, e.g.:
            # "https://yourdomain.com"
        ]
    }
})


@app.route("/health", methods=["GET"])
def health():
    """Simple health check endpoint."""
    return jsonify({"status": "ok", "service": "SecuritySentinel Scanner"})


@app.route("/scan", methods=["POST"])
def scan():
    """
    Run a full security scan against the provided URL.

    Request body (JSON):
        { "url": "https://example.com" }

    Response (JSON):
        {
            "url": "https://example.com",
            "scan_duration_s": 12.4,
            "summary": {
                "score": 45,
                "grade": "D",
                "total_issues": 4,
                "severity_counts": { "Critical": 2, "High": 1, "Medium": 1, ... },
                "modules_run": 9
            },
            "findings": [ ...all module results... ],
            "vulnerabilities": [ ...only findings where found=true... ]
        }
    """
    data = request.get_json(silent=True)
    if not data or not data.get("url"):
        return jsonify({"error": "Request body must include a 'url' field."}), 400

    url = str(data["url"]).strip()
    if not url:
        return jsonify({"error": "URL cannot be empty."}), 400

    try:
        report = scanner.scan(url)
        return jsonify(report)
    except Exception as e:
        return jsonify({"error": f"Scan failed: {str(e)}"}), 500


if __name__ == "__main__":
    print("=" * 55)
    print("  SecuritySentinel Scanner Backend")
    print("  Listening on http://localhost:5000")
    print("  POST /scan  { url: 'https://your-site.com' }")
    print("=" * 55)
    app.run(port=5000, debug=False)