import { useState, useRef, useEffect } from "react";
 
const LANGUAGES = ["JavaScript", "Python", "TypeScript", "Java", "C++", "Go", "Rust", "PHP", "Ruby", "Swift"];
 
const SAMPLE_CODE = `function fibonacci(n) {
  if (n <= 1) return n;
  let result = [];
  for (let i = 0; i <= n; i++) {
    result.push(fibonacci(i));
  }
  return result[n];
}
 
console.log(fibonacci(10));`;
 
const SYSTEM_PROMPT = `You are an expert code reviewer. Respond ONLY with a valid JSON object. No markdown, no backticks, no text outside JSON. Keep ALL string values short (1 sentence). Structure:
{"overallScore":75,"grade":"B","summary":"Short 2-sentence summary.","timeComplexity":"O(n)","spaceComplexity":"O(1)","complexityExplanation":"One sentence.","categories":{"correctness":80,"performance":70,"readability":85,"security":90,"bestPractices":75},"bugs":[{"severity":"high","line":3,"title":"Bug title","description":"One sentence.","fix":"One sentence fix."}],"improvements":[{"category":"Performance","title":"Improvement title","description":"One sentence.","before":"old code","after":"new code"}],"optimizedCode":"full working optimized code","keyStrengths":["strength1","strength2"],"criticalIssues":["issue1"]}
Limit to max 3 bugs and max 3 improvements. optimizedCode must be the complete corrected version of the input code.`;
 
