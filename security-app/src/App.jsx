import { useState, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AI summary is handled SERVER-SIDE via POST /ai-summary on the Flask backend.
// Set your Anthropic key on the server:  export ANTHROPIC_API_KEY=sk-ant-xxx
// The key never touches the browser — no .env needed on the frontend.
// ─────────────────────────────────────────────────────────────────────────────

const API = "http://localhost:5000";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');`;

const styles = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080b0f; --surface: #0d1117; --surface2: #161b22;
    --border: #21262d; --accent: #f0a500; --accent2: #e05a5a;
    --accent3: #4fc3a1; --accent4: #5b8dee; --text: #e6edf3;
    --muted: #7d8590; --critical: #f85149; --high: #f0a500;
    --medium: #3fb950; --low: #4fc3a1;
    --font-mono: 'Space Mono', monospace;
    --font-sans: 'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-sans); min-height: 100vh; }
  .app { min-height: 100vh; background: var(--bg); position: relative; overflow: hidden; }

  .grid-bg {
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(240,165,0,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(240,165,0,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }
  .glow-orb { position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0; }
  .orb1 { width: 600px; height: 600px; background: rgba(240,165,0,0.04); top: -200px; right: -100px; }
  .orb2 { width: 400px; height: 400px; background: rgba(224,90,90,0.04); bottom: -100px; left: -100px; }

  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

  .header {
    border-bottom: 1px solid var(--border); padding: 20px 0;
    background: rgba(8,11,15,0.8); backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
  }
  .header-inner { display: flex; align-items: center; gap: 16px; }
  .logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 18px; box-shadow: 0 0 20px rgba(240,165,0,0.3);
  }
  .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .logo-text span { color: var(--accent); }
  .header-badge {
    margin-left: auto; font-family: var(--font-mono); font-size: 10px;
    padding: 4px 10px; border: 1px solid var(--border); border-radius: 20px;
    color: var(--muted); background: var(--surface);
  }

  .hero { padding: 60px 0 40px; text-align: center; }
  .hero-eyebrow {
    font-family: var(--font-mono); font-size: 11px; color: var(--accent);
    letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .eyebrow-line { width: 30px; height: 1px; background: var(--accent); opacity: 0.5; }
  .hero h1 { font-size: clamp(36px,6vw,64px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; margin-bottom: 18px; }
  .hero h1 em { font-style: normal; color: var(--accent); }
  .hero p { font-size: 17px; color: var(--muted); max-width: 540px; margin: 0 auto 40px; line-height: 1.7; font-weight: 400; }

  .scanner-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 28px; max-width: 680px; margin: 0 auto; box-shadow: 0 0 60px rgba(0,0,0,0.4);
  }
  .input-row { display: flex; gap: 12px; flex-wrap: wrap; }
  .url-input {
    flex: 1; min-width: 200px; background: var(--bg); border: 1px solid var(--border);
    border-radius: 10px; padding: 14px 16px; font-family: var(--font-mono); font-size: 13px;
    color: var(--text); outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .url-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(240,165,0,0.1); }
  .url-input::placeholder { color: var(--muted); }

  .scan-btn {
    padding: 14px 28px; background: linear-gradient(135deg, var(--accent), #d4920a);
    color: #000; font-family: var(--font-sans); font-weight: 700; font-size: 14px;
    border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 8px; white-space: nowrap;
  }
  .scan-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(240,165,0,0.3); }
  .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .scan-options { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .opt-chip {
    font-family: var(--font-mono); font-size: 11px; padding: 5px 12px;
    border-radius: 20px; border: 1px solid var(--border); cursor: pointer;
    transition: all 0.15s; color: var(--muted); background: transparent;
  }
  .opt-chip.active { background: rgba(240,165,0,0.1); border-color: var(--accent); color: var(--accent); }

  .scanning-view { text-align: center; padding: 60px 0; }
  .scan-ring {
    width: 120px; height: 120px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--accent);
    animation: spin 1s linear infinite; margin: 0 auto 24px; position: relative;
  }
  .scan-ring::after {
    content: '🛡️'; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%); font-size: 36px;
    animation: counterSpin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes counterSpin { to { transform: translate(-50%,-50%) rotate(-360deg); } }

  .scan-log {
    font-family: var(--font-mono); font-size: 12px; color: var(--muted);
    max-width: 480px; margin: 0 auto; text-align: left;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; min-height: 120px;
  }
  .log-line { margin-bottom: 4px; opacity: 0; animation: fadeIn 0.3s forwards; }
  .log-line.ok   { color: var(--accent3); }
  .log-line.warn { color: var(--accent); }
  .log-line.err  { color: var(--critical); }
  @keyframes fadeIn { to { opacity: 1; } }

  .results { padding: 0 0 80px; }

  .score-section {
    display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center;
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 32px; margin-bottom: 28px;
  }
  @media (max-width: 600px) { .score-section { grid-template-columns: 1fr; text-align: center; } }
  .score-circle {
    width: 120px; height: 120px; border-radius: 50%; border: 3px solid; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .score-num   { font-size: 42px; font-weight: 800; line-height: 1; }
  .score-label { font-family: var(--font-mono); font-size: 10px; color: var(--muted); letter-spacing: 1px; margin-top: 2px; }
  .score-grade-F { border-color: var(--critical); color: var(--critical); }
  .score-grade-D { border-color: #f07850; color: #f07850; }
  .score-grade-C { border-color: var(--high); color: var(--high); }
  .score-grade-B { border-color: #88c060; color: #88c060; }
  .score-grade-A { border-color: var(--medium); color: var(--medium); }
  .score-info h2    { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
  .score-info p     { color: var(--muted); font-size: 15px; line-height: 1.6; }
  .score-meta       { display: flex; gap: 20px; margin-top: 16px; flex-wrap: wrap; }
  .score-stat       { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
  .score-stat strong { color: var(--text); }

  .section-title {
    font-size: 20px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .vuln-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
  .vuln-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
  .vuln-card:hover { border-color: rgba(240,165,0,0.3); }
  .vuln-card.expanded { border-color: rgba(240,165,0,0.25); }

  .vuln-header { display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; user-select: none; }
  .severity-badge {
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 20px; letter-spacing: 1px; flex-shrink: 0;
  }
  .sev-critical { background: rgba(248,81,73,0.15); color: var(--critical); border: 1px solid rgba(248,81,73,0.3); }
  .sev-high     { background: rgba(240,165,0,0.12);  color: var(--high);     border: 1px solid rgba(240,165,0,0.3); }
  .sev-medium   { background: rgba(63,185,80,0.1);   color: var(--medium);   border: 1px solid rgba(63,185,80,0.3); }
  .sev-low      { background: rgba(79,195,161,0.1);  color: var(--low);      border: 1px solid rgba(79,195,161,0.3); }
  .sev-info     { background: rgba(125,133,144,0.1); color: var(--muted);    border: 1px solid rgba(125,133,144,0.2); }
  .vuln-name   { font-weight: 700; font-size: 15px; flex: 1; }
  .vuln-toggle { color: var(--muted); font-size: 18px; transition: transform 0.2s; }
  .vuln-toggle.open { transform: rotate(180deg); }

  /* two-column body */
  .vuln-body { border-top: 1px solid var(--border); display: grid; grid-template-columns: 1fr 1fr; }
  @media (max-width: 640px) { .vuln-body { grid-template-columns: 1fr; } }
  .vuln-col { padding: 20px; }
  .vuln-col + .vuln-col { border-left: 1px solid var(--border); }
  @media (max-width: 640px) { .vuln-col + .vuln-col { border-left: none; border-top: 1px solid var(--border); } }

  .vuln-col h4 {
    font-family: var(--font-mono); font-size: 10px; color: var(--muted);
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; margin-top: 0;
  }
  .vuln-col h4.mt { margin-top: 18px; }
  .vuln-col p      { font-size: 14px; color: var(--muted); line-height: 1.65; }
  .vuln-col p.bright { color: var(--text); }

  .code-block {
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    padding: 12px; font-family: var(--font-mono); font-size: 11px; color: var(--accent);
    overflow-x: auto; white-space: pre; line-height: 1.6; margin-top: 8px;
  }

  .tag-row   { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .fix-tag   { display: inline-flex; align-items: center; font-family: var(--font-mono); font-size: 10px; padding: 5px 12px; border-radius: 6px; background: rgba(79,195,161,0.1); color: var(--low); border: 1px solid rgba(79,195,161,0.25); }
  .effort-tag { display: inline-flex; align-items: center; font-family: var(--font-mono); font-size: 10px; padding: 5px 12px; border-radius: 6px; background: rgba(91,141,238,0.1); color: var(--accent4); border: 1px solid rgba(91,141,238,0.2); }

  .rec-list { margin-top: 4px; }
  .rec-item { display: flex; gap: 8px; font-size: 13px; color: var(--muted); margin-bottom: 7px; line-height: 1.5; }
  .rec-num  { font-family: var(--font-mono); font-size: 10px; color: var(--accent); flex-shrink: 0; padding-top: 1px; }

  .affected-url {
    display: block; font-family: var(--font-mono); font-size: 10px; color: var(--critical);
    background: rgba(248,81,73,0.07); border: 1px solid rgba(248,81,73,0.2);
    border-radius: 4px; padding: 4px 8px; margin: 3px 0; word-break: break-all;
  }

  .header-fix-item { margin-bottom: 10px; }
  .header-fix-name { font-family: var(--font-mono); font-size: 11px; color: var(--accent); margin-bottom: 3px; }
  .header-fix-cmd  { font-family: var(--font-mono); font-size: 10px; color: var(--muted); background: var(--bg); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border); }

  .risk-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; margin-bottom: 28px; }
  @media (max-width: 600px) { .risk-grid { grid-template-columns: 1fr; } }
  .risk-card       { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .risk-card-icon  { font-size: 28px; margin-bottom: 10px; }
  .risk-card-title { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
  .risk-card-text  { font-size: 13px; color: var(--muted); line-height: 1.6; }

  .roadmap { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-bottom: 28px; }
  .roadmap-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 20px; }
  @media (max-width: 700px) { .roadmap-grid { grid-template-columns: 1fr; } }
  .roadmap-phase { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .phase-num   { font-family: var(--font-mono); font-size: 10px; color: var(--muted); letter-spacing: 2px; margin-bottom: 8px; }
  .phase-title { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .phase-time  { font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-bottom: 14px; }
  .phase-item  { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--muted); margin-bottom: 8px; line-height: 1.4; }
  .phase-dot   { width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }

  .ai-powered {
    display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono);
    font-size: 10px; padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(91,141,238,0.3); color: var(--accent4);
    background: rgba(91,141,238,0.08); margin-bottom: 12px;
  }
  .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent4); animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .reset-btn {
    padding: 12px 24px; background: transparent; border: 1px solid var(--border);
    border-radius: 10px; color: var(--muted); font-family: var(--font-sans);
    font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; margin-bottom: 32px;
  }
  .reset-btn:hover { border-color: var(--accent); color: var(--accent); }

  .error-banner {
    background: rgba(248,81,73,0.08); border: 1px solid rgba(248,81,73,0.3);
    border-radius: 10px; padding: 14px 18px; color: var(--critical);
    font-size: 13px; font-family: var(--font-mono); margin-bottom: 20px;
    max-width: 680px; margin-left: auto; margin-right: auto; white-space: pre-wrap;
  }
  .empty-state {
    background: rgba(63,185,80,0.06); border: 1px solid rgba(63,185,80,0.2);
    border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;
  }
  .progress-bar { height: 3px; background: var(--border); border-radius: 2px; margin-top: 12px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.4s ease; }
  .footer { border-top: 1px solid var(--border); padding: 24px 0; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
`;

// ── STATIC DATA ───────────────────────────────────────────────────────────────

const LOG_LINES = [
  { text: "► Initializing scanner engine...",                  cls: "" },
  { text: "► Resolving DNS and mapping endpoints...",          cls: "" },
  { text: "► Testing for SQL Injection vectors...",            cls: "warn" },
  { text: "► Testing for XSS payloads...",                    cls: "warn" },
  { text: "► Checking TLS/SSL configuration...",              cls: "" },
  { text: "► Auditing HTTP security headers...",              cls: "" },
  { text: "► Checking rate limiting on login endpoints...",   cls: "warn" },
  { text: "► Scanning for CSRF vulnerabilities...",           cls: "" },
  { text: "► Checking for exposed secrets / .env files...",   cls: "warn" },
  { text: "► Checking eCommerce-specific risks...",           cls: "" },
  { text: "► Checking for verbose error messages...",         cls: "" },
  { text: "✓ Scan complete. Generating AI risk report...",    cls: "ok" },
];

const BUSINESS_RISKS = [
  { icon: "💸", title: "Potential Financial Loss",   text: "A successful attack could result in $50K–$500K in damages via data breach penalties, ransomware, and customer refunds." },
  { icon: "⚖️", title: "Regulatory Exposure",        text: "Critical findings trigger mandatory breach notification under GDPR/CCPA. Non-compliance fines can reach 4% of annual revenue." },
  { icon: "🔒", title: "Customer Trust at Risk",     text: "A public breach leads to avg. 31% customer churn in SMBs within 6 months. Full recovery takes 2–3 years." },
  { icon: "⏰", title: "Time to Exploit",            text: "SQL Injection and XSS vulnerabilities can be exploited by automated bots within hours of discovery — not days." },
];

const ROADMAP_PHASES = [
  {
    num: "PHASE 01", title: "Stop the Bleeding", time: "This Week (Days 1–3)", color: "var(--critical)",
    items: [
      { text: "Fix SQL Injection with parameterized queries",       dot: "var(--critical)" },
      { text: "Sanitize all user inputs to eliminate XSS risk",     dot: "var(--critical)" },
      { text: "Force HTTPS on all pages immediately",               dot: "var(--critical)" },
    ],
  },
  {
    num: "PHASE 02", title: "Harden Access", time: "Next Week (Days 4–7)", color: "var(--high)",
    items: [
      { text: "Add rate limiting + lockout to login endpoint",      dot: "var(--high)" },
      { text: "Enable 2-factor authentication for admin accounts",  dot: "var(--high)" },
      { text: "Review and rotate all API keys and passwords",       dot: "var(--high)" },
    ],
  },
  {
    num: "PHASE 03", title: "Tune & Monitor", time: "Ongoing (Week 2+)", color: "var(--medium)",
    items: [
      { text: "Add all missing HTTP security headers",              dot: "var(--medium)" },
      { text: "Disable debug/verbose errors in production",         dot: "var(--medium)" },
      { text: "Set up monthly automated security scans",            dot: "var(--medium)" },
    ],
  },
];

// ── HELPER: parse "1. Step one\n2. Step two" → ["Step one", "Step two"] ──────
function parseRec(rec = "") {
  return rec.split(/\n/).map(s => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function SecuritySentinel() {
  const [url, setUrl]                         = useState("");
  const [selectedOpts, setSelectedOpts]       = useState(["xss", "sqli", "headers"]);
  const [phase, setPhase]                     = useState("idle");
  const [logLines, setLogLines]               = useState([]);
  const [progress, setProgress]               = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [scanMeta, setScanMeta]               = useState(null);
  const [expanded, setExpanded]               = useState({});
  const [aiSummary, setAiSummary]             = useState("");
  const [aiLoading, setAiLoading]             = useState(false);
  const [scanError, setScanError]             = useState("");

  const opts = [
    { id: "xss",     label: "XSS" },
    { id: "sqli",    label: "SQL Injection" },
    { id: "headers", label: "Security Headers" },
    { id: "ssl",     label: "SSL/TLS" },
    { id: "auth",    label: "Auth Flaws" },
  ];

  const toggleOpt = (id) =>
    setSelectedOpts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleExpanded = (idx) =>
    setExpanded(p => ({ ...p, [idx]: !p[idx] }));

  // ── AI summary — calls Flask backend ──────────────────────────────────────
  const fetchAISummary = async (vulns, targetUrl) => {
    setAiLoading(true);
    try {
      const res = await fetch(`${API}/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vulnerabilities: vulns, url: targetUrl }),
      });
      const data = await res.json();
      // Backend returns Anthropic shape: { content: [{ type, text }] }
      setAiSummary(data.content?.[0]?.text || "AI analysis complete. Review findings below.");
    } catch {
      setAiSummary(
        vulns.length === 0
          ? "No major vulnerabilities detected. Keep scanning monthly to stay safe."
          : "Your site has security issues that need attention. Review the findings and fix roadmap below."
      );
    }
    setAiLoading(false);
  };

  // ── Scan ──────────────────────────────────────────────────────────────────
  const startScan = async () => {
    let finalUrl = url.trim();
    if (!finalUrl) return;
    if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;

    setScanError("");
    setPhase("scanning");
    setLogLines([]);
    setProgress(0);
    setAiSummary("");
    setVulnerabilities([]);
    setScanMeta(null);

    let lineIdx = 0;
    const logTimer = setInterval(() => {
      if (lineIdx < LOG_LINES.length) {
        const line = LOG_LINES[lineIdx];
        setLogLines(p => [...p, { ...line, key: lineIdx }]);
        setProgress(Math.round((lineIdx / LOG_LINES.length) * 85));
        lineIdx++;
      }
    }, 700);

    try {
      const res = await fetch(`${API}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl, modules: selectedOpts }),
      });

      clearInterval(logTimer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));

      const vulns = data.vulnerabilities || [];
      setVulnerabilities(vulns);
      setScanMeta({
        score:    data.summary?.score           ?? 100,
        grade:    data.summary?.grade           ?? "A",
        duration: data.scan_duration_s          ?? 0,
        counts:   data.summary?.severity_counts ?? {},
      });
      setPhase("results");
      fetchAISummary(vulns, finalUrl);

    } catch (err) {
      clearInterval(logTimer);
      setScanError(`Backend not reachable. Start main.py on port 5000.\n→ ${err.message}`);
      setPhase("idle");
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const score      = scanMeta?.score ?? 100;
  const grade      = scanMeta?.grade ?? "A";
  const gradeLabel = { A:"Secure", B:"Low Risk", C:"Moderate Risk", D:"High Risk", F:"Critical Risk" }[grade] ?? "";
  const critCount  = scanMeta?.counts?.critical ?? 0;
  const highCount  = scanMeta?.counts?.high     ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
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
              <div className="header-badge">v2.0 · SMB Edition</div>
            </div>
          </div>
        </header>

        {/* ════ IDLE ════ */}
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
                <p>Enterprise-grade vulnerability scanning with plain-English risk reports — built for small business owners, no technical expertise required.</p>

                {scanError && <div className="error-banner">⚠ {scanError}</div>}

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

            <div className="container" style={{ paddingBottom: 80 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {[
                  { icon: "🔍", title: "Deep Scanning",    text: "Tests 9 vulnerability classes covering the full OWASP Top 10" },
                  { icon: "📊", title: "Business Reports", text: "Zero jargon. Risk explained in dollars, reputation, and customers" },
                  { icon: "🗺️", title: "Fix Roadmap",     text: "Prioritized action plan sorted by impact and ease of fix" },
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

        {/* ════ SCANNING ════ */}
        {phase === "scanning" && (
          <div className="container">
            <div className="scanning-view">
              <div className="scan-ring" />
              <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Scanning {url}</h2>
              <p style={{ color: "var(--muted)", marginBottom: 24, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {progress}% complete — running 9 security modules concurrently
              </p>
              <div className="progress-bar" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="scan-log">
                {logLines.map((l, i) => (
                  <div key={l.key} className={`log-line ${l.cls}`} style={{ animationDelay: `${i * 0.05}s` }}>
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ RESULTS ════ */}
        {phase === "results" && (
          <div className="container results">
            <button className="reset-btn" onClick={() => { setPhase("idle"); setUrl(""); setScanMeta(null); }}>
              ← New Scan
            </button>

            {/* AI SUMMARY */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, marginBottom: 28 }}>
              <div className="ai-powered"><span className="ai-dot" /> AI-Generated Executive Summary</div>
              {aiLoading
                ? <p style={{ color: "var(--muted)", fontStyle: "italic", fontSize: 14 }}>Generating business risk assessment…</p>
                : <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text)" }}>{aiSummary}</p>
              }
            </div>

            {/* SCORE */}
            <div className="score-section">
              <div className={`score-circle score-grade-${grade}`}>
                <div className="score-num">{score}</div>
                <div className="score-label">/ 100</div>
              </div>
              <div className="score-info">
                <h2>Security Grade: {grade} — {gradeLabel}</h2>
                <p>
                  {vulnerabilities.length === 0
                    ? "No vulnerabilities detected. Your site passed all 9 security checks — keep scanning monthly."
                    : `Found ${vulnerabilities.length} security issue(s). Follow the remediation roadmap below to reach Grade A.`
                  }
                </p>
                <div className="score-meta">
                  <div className="score-stat">Target: <strong>{url}</strong></div>
                  <div className="score-stat">
                    Found: <strong style={{ color: "var(--critical)" }}>{critCount} Critical</strong>,{" "}
                    <strong style={{ color: "var(--high)" }}>{highCount} High</strong>
                  </div>
                  <div className="score-stat">Scan Time: <strong>{scanMeta?.duration ?? "?"}s</strong></div>
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

            {vulnerabilities.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ fontWeight: 700, color: "var(--medium)", fontSize: 18, marginBottom: 6 }}>No vulnerabilities detected!</div>
                <div style={{ fontSize: 14, color: "var(--muted)" }}>Your site passed all 9 security checks. Schedule monthly scans to stay ahead of threats.</div>
              </div>
            ) : (
              <div className="vuln-list">
                {vulnerabilities.map((v, idx) => {
                  const isOpen   = !!expanded[idx];
                  const recItems = parseRec(v.recommendation);

                  return (
                    <div key={idx} className={`vuln-card ${isOpen ? "expanded" : ""}`}>

                      {/* header row */}
                      <div className="vuln-header" onClick={() => toggleExpanded(idx)}>
                        <span className={`severity-badge sev-${v.severity || "info"}`}>
                          {(v.severity || "info").toUpperCase()}
                        </span>
                        <span className="vuln-name">{v.name}</span>
                        {v.effort && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginRight: 8 }}>
                            ⏱ {v.effort}
                          </span>
                        )}
                        <span className={`vuln-toggle ${isOpen ? "open" : ""}`}>⌄</span>
                      </div>

                      {/* expanded body — two columns */}
                      {isOpen && (
                        <div className="vuln-body">

                          {/* ── LEFT: impact, fix, how-to-fix steps ── */}
                          <div className="vuln-col">
                            <h4>Business Impact</h4>
                            <p className="bright">{v.businessImpact || v.description || "No details available."}</p>

                            {(v.fix || v.effort) && (
                              <div className="tag-row">
                                {v.fix    && <span className="fix-tag">✓ {v.fix}</span>}
                                {v.effort && <span className="effort-tag">⏱ {v.effort}</span>}
                              </div>
                            )}

                            {recItems.length > 0 && (
                              <>
                                <h4 className="mt">How to Fix</h4>
                                <div className="rec-list">
                                  {recItems.map((item, i) => (
                                    <div key={i} className="rec-item">
                                      <span className="rec-num">{i + 1}.</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {v.affected_urls?.length > 0 && (
                              <>
                                <h4 className="mt">Affected URLs</h4>
                                {v.affected_urls.slice(0, 4).map((u, i) => (
                                  <span key={i} className="affected-url">{u}</span>
                                ))}
                                {v.affected_urls.length > 4 && (
                                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                                    +{v.affected_urls.length - 4} more
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* ── RIGHT: technical detail, code example, module-specific extras ── */}
                          <div className="vuln-col">
                            <h4>Technical Detail</h4>
                            <p>{v.tech || v.description || "No technical detail available."}</p>

                            {v.example && (
                              <>
                                <h4 className="mt">Attack Example</h4>
                                <div className="code-block">{v.example}</div>
                              </>
                            )}

                            {/* Headers module: list each missing header with its fix command */}
                            {v.missing_headers?.length > 0 && (
                              <>
                                <h4 className="mt">Missing Headers & Fixes</h4>
                                {v.missing_headers.map((h, i) => (
                                  <div key={i} className="header-fix-item">
                                    <div className="header-fix-name">✗ {h.header}</div>
                                    <div className="header-fix-cmd">{h.fix}</div>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* SSL module: certificate expiry */}
                            {v.cert_expires && (
                              <>
                                <h4 className="mt">SSL Certificate</h4>
                                <p>
                                  Expires:{" "}
                                  <strong style={{ color: (v.cert_days_left ?? 999) < 30 ? "var(--critical)" : "var(--medium)" }}>
                                    {v.cert_expires} ({v.cert_days_left} days left)
                                  </strong>
                                </p>
                              </>
                            )}

                            {/* CSRF module: vulnerable forms */}
                            {v.vulnerable_forms?.length > 0 && (
                              <>
                                <h4 className="mt">Forms Without CSRF Token</h4>
                                {v.vulnerable_forms.slice(0, 4).map((f, i) => (
                                  <span key={i} className="affected-url">{String(f)}</span>
                                ))}
                              </>
                            )}

                            {/* Error disclosure: leaked patterns */}
                            {v.leaked_patterns?.length > 0 && (
                              <>
                                <h4 className="mt">Leaked Patterns Detected</h4>
                                <div className="code-block">{v.leaked_patterns.join("\n")}</div>
                              </>
                            )}

                            {/* Auth module: login endpoint found */}
                            {v.login_endpoint && (
                              <>
                                <h4 className="mt">Login Endpoint Tested</h4>
                                <span className="affected-url">{v.login_endpoint}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ROADMAP */}
            <h3 className="section-title">Priority Remediation Roadmap</h3>
            <div className="roadmap">
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 4 }}>
                Follow these phases to go from{" "}
                <strong style={{ color: "var(--critical)" }}>Grade {grade}</strong>{" → "}
                <strong style={{ color: "var(--medium)" }}>Grade A</strong> in under 2 weeks.
              </p>
              <div className="roadmap-grid">
                {ROADMAP_PHASES.map(ph => (
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
            <div style={{ background: "linear-gradient(135deg,rgba(240,165,0,0.08),rgba(224,90,90,0.06))", border: "1px solid rgba(240,165,0,0.2)", borderRadius: 16, padding: 32, textAlign: "center" }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Ready to fix these issues?</h3>
              <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto 24px" }}>
                Share this report with your developer. Every item has an estimated fix time — most can be resolved in under a day.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="scan-btn" onClick={() => window.print()}>⬇ Download Report</button>
                <button className="reset-btn" style={{ margin: 0 }} onClick={() => { setPhase("idle"); setUrl(""); setScanMeta(null); }}>
                  Scan Another Site
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <div className="container">
            SecuritySentinel v2.0 · Built for SMB Founders · Always get written consent before scanning a site you don't own
          </div>
        </footer>
      </div>
    </>
  );
}