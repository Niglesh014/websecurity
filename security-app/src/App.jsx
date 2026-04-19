import { useState } from "react";

const API = "http://localhost:5000";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');`;

const styles = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#080b0f; --surface:#0d1117; --surface2:#161b22; --border:#21262d;
    --accent:#f0a500; --accent2:#e05a5a; --accent3:#4fc3a1; --accent4:#5b8dee;
    --text:#e6edf3; --muted:#7d8590;
    --critical:#f85149; --high:#f0a500; --medium:#3fb950; --low:#4fc3a1;
    --ai:#7c3aed; --ai-light:#a78bfa;
    --font-mono:'Space Mono',monospace; --font-sans:'Syne',sans-serif;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-sans); min-height:100vh; }
  .app { min-height:100vh; background:var(--bg); position:relative; overflow:hidden; }

  .grid-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(240,165,0,0.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(240,165,0,0.03) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .glow-orb { position:fixed; border-radius:50%; filter:blur(120px); pointer-events:none; z-index:0; }
  .orb1 { width:600px; height:600px; background:rgba(240,165,0,0.04); top:-200px; right:-100px; }
  .orb2 { width:400px; height:400px; background:rgba(124,58,237,0.05); bottom:-100px; left:-100px; }

  .container { max-width:1100px; margin:0 auto; padding:0 24px; position:relative; z-index:1; }

  /* ── HEADER ── */
  .header { border-bottom:1px solid var(--border); padding:20px 0; background:rgba(8,11,15,0.88); backdrop-filter:blur(20px); position:sticky; top:0; z-index:100; }
  .header-inner { display:flex; align-items:center; gap:16px; }
  .logo-icon { width:40px; height:40px; background:linear-gradient(135deg,var(--accent),var(--accent2)); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 0 20px rgba(240,165,0,0.3); }
  .logo-text { font-size:20px; font-weight:800; letter-spacing:-0.5px; }
  .logo-text span { color:var(--accent); }
  .ai-badge { margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:10px; padding:4px 12px; border-radius:20px; border:1px solid rgba(124,58,237,0.4); color:var(--ai-light); background:rgba(124,58,237,0.1); }
  .ai-dot { width:6px; height:6px; border-radius:50%; background:var(--ai-light); animation:pulse 1.5s infinite; }

  /* ── HERO ── */
  .hero { padding:60px 0 40px; text-align:center; }
  .hero-eyebrow { font-family:var(--font-mono); font-size:11px; color:var(--accent); letter-spacing:3px; text-transform:uppercase; margin-bottom:20px; display:flex; align-items:center; justify-content:center; gap:10px; }
  .eyebrow-line { width:30px; height:1px; background:var(--accent); opacity:0.5; }
  .hero h1 { font-size:clamp(36px,6vw,64px); font-weight:800; line-height:1.05; letter-spacing:-2px; margin-bottom:18px; }
  .hero h1 em { font-style:normal; color:var(--accent); }
  .hero p { font-size:17px; color:var(--muted); max-width:540px; margin:0 auto 40px; line-height:1.7; }

  /* ── SCANNER CARD ── */
  .scanner-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:28px; max-width:680px; margin:0 auto; box-shadow:0 0 60px rgba(0,0,0,0.4); }
  .input-row { display:flex; gap:12px; flex-wrap:wrap; }
  .url-input { flex:1; min-width:200px; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:14px 16px; font-family:var(--font-mono); font-size:13px; color:var(--text); outline:none; transition:border-color 0.2s,box-shadow 0.2s; }
  .url-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(240,165,0,0.1); }
  .url-input::placeholder { color:var(--muted); }
  .scan-btn { padding:14px 28px; background:linear-gradient(135deg,var(--accent),#d4920a); color:#000; font-family:var(--font-sans); font-weight:700; font-size:14px; border:none; border-radius:10px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; white-space:nowrap; }
  .scan-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(240,165,0,0.3); }
  .scan-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
  .scan-options { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
  .opt-chip { font-family:var(--font-mono); font-size:11px; padding:5px 12px; border-radius:20px; border:1px solid var(--border); cursor:pointer; transition:all 0.15s; color:var(--muted); background:transparent; }
  .opt-chip.active { background:rgba(240,165,0,0.1); border-color:var(--accent); color:var(--accent); }

  /* ── SCANNING ── */
  .scanning-view { text-align:center; padding:60px 0; }
  .scan-ring { width:120px; height:120px; border-radius:50%; border:2px solid var(--border); border-top-color:var(--accent); animation:spin 1s linear infinite; margin:0 auto 24px; position:relative; }
  .scan-ring::after { content:'🛡️'; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:36px; animation:counterSpin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes counterSpin { to { transform:translate(-50%,-50%) rotate(-360deg); } }
  .scan-log { font-family:var(--font-mono); font-size:12px; color:var(--muted); max-width:480px; margin:0 auto; text-align:left; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; min-height:120px; }
  .log-line { margin-bottom:4px; opacity:0; animation:fadeIn 0.3s forwards; }
  .log-line.ok { color:var(--accent3); } .log-line.warn { color:var(--accent); } .log-line.err { color:var(--critical); }
  .progress-bar { height:3px; background:var(--border); border-radius:2px; margin-top:12px; overflow:hidden; }
  .progress-fill { height:100%; border-radius:2px; background:linear-gradient(90deg,var(--accent),var(--accent2)); transition:width 0.4s ease; }
  @keyframes fadeIn { to { opacity:1; } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── RESULTS ── */
  .results { padding:0 0 80px; }
  .section-title { font-size:20px; font-weight:700; letter-spacing:-0.5px; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
  .section-title::after { content:''; flex:1; height:1px; background:var(--border); }

  /* ── SCORE ── */
  .score-section { display:grid; grid-template-columns:auto 1fr; gap:32px; align-items:center; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:32px; margin-bottom:28px; }
  @media(max-width:600px){ .score-section { grid-template-columns:1fr; text-align:center; } }
  .score-circle { width:120px; height:120px; border-radius:50%; border:3px solid; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .score-num { font-size:42px; font-weight:800; line-height:1; }
  .score-lbl { font-family:var(--font-mono); font-size:10px; color:var(--muted); letter-spacing:1px; margin-top:2px; }
  .grade-F { border-color:var(--critical); color:var(--critical); }
  .grade-D { border-color:#f07850; color:#f07850; }
  .grade-C { border-color:var(--high); color:var(--high); }
  .grade-B { border-color:#88c060; color:#88c060; }
  .grade-A { border-color:var(--medium); color:var(--medium); }
  .score-info h2 { font-size:26px; font-weight:800; letter-spacing:-0.5px; margin-bottom:8px; }
  .score-info p { color:var(--muted); font-size:15px; line-height:1.6; }
  .score-meta { display:flex; gap:20px; margin-top:16px; flex-wrap:wrap; }
  .score-stat { font-family:var(--font-mono); font-size:12px; color:var(--muted); }
  .score-stat strong { color:var(--text); }

  /* ── AI SUMMARY CARD ── */
  .ai-summary-card { background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(91,141,238,0.06)); border:1px solid rgba(124,58,237,0.3); border-radius:16px; padding:28px; margin-bottom:28px; }
  .ai-label { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:10px; padding:4px 10px; border-radius:20px; border:1px solid rgba(124,58,237,0.35); color:var(--ai-light); background:rgba(124,58,237,0.1); margin-bottom:12px; }

  /* ── AI DEEP ANALYSIS PANEL ── */
  .ai-panel { background:var(--surface); border:1px solid rgba(124,58,237,0.25); border-radius:16px; padding:28px; margin-bottom:28px; }
  .risk-pill { display:inline-flex; align-items:center; gap:5px; font-family:var(--font-mono); font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:1px; }
  .rp-Critical { background:rgba(248,81,73,0.15); color:var(--critical); border:1px solid rgba(248,81,73,0.3); }
  .rp-High     { background:rgba(240,165,0,0.12);  color:var(--high);     border:1px solid rgba(240,165,0,0.3); }
  .rp-Medium   { background:rgba(63,185,80,0.1);   color:var(--medium);   border:1px solid rgba(63,185,80,0.3); }
  .rp-Low      { background:rgba(79,195,161,0.1);  color:var(--low);      border:1px solid rgba(79,195,161,0.3); }
  .rp-Unknown  { background:rgba(125,133,144,0.1); color:var(--muted);    border:1px solid rgba(125,133,144,0.2); }
  .ai-risk-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-top:14px; }
  @media(max-width:640px){ .ai-risk-grid { grid-template-columns:1fr; } }
  .ai-risk-item { background:rgba(124,58,237,0.06); border:1px solid rgba(124,58,237,0.15); border-radius:10px; padding:16px; }
  .ai-risk-type { font-family:var(--font-mono); font-size:10px; color:var(--ai-light); letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
  .ai-risk-detail { font-size:13px; color:var(--text); margin-bottom:8px; line-height:1.5; }
  .ai-risk-rec { font-size:12px; color:var(--muted); line-height:1.5; border-top:1px solid rgba(124,58,237,0.15); padding-top:8px; margin-top:8px; }
  .owasp-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:12px; }
  @media(max-width:640px){ .owasp-grid { grid-template-columns:1fr; } }
  .owasp-item { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; }
  .owasp-cat { font-family:var(--font-mono); font-size:11px; color:var(--accent); margin-bottom:4px; font-weight:700; }
  .owasp-ev { font-size:12px; color:var(--muted); line-height:1.4; }
  .sub-heading { font-family:var(--font-mono); font-size:10px; color:var(--muted); letter-spacing:2px; text-transform:uppercase; margin:20px 0 10px; }
  .no-find { font-size:13px; color:var(--muted); font-style:italic; padding:10px 0; }

  /* ── VULN CARDS ── */
  .vuln-list { display:flex; flex-direction:column; gap:12px; margin-bottom:32px; }
  .vuln-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:border-color 0.2s; }
  .vuln-card:hover { border-color:rgba(240,165,0,0.3); }
  .vuln-card.open { border-color:rgba(240,165,0,0.25); }
  .vuln-header { display:flex; align-items:center; gap:14px; padding:16px 20px; cursor:pointer; user-select:none; }
  .sev-badge { font-family:var(--font-mono); font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:1px; flex-shrink:0; }
  .sb-critical { background:rgba(248,81,73,0.15); color:var(--critical); border:1px solid rgba(248,81,73,0.3); }
  .sb-high     { background:rgba(240,165,0,0.12);  color:var(--high);     border:1px solid rgba(240,165,0,0.3); }
  .sb-medium   { background:rgba(63,185,80,0.1);   color:var(--medium);   border:1px solid rgba(63,185,80,0.3); }
  .sb-low      { background:rgba(79,195,161,0.1);  color:var(--low);      border:1px solid rgba(79,195,161,0.3); }
  .sb-info     { background:rgba(125,133,144,0.1); color:var(--muted);    border:1px solid rgba(125,133,144,0.2); }
  .vuln-name { font-weight:700; font-size:15px; flex:1; }
  .type-chip { font-family:var(--font-mono); font-size:10px; color:var(--muted); padding:2px 8px; border:1px solid var(--border); border-radius:10px; }
  .chevron { color:var(--muted); font-size:18px; transition:transform 0.2s; }
  .chevron.open { transform:rotate(180deg); }

  /* 3-column expanded body */
  .vuln-body { border-top:1px solid var(--border); display:grid; grid-template-columns:1fr 1fr 1fr; }
  @media(max-width:900px){ .vuln-body { grid-template-columns:1fr 1fr; } }
  @media(max-width:600px){ .vuln-body { grid-template-columns:1fr; } }
  .vcol { padding:20px; }
  .vcol+.vcol { border-left:1px solid var(--border); }
  @media(max-width:600px){ .vcol+.vcol { border-left:none; border-top:1px solid var(--border); } }
  .vcol h4 { font-family:var(--font-mono); font-size:10px; color:var(--muted); letter-spacing:2px; text-transform:uppercase; margin:0 0 8px; }
  .vcol h4.mt { margin-top:16px; }
  .vcol p { font-size:14px; color:var(--muted); line-height:1.65; }
  .vcol p.bright { color:var(--text); }
  .vcol.ai-col { background:rgba(124,58,237,0.04); border-left:1px solid rgba(124,58,237,0.2) !important; }
  .ai-col-lbl { display:inline-flex; align-items:center; gap:5px; font-family:var(--font-mono); font-size:9px; color:var(--ai-light); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; }
  .ai-dot-sm { width:5px; height:5px; border-radius:50%; background:var(--ai-light); display:inline-block; }

  .code-block { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; font-family:var(--font-mono); font-size:11px; color:var(--accent); overflow-x:auto; white-space:pre; line-height:1.6; margin-top:8px; }
  .tag-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
  .fix-tag { font-family:var(--font-mono); font-size:10px; padding:5px 12px; border-radius:6px; background:rgba(79,195,161,0.1); color:var(--low); border:1px solid rgba(79,195,161,0.25); }
  .affected-url { display:block; font-family:var(--font-mono); font-size:10px; color:var(--critical); background:rgba(248,81,73,0.07); border:1px solid rgba(248,81,73,0.2); border-radius:4px; padding:4px 8px; margin:3px 0; word-break:break-all; }
  .rec-list { margin-top:4px; }
  .rec-item { display:flex; gap:8px; font-size:13px; color:var(--muted); margin-bottom:7px; line-height:1.5; }
  .rec-num { font-family:var(--font-mono); font-size:10px; color:var(--accent); flex-shrink:0; }
  .hdr-fix { margin-bottom:10px; }
  .hdr-fix-name { font-family:var(--font-mono); font-size:11px; color:var(--accent); margin-bottom:3px; }
  .hdr-fix-cmd  { font-family:var(--font-mono); font-size:10px; color:var(--muted); background:var(--bg); padding:4px 8px; border-radius:4px; border:1px solid var(--border); }

  /* ── RISK GRID ── */
  .risk-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:28px; }
  @media(max-width:600px){ .risk-grid { grid-template-columns:1fr; } }
  .risk-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; }
  .rc-icon { font-size:28px; margin-bottom:10px; }
  .rc-title { font-weight:700; font-size:14px; margin-bottom:6px; }
  .rc-text { font-size:13px; color:var(--muted); line-height:1.6; }

  /* ── ROADMAP ── */
  .roadmap { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:28px; margin-bottom:28px; }
  .roadmap-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:20px; }
  @media(max-width:700px){ .roadmap-grid { grid-template-columns:1fr; } }
  .rmap-phase { background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:20px; }
  .rmap-num { font-family:var(--font-mono); font-size:10px; color:var(--muted); letter-spacing:2px; margin-bottom:8px; }
  .rmap-title { font-weight:700; font-size:15px; margin-bottom:4px; }
  .rmap-time { font-family:var(--font-mono); font-size:11px; color:var(--muted); margin-bottom:14px; }
  .rmap-item { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--muted); margin-bottom:8px; line-height:1.4; }
  .rmap-dot { width:6px; height:6px; border-radius:50%; margin-top:5px; flex-shrink:0; }

  /* ── MISC ── */
  .reset-btn { padding:12px 24px; background:transparent; border:1px solid var(--border); border-radius:10px; color:var(--muted); font-family:var(--font-sans); font-weight:600; font-size:14px; cursor:pointer; transition:all 0.2s; margin-bottom:32px; }
  .reset-btn:hover { border-color:var(--accent); color:var(--accent); }
  .error-banner { background:rgba(248,81,73,0.08); border:1px solid rgba(248,81,73,0.3); border-radius:10px; padding:14px 18px; color:var(--critical); font-size:13px; font-family:var(--font-mono); margin-bottom:20px; max-width:680px; margin-left:auto; margin-right:auto; white-space:pre-wrap; }
  .empty-state { background:rgba(63,185,80,0.06); border:1px solid rgba(63,185,80,0.2); border-radius:12px; padding:32px; text-align:center; margin-bottom:32px; }
  .footer { border-top:1px solid var(--border); padding:24px 0; text-align:center; font-family:var(--font-mono); font-size:11px; color:var(--muted); }
`;

// ── Static data ───────────────────────────────────────────────────────────────

const LOG_LINES = [
  { text:"► Initializing scanner engine...",                  cls:"" },
  { text:"► Resolving DNS and mapping endpoints...",          cls:"" },
  { text:"► Testing for SQL Injection vectors...",            cls:"warn" },
  { text:"► Testing for XSS payloads...",                    cls:"warn" },
  { text:"► Checking TLS/SSL configuration...",              cls:"" },
  { text:"► Auditing HTTP security headers...",              cls:"" },
  { text:"► Checking rate limiting on login endpoints...",   cls:"warn" },
  { text:"► Scanning for CSRF vulnerabilities...",           cls:"" },
  { text:"► Checking for exposed secrets / .env files...",   cls:"warn" },
  { text:"► Checking eCommerce-specific risks...",           cls:"" },
  { text:"► Checking for verbose error messages...",         cls:"" },
  { text:"🤖 Sending findings to Claude AI for analysis...", cls:"ok" },
  { text:"✓ AI analysis complete — building report...",      cls:"ok" },
];

const BIZ_RISKS = [
  { icon:"💸", title:"Potential Financial Loss",  text:"A breach could cost $50K–$500K via penalties, ransomware, and customer refunds." },
  { icon:"⚖️", title:"Regulatory Exposure",       text:"Critical findings trigger GDPR/CCPA mandatory breach notification. Fines up to 4% revenue." },
  { icon:"🔒", title:"Customer Trust at Risk",    text:"A public breach causes avg. 31% customer churn in SMBs within 6 months." },
  { icon:"⏰", title:"Time to Exploit",           text:"SQLi and XSS can be exploited by automated bots within hours of discovery." },
];

const ROADMAP = [
  { num:"PHASE 01", title:"Stop the Bleeding", time:"Days 1–3", color:"var(--critical)", items:[
    { text:"Fix SQL Injection — use parameterized queries",  dot:"var(--critical)" },
    { text:"Sanitize all inputs — eliminate XSS",           dot:"var(--critical)" },
    { text:"Force HTTPS on all pages immediately",          dot:"var(--critical)" },
  ]},
  { num:"PHASE 02", title:"Harden Access", time:"Days 4–7", color:"var(--high)", items:[
    { text:"Rate limiting + lockout on login endpoint",     dot:"var(--high)" },
    { text:"Enable 2FA for all admin accounts",            dot:"var(--high)" },
    { text:"Rotate all API keys and passwords",            dot:"var(--high)" },
  ]},
  { num:"PHASE 03", title:"Tune & Monitor", time:"Week 2+", color:"var(--medium)", items:[
    { text:"Add all missing HTTP security headers",        dot:"var(--medium)" },
    { text:"Disable verbose errors in production",         dot:"var(--medium)" },
    { text:"Schedule monthly automated scans",             dot:"var(--medium)" },
  ]},
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseRec = (rec = "") =>
  rec.split(/\n/).map(s => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);

const sevClass = s => {
  const m = { critical:"sb-critical", high:"sb-high", medium:"sb-medium", low:"sb-low" };
  return m[(s||"").toLowerCase()] || "sb-info";
};

const rpClass = s => `rp-${s || "Unknown"}`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SecuritySentinel() {
  const [url, setUrl]           = useState("");
  const [opts, setOpts]         = useState(["xss","sqli","headers"]);
  const [phase, setPhase]       = useState("idle");    // idle | scanning | results
  const [logLines, setLogLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [vulns, setVulns]       = useState([]);
  const [aiAnalysis, setAIA]    = useState(null);
  const [scanMeta, setScanMeta] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [aiSummary, setAIS]     = useState("");
  const [aiLoading, setAIL]     = useState(false);
  const [error, setError]       = useState("");

  const OPT_LIST = [
    {id:"xss",    label:"XSS"},
    {id:"sqli",   label:"SQL Injection"},
    {id:"headers",label:"Security Headers"},
    {id:"ssl",    label:"SSL/TLS"},
    {id:"auth",   label:"Auth Flaws"},
    {id:"csrf",   label:"CSRF"},
    {id:"secrets",label:"Secrets"},
  ];

  const toggleOpt = id =>
    setOpts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleExpand = idx =>
    setExpanded(p => ({...p, [idx]: !p[idx]}));

  // ── Fetch AI executive summary (short paragraph) ─────────────────────────
  const fetchSummary = async (v, targetUrl) => {
    setAIL(true);
    try {
      const res = await fetch(`${API}/ai-summary`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({vulnerabilities: v, url: targetUrl}),
      });
      const data = await res.json();
      setAIS(data.content?.[0]?.text || "AI analysis complete.");
    } catch {
      setAIS(v.length === 0
        ? "No vulnerabilities detected. Keep scanning monthly."
        : "Security issues found. Review findings and follow the roadmap.");
    }
    setAIL(false);
  };

  // ── Start scan ────────────────────────────────────────────────────────────
  const startScan = async () => {
    let target = url.trim();
    if (!target) return;
    if (!target.startsWith("http")) target = "https://" + target;

    setError(""); setPhase("scanning"); setLogLines([]);
    setProgress(0); setAIS(""); setVulns([]); setAIA(null); setScanMeta(null);

    let idx = 0;
    const timer = setInterval(() => {
      if (idx < LOG_LINES.length) {
        const l = LOG_LINES[idx];
        setLogLines(p => [...p, {...l, key: idx}]);
        setProgress(Math.round((idx / LOG_LINES.length) * 85));
        idx++;
      }
    }, 650);

    try {
      const res = await fetch(`${API}/scan`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({url: target, modules: opts}),
      });

      clearInterval(timer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));

      const v = data.vulnerabilities || [];
      setVulns(v);
      setAIA(data.ai_analysis || null);
      setScanMeta({
        score:     data.summary?.score           ?? 100,
        grade:     data.summary?.grade           ?? "A",
        duration:  data.scan_duration_s          ?? 0,
        counts:    data.summary?.severity_counts ?? {},
        aiEnabled: data.ai_enabled               ?? false,
      });
      setPhase("results");
      fetchSummary(v, target);

    } catch (err) {
      clearInterval(timer);
      setError(
        `Cannot reach backend.\n` +
        `1. Make sure main.py is running: python main.py\n` +
        `2. Check that port 5000 is not blocked\n` +
        `→ ${err.message}`
      );
      setPhase("idle");
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const score  = scanMeta?.score ?? 100;
  const grade  = scanMeta?.grade ?? "A";
  const glabel = {A:"Secure",B:"Low Risk",C:"Moderate Risk",D:"High Risk",F:"Critical Risk"}[grade] ?? "";
  const crit   = scanMeta?.counts?.Critical ?? 0;
  const high   = scanMeta?.counts?.High     ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grid-bg"/>
        <div className="glow-orb orb1"/> <div className="glow-orb orb2"/>

        {/* HEADER */}
        <header className="header">
          <div className="container">
            <div className="header-inner">
              <div className="logo-icon">🛡️</div>
              <div className="logo-text">Security<span>Sentinel</span></div>
              <div className="ai-badge"><span className="ai-dot"/> Claude AI · v3.0</div>
            </div>
          </div>
        </header>

        {/* ══ IDLE ══ */}
        {phase === "idle" && (
          <>
            <section className="hero">
              <div className="container">
                <div className="hero-eyebrow">
                  <span className="eyebrow-line"/> AI-Powered Vulnerability Scanner <span className="eyebrow-line"/>
                </div>
                <h1>Find security flaws<br/>before <em>attackers do</em></h1>
                <p>9-module scanner + Claude AI explains every finding in plain English — built for founders, not security experts.</p>

                {error && <div className="error-banner">⚠ {error}</div>}

                <div className="scanner-card">
                  <div className="input-row">
                    <input className="url-input" type="text" placeholder="https://yourbusiness.com"
                      value={url} onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && startScan()}/>
                    <button className="scan-btn" onClick={startScan} disabled={!url.trim()}>
                      ⚡ Scan + AI
                    </button>
                  </div>
                  <div className="scan-options">
                    {OPT_LIST.map(o => (
                      <button key={o.id}
                        className={`opt-chip ${opts.includes(o.id) ? "active" : ""}`}
                        onClick={() => toggleOpt(o.id)}>
                        {opts.includes(o.id) ? "✓ " : ""}{o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="container" style={{paddingBottom:80}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {[
                  {icon:"🔍", title:"9-Module Scanner",   text:"XSS, SQLi, headers, SSL, CSRF, auth, secrets, errors, eCommerce"},
                  {icon:"🤖", title:"Claude AI Analysis",  text:"Every finding explained in plain English with actionable fix guidance"},
                  {icon:"🛡️", title:"AI Risk Detection",   text:"Prompt injection, exposed keys, insecure AI patterns in your source code"},
                ].map(f => (
                  <div key={f.title} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 18px"}}>
                    <div style={{fontSize:28,marginBottom:10}}>{f.icon}</div>
                    <div style={{fontWeight:700,marginBottom:6,fontSize:15}}>{f.title}</div>
                    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{f.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ SCANNING ══ */}
        {phase === "scanning" && (
          <div className="container">
            <div className="scanning-view">
              <div className="scan-ring"/>
              <h2 style={{fontWeight:800,fontSize:22,marginBottom:8}}>Scanning {url}</h2>
              <p style={{color:"var(--muted)",marginBottom:24,fontFamily:"var(--font-mono)",fontSize:12}}>
                {progress}% — 9 modules + Claude AI running concurrently
              </p>
              <div className="progress-bar" style={{maxWidth:480,margin:"0 auto 24px"}}>
                <div className="progress-fill" style={{width:`${progress}%`}}/>
              </div>
              <div className="scan-log">
                {logLines.map((l, i) => (
                  <div key={l.key} className={`log-line ${l.cls}`} style={{animationDelay:`${i*0.05}s`}}>
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ RESULTS ══ */}
        {phase === "results" && (
          <div className="container results">
            <button className="reset-btn" onClick={() => {setPhase("idle"); setUrl(""); setScanMeta(null);}}>
              ← New Scan
            </button>

            {/* AI EXECUTIVE SUMMARY */}
            <div className="ai-summary-card">
              <div className="ai-label"><span className="ai-dot"/> Claude AI · Executive Summary</div>
              {aiLoading
                ? <p style={{color:"var(--muted)",fontStyle:"italic",fontSize:14}}>Claude is analysing your scan results…</p>
                : <p style={{fontSize:15,lineHeight:1.75,color:"var(--text)"}}>{aiSummary}</p>
              }
            </div>

            {/* SCORE CARD */}
            <div className="score-section">
              <div className={`score-circle grade-${grade}`}>
                <div className="score-num">{score}</div>
                <div className="score-lbl">/ 100</div>
              </div>
              <div className="score-info">
                <h2>Security Grade: {grade} — {glabel}</h2>
                <p>
                  {vulns.length === 0
                    ? "No vulnerabilities detected. Passed all 9 checks — keep scanning monthly."
                    : `Found ${vulns.length} issue(s). Follow the roadmap to reach Grade A.`}
                </p>
                <div className="score-meta">
                  <div className="score-stat">Target: <strong>{url}</strong></div>
                  <div className="score-stat">Critical: <strong style={{color:"var(--critical)"}}>{crit}</strong></div>
                  <div className="score-stat">High: <strong style={{color:"var(--high)"}}>{high}</strong></div>
                  <div className="score-stat">Scan Time: <strong>{scanMeta?.duration ?? 0}s</strong></div>
                  <div className="score-stat">AI: <strong style={{color:scanMeta?.aiEnabled ? "var(--ai-light)" : "var(--muted)"}}>
                    {scanMeta?.aiEnabled ? "✓ Active" : "⚠ Key not set"}
                  </strong></div>
                </div>
              </div>
            </div>

            {/* BUSINESS IMPACT */}
            <h3 className="section-title">Business Impact Overview</h3>
            <div className="risk-grid">
              {BIZ_RISKS.map(r => (
                <div key={r.title} className="risk-card">
                  <div className="rc-icon">{r.icon}</div>
                  <div className="rc-title">{r.title}</div>
                  <div className="rc-text">{r.text}</div>
                </div>
              ))}
            </div>

            {/* CLAUDE AI DEEP ANALYSIS */}
            {aiAnalysis && (
              <>
                <h3 className="section-title">🤖 Claude AI Deep Analysis</h3>
                <div className="ai-panel">
                  {/* Summary + overall risk pill */}
                  <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:20,flexWrap:"wrap"}}>
                    <div style={{flex:1}}>
                      <div className="ai-label" style={{marginBottom:8}}><span className="ai-dot"/> AI Risk Assessment</div>
                      <p style={{fontSize:14,color:"var(--text)",lineHeight:1.75}}>{aiAnalysis.summary}</p>
                    </div>
                    {aiAnalysis.overall_risk && (
                      <div style={{flexShrink:0}}>
                        <div style={{fontSize:10,fontFamily:"var(--font-mono)",color:"var(--muted)",marginBottom:6,letterSpacing:1}}>OVERALL RISK</div>
                        <span className={`risk-pill ${rpClass(aiAnalysis.overall_risk)}`}>{aiAnalysis.overall_risk}</span>
                      </div>
                    )}
                  </div>

                  {/* AI-specific risks */}
                  {aiAnalysis.ai_risks?.length > 0 ? (
                    <>
                      <div className="sub-heading">AI-Specific Risks Detected</div>
                      <div className="ai-risk-grid">
                        {aiAnalysis.ai_risks.map((r, i) => (
                          <div key={i} className="ai-risk-item">
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                              <div className="ai-risk-type">{r.type}</div>
                              <span className={`risk-pill ${rpClass(r.severity)}`} style={{fontSize:9,padding:"2px 8px"}}>{r.severity}</span>
                            </div>
                            <div className="ai-risk-detail">{r.detail}</div>
                            {r.recommendation && <div className="ai-risk-rec">→ {r.recommendation}</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="no-find">✅ No AI-specific risks (prompt injection, exposed secrets, insecure AI patterns) detected.</p>
                  )}

                  {/* OWASP Top-10 signals */}
                  {aiAnalysis.owasp_signals?.length > 0 && (
                    <>
                      <div className="sub-heading">OWASP Top 10 Signals Detected</div>
                      <div className="owasp-grid">
                        {aiAnalysis.owasp_signals.map((o, i) => (
                          <div key={i} className="owasp-item">
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <div className="owasp-cat">{o.category}</div>
                              <span className={`risk-pill ${rpClass(o.risk)}`} style={{fontSize:9,padding:"2px 8px"}}>{o.risk}</span>
                            </div>
                            <div className="owasp-ev">{o.evidence}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* VULNERABILITY CARDS */}
            <h3 className="section-title">Detected Vulnerabilities ({vulns.length})</h3>
            {vulns.length === 0 ? (
              <div className="empty-state">
                <div style={{fontSize:36,marginBottom:10}}>✅</div>
                <div style={{fontWeight:700,color:"var(--medium)",fontSize:18,marginBottom:6}}>No vulnerabilities detected!</div>
                <div style={{fontSize:14,color:"var(--muted)"}}>Passed all 9 checks. Schedule monthly scans to stay secure.</div>
              </div>
            ) : (
              <div className="vuln-list">
                {vulns.map((v, idx) => {
                  const isOpen   = !!expanded[idx];
                  const recItems = parseRec(v.recommendation);
                  const sev      = (v.severity || "info").toLowerCase();
                  return (
                    <div key={idx} className={`vuln-card ${isOpen ? "open" : ""}`}>
                      <div className="vuln-header" onClick={() => toggleExpand(idx)}>
                        <span className={`sev-badge ${sevClass(sev)}`}>{sev.toUpperCase()}</span>
                        <span className="vuln-name">{v.name}</span>
                        <span className="type-chip">{v.type || "Web Vulnerability"}</span>
                        {v.effort && <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--muted)",marginRight:6}}>⏱ {v.effort}</span>}
                        <span className={`chevron ${isOpen ? "open" : ""}`}>⌄</span>
                      </div>

                      {isOpen && (
                        <div className="vuln-body">

                          {/* COL 1 — Business impact + fix */}
                          <div className="vcol">
                            <h4>Business Impact</h4>
                            <p className="bright">{v.businessImpact || v.description || "No details provided."}</p>
                            {v.fix && (
                              <div className="tag-row">
                                <span className="fix-tag">✓ {v.fix}</span>
                              </div>
                            )}
                            {recItems.length > 0 && (
                              <>
                                <h4 className="mt">How to Fix</h4>
                                <div className="rec-list">
                                  {recItems.map((item, i) => (
                                    <div key={i} className="rec-item">
                                      <span className="rec-num">{i+1}.</span><span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            {v.affected_urls?.length > 0 && (
                              <>
                                <h4 className="mt">Affected URLs</h4>
                                {v.affected_urls.slice(0, 3).map((u, i) => (
                                  <span key={i} className="affected-url">{u}</span>
                                ))}
                              </>
                            )}
                          </div>

                          {/* COL 2 — Technical detail + code */}
                          <div className="vcol">
                            <h4>Technical Detail</h4>
                            <p>{v.tech || v.description || "No technical detail."}</p>
                            {v.example && (
                              <>
                                <h4 className="mt">Attack Example</h4>
                                <div className="code-block">{v.example}</div>
                              </>
                            )}
                            {v.missing_headers?.length > 0 && (
                              <>
                                <h4 className="mt">Missing Headers</h4>
                                {v.missing_headers.map((h, i) => (
                                  <div key={i} className="hdr-fix">
                                    <div className="hdr-fix-name">✗ {h.header}</div>
                                    <div className="hdr-fix-cmd">{h.fix}</div>
                                  </div>
                                ))}
                              </>
                            )}
                            {v.cert_expires && (
                              <>
                                <h4 className="mt">SSL Certificate</h4>
                                <p>Expires: <strong style={{color:(v.cert_days_left??999)<30?"var(--critical)":"var(--medium)"}}>
                                  {v.cert_expires} ({v.cert_days_left} days)
                                </strong></p>
                              </>
                            )}
                          </div>

                          {/* COL 3 — Claude AI explanation */}
                          <div className="vcol ai-col">
                            <div className="ai-col-lbl"><span className="ai-dot-sm"/> Claude AI</div>
                            {v.ai_explanation ? (
                              <>
                                <h4>AI Explanation</h4>
                                <p className="bright" style={{fontSize:13,lineHeight:1.7}}>{v.ai_explanation}</p>
                                {v.ai_fix && (
                                  <>
                                    <h4 className="mt">AI Fix Guidance</h4>
                                    <p style={{fontSize:13,lineHeight:1.7,color:"var(--text)"}}>{v.ai_fix}</p>
                                  </>
                                )}
                              </>
                            ) : (
                              <p style={{fontSize:13,color:"var(--muted)",fontStyle:"italic"}}>
                                {scanMeta?.aiEnabled
                                  ? "Claude AI is processing this finding…"
                                  : "Set ANTHROPIC_API_KEY on the server to enable AI explanations for every finding."}
                              </p>
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
              <p style={{color:"var(--muted)",fontSize:14,marginBottom:4}}>
                Follow these phases to go from <strong style={{color:"var(--critical)"}}>Grade {grade}</strong> → <strong style={{color:"var(--medium)"}}>Grade A</strong> in under 2 weeks.
              </p>
              <div className="roadmap-grid">
                {ROADMAP.map(ph => (
                  <div key={ph.num} className="rmap-phase">
                    <div className="rmap-num">{ph.num}</div>
                    <div className="rmap-title" style={{color:ph.color}}>{ph.title}</div>
                    <div className="rmap-time">{ph.time}</div>
                    {ph.items.map((item, i) => (
                      <div key={i} className="rmap-item">
                        <div className="rmap-dot" style={{background:item.dot}}/>
                        {item.text}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{background:"linear-gradient(135deg,rgba(124,58,237,0.08),rgba(240,165,0,0.06))",border:"1px solid rgba(124,58,237,0.2)",borderRadius:16,padding:32,textAlign:"center"}}>
              <h3 style={{fontSize:22,fontWeight:800,marginBottom:10}}>Ready to fix these issues?</h3>
              <p style={{color:"var(--muted)",maxWidth:480,margin:"0 auto 24px",lineHeight:1.7}}>
                Share this AI-powered report with your developer. Every finding includes a Claude explanation and concrete fix steps.
              </p>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <button className="scan-btn" onClick={() => window.print()}>⬇ Download Report</button>
                <button className="reset-btn" style={{margin:0}} onClick={() => {setPhase("idle");setUrl("");setScanMeta(null);}}>
                  Scan Another Site
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <div className="container">
            SecuritySentinel v3.0 · Powered by Claude AI · Only scan sites you own or have permission to test
          </div>
        </footer>
      </div>
    </>
  );
}