export default function CodeReviewAI() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("JavaScript");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const resultsRef = useRef(null);
 
  useEffect(() => {
    if (result) {
      let start = 0;
      const end = result.overallScore;
      const step = end / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= end) { setAnimatedScore(end); clearInterval(timer); }
        else setAnimatedScore(Math.floor(start));
      }, 16);
      return () => clearInterval(timer);
    }
  }, [result]);
 
  const analyzeCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAnimatedScore(0);
 
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: `Language: ${language}\n\nCode to review:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`` }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
        })
      });
 
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error ${response.status}`);
      }
 
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err.message || "Failed to analyze code. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 
  const copyOptimized = () => {
    if (result?.optimizedCode) {
      navigator.clipboard.writeText(result.optimizedCode);
      setCopiedOptimized(true);
      setTimeout(() => setCopiedOptimized(false), 2000);
    }
  };
 
  const getScoreColor = (score) => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#f59e0b";
    if (score >= 50) return "#f97316";
    return "#ef4444";
  };
 
  const getSeverityColor = (s) => ({ critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#60a5fa" }[s] || "#888");
 
 
 
  return (
    <div style={{ minHeight: "100vh", background: "#09090b", fontFamily: "'Geist', 'Inter', system-ui, sans-serif", color: "#fafafa" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .btn-primary { transition: opacity 0.15s, transform 0.15s; }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .lang-btn { transition: all 0.15s; }
        .lang-btn:hover { border-color: #52525b !important; color: #fafafa !important; }
        .tab { transition: all 0.15s; cursor: pointer; }
        .tab:hover { color: #fafafa !important; }
        .card { transition: border-color 0.15s; }
        .card:hover { border-color: #3f3f46 !important; }
        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .bar { transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ring-fill { transition: stroke-dashoffset 0.05s linear; }
        textarea { caret-color: #a78bfa; }
        textarea::placeholder { color: #3f3f46; }
      `}</style>
 
      {/* Header */}
      <header style={{ borderBottom: "1px solid #18181b", padding: "0 32px", height: 56, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "#09090b", zIndex: 50 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </div>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>
          CodeReview<span style={{ color: "#7c3aed" }}>AI</span>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#52525b", fontFamily: "'IBM Plex Mono', monospace" }}>Powered by Claude</span>
        </div>
      </header>
 
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Input Area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 24 }}>
          {/* Code Editor */}
          <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" }}>
            {/* Editor header */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #1c1c1f", display: "flex", alignItems: "center", gap: 8, background: "#0f0f11" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#52525b", marginLeft: 4 }}>
                {`input.${language.toLowerCase().replace("javascript","js").replace("typescript","ts").replace("python","py").replace("c++","cpp")}`}
              </span>
              <button onClick={() => setCode("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
                clear
              </button>
            </div>
            {/* Textarea with line numbers */}
            <div style={{ display: "flex" }}>
              <div style={{ padding: "14px 0", minWidth: 40, textAlign: "right", paddingRight: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#3f3f46", lineHeight: "22px", userSelect: "none", borderRight: "1px solid #1c1c1f", background: "#0d0d0f" }}>
                {code.split("\n").map((_, i) => <div key={i} style={{ paddingRight: 8 }}>{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{ flex: 1, minHeight: 320, padding: "14px 16px", background: "transparent", border: "none", outline: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#e4e4e7", lineHeight: "22px", resize: "vertical" }}
                spellCheck={false}
                placeholder="// Paste your code here..."
              />
            </div>
          </div>
 
          {/* Right Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Language */}
            <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: "#52525b", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Language</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {LANGUAGES.map(lang => (
                  <button key={lang} className="lang-btn" onClick={() => setLanguage(lang)} style={{ padding: "7px 4px", borderRadius: 7, border: `1px solid ${language === lang ? "#7c3aed" : "#27272a"}`, background: language === lang ? "rgba(124,58,237,0.1)" : "transparent", color: language === lang ? "#a78bfa" : "#71717a", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: language === lang ? 600 : 400 }}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
 
            {/* Stats */}
            <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: "#52525b", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Stats</p>
              {[["Lines", code.split("\n").length], ["Chars", code.length], ["Words", code.split(/\s+/).filter(Boolean).length]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #18181b" }}>
                  <span style={{ fontSize: 13, color: "#71717a" }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#a1a1aa", fontFamily: "'IBM Plex Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
 
            {/* Analyze Button */}
            <button className="btn-primary" onClick={analyzeCode} disabled={loading || !code.trim()} style={{ padding: "14px", borderRadius: 10, background: loading ? "#27272a" : "#7c3aed", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? (
                <>
                  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  Analyze Code
                </>
              )}
            </button>
          </div>
        </div>
 
        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#f87171", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}
 
        {/* Results */}
        {result && (
          <div ref={resultsRef} className="fade-in">
 
            {/* Score Hero */}
            <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 14, padding: "28px 32px", marginBottom: 16 }}>
              {/* Top row: ring + grade + divider + complexity pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #1c1c1f" }}>
                <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
                  <svg width="76" height="76" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="38" cy="38" r="32" fill="none" stroke="#27272a" strokeWidth="7" />
                    <circle className="ring-fill" cx="38" cy="38" r="32" fill="none" stroke={getScoreColor(animatedScore)} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 - (animatedScore / 100) * 2 * Math.PI * 32} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, color: getScoreColor(animatedScore), lineHeight: 1 }}>{animatedScore}</span>
                    <span style={{ fontSize: 9, color: "#52525b", fontFamily: "'IBM Plex Mono', monospace" }}>/100</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 44, fontWeight: 700, color: getScoreColor(result.overallScore), lineHeight: 1 }}>{result.grade}</span>
                  <p style={{ fontSize: 11, color: "#52525b", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.5px" }}>Grade</p>
                </div>
                <div style={{ width: 1, height: 52, background: "#27272a", flexShrink: 0 }} />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[{ label: "Time", value: result.timeComplexity, color: "#f59e0b" }, { label: "Space", value: result.spaceComplexity, color: "#60a5fa" }].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "#0d0d0f", border: "1px solid #1c1c1f", borderRadius: 10, padding: "10px 16px" }}>
                      <p style={{ fontSize: 10, color: "#52525b", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{label}</p>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 500, color }}>{value}</p>
                    </div>
                  ))}
                  <div style={{ background: "#0d0d0f", border: "1px solid #1c1c1f", borderRadius: 10, padding: "10px 16px", maxWidth: 260 }}>
                    <p style={{ fontSize: 10, color: "#52525b", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Note</p>
                    <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{result.complexityExplanation}</p>
                  </div>
                </div>
              </div>
 
              {/* Summary full width */}
              <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.75, marginBottom: 16 }}>{result.summary}</p>
 
              {/* Strengths + Issues in two columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {(result.keyStrengths || []).length > 0 && (
                  <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 10, padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Strengths</p>
                    {(result.keyStrengths || []).map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>
                        <span style={{ color: "#a1a1aa", lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(result.criticalIssues || []).length > 0 && (
                  <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 10, padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, color: "#ef4444", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Issues</p>
                    {(result.criticalIssues || []).map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ color: "#ef4444", flexShrink: 0 }}>✗</span>
                        <span style={{ color: "#a1a1aa", lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
 
            {/* Category Bars */}
            <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 14, padding: "24px 32px", marginBottom: 16 }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: "#e4e4e7", marginBottom: 20 }}>Category Breakdown</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 48px" }}>
                {Object.entries(result.categories || {}).map(([key, score]) => {
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                  const color = getScoreColor(score);
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                        <span style={{ fontSize: 13, color: "#71717a" }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace" }}>{score}</span>
                      </div>
                      <div style={{ height: 4, background: "#27272a", borderRadius: 99 }}>
                        <div className="bar" style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
 
            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, marginBottom: 14, background: "#111113", border: "1px solid #27272a", borderRadius: 10, padding: 4 }}>
              {[["bugs", `Bugs (${(result.bugs || []).length})`], ["improvements", `Improvements (${(result.improvements || []).length})`], ["optimized", "Optimized Code"]].map(([id, label]) => (
                <button key={id} className="tab" onClick={() => setActiveTab(id)} style={{ flex: 1, padding: "9px", borderRadius: 7, fontSize: 13, fontWeight: 500, color: activeTab === id ? "#fafafa" : "#71717a", background: activeTab === id ? "#27272a" : "transparent", border: "none", fontFamily: "'Outfit', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>
 
            {/* Tab: Bugs */}
            {activeTab === "bugs" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(result.bugs || []).length === 0 ? (
                  <div style={{ background: "#111113", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "32px", textAlign: "center" }}>
                    <p style={{ fontSize: 24, marginBottom: 8 }}>✓</p>
                    <p style={{ fontWeight: 600, color: "#22c55e" }}>No bugs detected</p>
                    <p style={{ fontSize: 13, color: "#52525b", marginTop: 4 }}>Your code looks clean.</p>
                  </div>
                ) : (result.bugs || []).map((bug, i) => (
                  <div key={i} className="card" style={{ background: "#111113", border: "1px solid #27272a", borderLeft: `3px solid ${getSeverityColor(bug.severity)}`, borderRadius: 12, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 99, background: `${getSeverityColor(bug.severity)}15`, color: getSeverityColor(bug.severity), fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'IBM Plex Mono', monospace" }}>{bug.severity}</span>
                      {bug.line && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#52525b" }}>line {bug.line}</span>}
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#e4e4e7" }}>{bug.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>{bug.description}</p>
                    <div style={{ background: "#0d0d0f", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 8, padding: "12px 16px" }}>
                      <p style={{ fontSize: 11, color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6, letterSpacing: "0.5px" }}>SUGGESTED FIX</p>
                      <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{bug.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* Tab: Improvements */}
            {activeTab === "improvements" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(result.improvements || []).map((imp, i) => (
                  <div key={i} className="card" style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 99, background: "rgba(124,58,237,0.1)", color: "#a78bfa", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'IBM Plex Mono', monospace" }}>{imp.category}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#e4e4e7" }}>{imp.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>{imp.description}</p>
                    {(imp.before || imp.after) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {imp.before && (
                          <div style={{ background: "#0d0d0f", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, padding: 14 }}>
                            <p style={{ fontSize: 10, color: "#ef4444", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8, letterSpacing: "0.5px" }}>BEFORE</p>
                            <pre style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#a1a1aa", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>{imp.before}</pre>
                          </div>
                        )}
                        {imp.after && (
                          <div style={{ background: "#0d0d0f", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 8, padding: 14 }}>
                            <p style={{ fontSize: 10, color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8, letterSpacing: "0.5px" }}>AFTER</p>
                            <pre style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#a78bfa", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>{imp.after}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
 
            {/* Tab: Optimized Code */}
            {activeTab === "optimized" && (
              <div className="fade-in" style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #1c1c1f", display: "flex", alignItems: "center", gap: 8, background: "#0f0f11" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#52525b" }}>optimized.{language.toLowerCase().slice(0,2)}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button onClick={copyOptimized} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #27272a", background: copiedOptimized ? "rgba(34,197,94,0.08)" : "transparent", color: copiedOptimized ? "#22c55e" : "#71717a", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {copiedOptimized ? "✓ Copied" : "Copy"}
                    </button>
                    <button onClick={() => { setCode(result.optimizedCode); setResult(null); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #7c3aed", background: "rgba(124,58,237,0.08)", color: "#a78bfa", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
                      Use this ↑
                    </button>
                  </div>
                </div>
                <pre style={{ padding: "20px 24px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#e4e4e7", lineHeight: "22px", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: 500, overflowY: "auto" }}>
                  {result.optimizedCode}
                </pre>
              </div>
            )}
          </div>
        )}
 
        <div style={{ textAlign: "center", marginTop: 48, paddingTop: 24, borderTop: "1px solid #18181b" }}>
          <p style={{ fontSize: 11, color: "#27272a", fontFamily: "'IBM Plex Mono', monospace" }}>Powered by Google Gemini · CodeReviewAI</p>
        </div>
      </main>
    </div>
  );
}
