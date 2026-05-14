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
  const [lineCount, setLineCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const textareaRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const lines = code.split("\n").length;
    setLineCount(lines);
    setCharCount(code.length);
  }, [code]);

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
    if (score >= 85) return "#00d97e";
    if (score >= 70) return "#f5a623";
    if (score >= 50) return "#ff6b35";
    return "#ff3b5c";
  };

  const getGradeColor = (grade) => {
    if (!grade) return "#888";
    if (grade.startsWith("A")) return "#00d97e";
    if (grade.startsWith("B")) return "#f5a623";
    if (grade.startsWith("C")) return "#ff6b35";
    return "#ff3b5c";
  };

  const getSeverityColor = (severity) => {
    const map = { critical: "#ff3b5c", high: "#ff6b35", medium: "#f5a623", low: "#64b5f6" };
    return map[severity] || "#888";
  };

  const circumference = 2 * Math.PI * 54;
  const dashOffset = result ? circumference - (animatedScore / 100) * circumference : circumference;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Space Grotesk', 'DM Mono', monospace", color: "#e8e6f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .glow-btn { transition: all 0.2s; }
        .glow-btn:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(139,92,246,0.4); }
        .glow-btn:active { transform: translateY(0); }
        .tab-btn { transition: all 0.2s; cursor: pointer; border: none; background: none; }
        .tab-btn:hover { color: #c4b5fd !important; }
        .card-hover { transition: all 0.2s; }
        .card-hover:hover { border-color: #4a3f6b !important; transform: translateY(-1px); }
        .code-area { resize: vertical; }
        .score-ring { transition: stroke-dashoffset 0.05s linear; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .bar-fill { transition: width 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .tag { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1a2e", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16, background: "#0d0b17" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </div>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#f0eeff", letterSpacing: "-0.3px" }}>CodeReview<span style={{ color: "#8b5cf6" }}>AI</span></h1>
          <p style={{ fontSize: 11, color: "#6b6480", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>AI-Powered Code Analysis</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["Bugs", "Performance", "Security", "Complexity"].map(t => (
            <span key={t} style={{ padding: "4px 12px", borderRadius: 99, border: "1px solid #2a2040", fontSize: 11, color: "#8b7aaa", fontFamily: "'DM Mono', monospace" }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Input Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 28 }}>
          {/* Code Editor */}
          <div style={{ background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1a2e", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#6b6480" }}>code_input.{language.toLowerCase().replace("c++", "cpp").replace("typescript", "ts").replace("javascript", "js").replace("python", "py")}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#4a3f6b" }}>{lineCount} lines · {charCount} chars</span>
                <button onClick={() => setCode("")} style={{ background: "none", border: "none", color: "#4a3f6b", cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>clear</button>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 16, left: 0, width: 44, padding: "0 8px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#3a3050", lineHeight: "22px", userSelect: "none", pointerEvents: "none" }}>
                {code.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea
                ref={textareaRef}
                className="code-area"
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{ width: "100%", minHeight: 340, padding: "16px 16px 16px 52px", background: "transparent", border: "none", outline: "none", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#c4b5fd", lineHeight: "22px", resize: "vertical" }}
                placeholder="// Paste your code here..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Controls Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Language Selector */}
            <div style={{ background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 11, color: "#6b6480", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>Language</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang)} style={{ padding: "8px 4px", borderRadius: 8, border: `1px solid ${language === lang ? "#8b5cf6" : "#1e1a2e"}`, background: language === lang ? "rgba(139,92,246,0.12)" : "transparent", color: language === lang ? "#c4b5fd" : "#6b6480", fontSize: 12, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: language === lang ? 600 : 400, transition: "all 0.15s" }}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 11, color: "#6b6480", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>Code Stats</p>
              {[["Lines", lineCount], ["Characters", charCount], ["Words", code.split(/\s+/).filter(Boolean).length]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1625" }}>
                  <span style={{ fontSize: 13, color: "#6b6480" }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#c4b5fd", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Analyze Button */}
            <button className="glow-btn" onClick={analyzeCode} disabled={loading || !code.trim()} style={{ padding: "18px", borderRadius: 14, background: loading ? "#2a2040" : "linear-gradient(135deg, #8b5cf6, #6d28d9)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "0.3px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? (
                <>
                  <div className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#c4b5fd" }} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  Analyze Code
                </>
              )}
            </button>

            {loading && (
              <div style={{ background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 12, padding: 16 }}>
                {["Parsing syntax...", "Detecting bugs...", "Analyzing complexity...", "Generating fixes..."].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", animationDelay: `${i * 0.3}s` }} />
                    <span style={{ fontSize: 12, color: "#6b6480", fontFamily: "'DM Mono', monospace" }}>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.2)", borderRadius: 12, padding: 16, marginBottom: 20, color: "#ff3b5c", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="fade-in">
            {/* Score Hero */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 20, padding: 28, marginBottom: 20, alignItems: "center" }}>
              {/* Ring */}
              <div style={{ position: "relative", width: 128, height: 128 }}>
                <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#1e1a2e" strokeWidth="10" />
                  <circle className="score-ring" cx="64" cy="64" r="54" fill="none" stroke={getScoreColor(animatedScore)} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: getScoreColor(animatedScore), lineHeight: 1 }}>{animatedScore}</span>
                  <span style={{ fontSize: 11, color: "#6b6480", letterSpacing: "1px", fontFamily: "'DM Mono', monospace" }}>/ 100</span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: getGradeColor(result.grade) }}>{result.grade}</span>
                  <span style={{ fontSize: 13, color: "#6b6480" }}>Code Quality Score</span>
                </div>
                <p style={{ fontSize: 14, color: "#a099b8", lineHeight: 1.6, marginBottom: 14 }}>{result.summary}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(result.keyStrengths || []).map((s, i) => (
                    <span key={i} style={{ padding: "4px 12px", borderRadius: 99, background: "rgba(0,217,126,0.08)", border: "1px solid rgba(0,217,126,0.2)", fontSize: 12, color: "#00d97e" }}>✓ {s}</span>
                  ))}
                  {(result.criticalIssues || []).map((s, i) => (
                    <span key={i} style={{ padding: "4px 12px", borderRadius: 99, background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.2)", fontSize: 12, color: "#ff3b5c" }}>✗ {s}</span>
                  ))}
                </div>
              </div>

              {/* Complexity */}
              <div style={{ background: "#0a0a0f", border: "1px solid #1e1a2e", borderRadius: 14, padding: "16px 20px", minWidth: 170 }}>
                <p style={{ fontSize: 11, color: "#6b6480", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>Complexity</p>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: "#6b6480", marginBottom: 2 }}>Time</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: "#f5a623" }}>{result.timeComplexity}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#6b6480", marginBottom: 2 }}>Space</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: "#64b5f6" }}>{result.spaceComplexity}</p>
                </div>
                <p style={{ fontSize: 11, color: "#4a3f6b", marginTop: 10, lineHeight: 1.5 }}>{result.complexityExplanation}</p>
              </div>
            </div>

            {/* Category Bars */}
            <div style={{ background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 20, padding: 24, marginBottom: 20 }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#f0eeff", marginBottom: 20, letterSpacing: "0.3px" }}>Category Breakdown</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 32px" }}>
                {Object.entries(result.categories || {}).map(([key, score]) => {
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                  const color = getScoreColor(score);
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#8b7aaa" }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
                      </div>
                      <div style={{ height: 5, background: "#1a1625", borderRadius: 99, overflow: "hidden" }}>
                        <div className="bar-fill" style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 12, padding: 4 }}>
              {[["bugs", `🐛 Bugs (${(result.bugs || []).length})`], ["improvements", `⚡ Improvements (${(result.improvements || []).length})`], ["optimized", "✨ Optimized Code"]].map(([id, label]) => (
                <button key={id} className="tab-btn" onClick={() => setActiveTab(id)} style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: activeTab === id ? "#f0eeff" : "#6b6480", background: activeTab === id ? "#1e1a2e" : "transparent", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "bugs" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(result.bugs || []).length === 0 ? (
                  <div style={{ background: "#0f0d1a", border: "1px solid rgba(0,217,126,0.2)", borderRadius: 16, padding: 32, textAlign: "center", color: "#00d97e" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                    <p style={{ fontWeight: 600 }}>No bugs detected!</p>
                    <p style={{ fontSize: 13, color: "#6b6480", marginTop: 4 }}>Your code looks clean.</p>
                  </div>
                ) : (result.bugs || []).map((bug, i) => (
                  <div key={i} className="card-hover" style={{ background: "#0f0d1a", border: `1px solid ${getSeverityColor(bug.severity)}30`, borderLeft: `3px solid ${getSeverityColor(bug.severity)}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ padding: "2px 10px", borderRadius: 99, background: `${getSeverityColor(bug.severity)}15`, color: getSeverityColor(bug.severity), fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{bug.severity}</span>
                      {bug.line && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#4a3f6b" }}>line {bug.line}</span>}
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#e8e6f0" }}>{bug.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#8b7aaa", marginBottom: 12, lineHeight: 1.6 }}>{bug.description}</p>
                    <div style={{ background: "#0a0a0f", border: "1px solid rgba(0,217,126,0.15)", borderRadius: 10, padding: "12px 16px" }}>
                      <p style={{ fontSize: 11, color: "#00d97e", fontFamily: "'DM Mono', monospace", marginBottom: 6, letterSpacing: "0.5px" }}>SUGGESTED FIX</p>
                      <p style={{ fontSize: 13, color: "#a099b8", lineHeight: 1.5 }}>{bug.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "improvements" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(result.improvements || []).map((imp, i) => (
                  <div key={i} className="card-hover" style={{ background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ padding: "2px 10px", borderRadius: 99, background: "rgba(139,92,246,0.12)", color: "#c4b5fd", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{imp.category}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#e8e6f0" }}>{imp.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#8b7aaa", marginBottom: 14, lineHeight: 1.6 }}>{imp.description}</p>
                    {(imp.before || imp.after) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {imp.before && (
                          <div style={{ background: "#0a0a0f", border: "1px solid rgba(255,59,92,0.15)", borderRadius: 10, padding: 14 }}>
                            <p style={{ fontSize: 10, color: "#ff3b5c", fontFamily: "'DM Mono', monospace", marginBottom: 8, letterSpacing: "0.5px" }}>BEFORE</p>
                            <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#a099b8", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>{imp.before}</pre>
                          </div>
                        )}
                        {imp.after && (
                          <div style={{ background: "#0a0a0f", border: "1px solid rgba(0,217,126,0.15)", borderRadius: 10, padding: 14 }}>
                            <p style={{ fontSize: 10, color: "#00d97e", fontFamily: "'DM Mono', monospace", marginBottom: 8, letterSpacing: "0.5px" }}>AFTER</p>
                            <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#c4b5fd", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>{imp.after}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "optimized" && (
              <div className="fade-in" style={{ background: "#0f0d1a", border: "1px solid #1e1a2e", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1a2e", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#6b6480" }}>optimized_code.{language.toLowerCase().slice(0,2)}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                    <button onClick={copyOptimized} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #2a2040", background: copiedOptimized ? "rgba(0,217,126,0.1)" : "transparent", color: copiedOptimized ? "#00d97e" : "#6b6480", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                      {copiedOptimized ? "✓ Copied!" : "Copy"}
                    </button>
                    <button onClick={() => { setCode(result.optimizedCode); setResult(null); }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #8b5cf6", background: "rgba(139,92,246,0.1)", color: "#c4b5fd", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                      Use this code ↑
                    </button>
                  </div>
                </div>
                <pre style={{ padding: "20px 20px 20px 20px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#c4b5fd", lineHeight: "22px", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: 500, overflowY: "auto" }}>
                  {result.optimizedCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48, paddingTop: 24, borderTop: "1px solid #1e1a2e" }}>
          <p style={{ fontSize: 12, color: "#3a3050", fontFamily: "'DM Mono', monospace" }}>Powered by Google Gemini · CodeReviewAI</p>
        </div>
      </div>
    </div>
  );
}
