import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { BarChart3, BrainCircuit, ChevronDown, Database, Download, FileUp, Layers3, LoaderCircle, Merge, Radar, Sparkles, Upload, WandSparkles } from "lucide-react";
import api from "../lib/api";

const parseRecords = (text) => text.split("\n").reduce((items, line) => {
  const match = line.trim().match(/^((?:19|20)\d{2})\s*[,|:-]\s*(.+)$/);
  return match ? [...items, { year: Number(match[1]), question: match[2].trim() }] : items;
}, []);

export default function QuestionPredictor() {
  const [records, setRecords] = useState([]);
  const [paste, setPaste] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [intent, setIntent] = useState("all");
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  const runPrediction = useCallback(async (nextRecords) => {
    setLoading(true); setError(""); setProgress(null); setResult(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/predict-questions-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: nextRecords })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === "progress") {
                setProgress(data);
              } else if (data.type === "complete") {
                setResult(data.result);
                setProgress(null);
                setEvaluation(null);
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (err) {
              // Ignore partial or unparseable JSON from stream boundary issues
            }
          }
        }
      }
    } catch (requestError) {
      setError(requestError.message || "The prediction service is unavailable. Start the PrepMate server and try again.");
    } finally { setLoading(false); }
  }, []);

  const loadDemo = async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/prediction-demo");
      setRecords(response.data.records);
      await runPrediction(response.data.records);
    } catch {
      setError("The prediction service is unavailable. Start the PrepMate server and try again.");
      setLoading(false);
    }
  };

  const importPasted = () => {
    const parsed = parseRecords(paste);
    if (parsed.length < 3) {
      setError("Paste at least three lines in the format: 2024, Explain gradient descent.");
      return;
    }
    setRecords(parsed); setPaste(""); setExpanded(null); runPrediction(parsed);
  };

  const importFile = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    
    let allParsed = [];
    for (const file of files) {
      const text = await file.text();
      const parsed = parseRecords(text);
      allParsed = [...allParsed, ...parsed];
    }
    
    event.target.value = "";
    if (allParsed.length < 3) {
      setError("The files need at least three lines combined in the format: 2024, Explain gradient descent.");
      return;
    }
    setRecords(allParsed); setPaste(""); setExpanded(null); runPrediction(allParsed);
  };

  const runBacktest = async () => {
    setEvaluationLoading(true); setError("");
    try {
      const response = await api.post("/evaluate-prediction", { records });
      setEvaluation(response.data.evaluation);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "The validation service is unavailable.");
    } finally { setEvaluationLoading(false); }
  };

  const predictions = useMemo(() => (result?.predictions || []).filter((prediction) => intent === "all" || prediction.intent === intent), [result, intent]);
  const intents = [...new Set(result?.predictions?.map((prediction) => prediction.intent) || [])];
  const downloadPredictionDocument = async () => {
    if (!result) return;
    const createdAt = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date());
    const questions = result.predictions.map((prediction) => `
      <section class="question">
        <div class="heading"><span class="rank">${prediction.rank}</span><div><h2>${escapeHtml(prediction.question)}</h2><p>${prediction.confidence}% confidence · Asked ${prediction.frequency} time${prediction.frequency === 1 ? "" : "s"} · ${prediction.years.join(", ")}</p></div></div>
        <p class="note"><strong>Revision focus:</strong> ${capitalize(prediction.intent)}-style question. Study this as one theme; ${prediction.variants.length} equivalent phrasing${prediction.variants.length === 1 ? " is" : "s are"} consolidated below.</p>
        ${prediction.variants.length > 1 ? `<ul>${prediction.variants.map((variant) => `<li><strong>${variant.year}:</strong> ${escapeHtml(variant.question)}</li>`).join("")}</ul>` : ""}
      </section>`).join("");
    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>PrepMate Predicted Questions</title><style>body{font-family:Arial,sans-serif;color:#172033;line-height:1.5;margin:42px;max-width:820px}h1{color:#3730a3;margin-bottom:4px}.sub{color:#64748b;margin-top:0}.summary{display:flex;gap:12px;margin:25px 0}.metric{background:#eef2ff;border-radius:10px;padding:12px 16px;min-width:120px}.metric strong{display:block;font-size:20px;color:#4338ca}.question{border:1px solid #dbeafe;border-radius:12px;padding:18px;margin:14px 0;page-break-inside:avoid}.heading{display:flex;gap:13px;align-items:flex-start}.rank{background:#4f46e5;color:#fff;border-radius:8px;padding:5px 9px;font-weight:bold}.heading h2{font-size:17px;margin:0}.heading p,.note{font-size:13px;color:#475569;margin:6px 0}.note{background:#f8fafc;border-radius:7px;padding:9px}ul{font-size:13px;padding-left:20px}li{margin:5px 0}@media print{body{margin:24px}}</style></head><body><h1>Most Probable Exam Questions</h1><p class="sub">Generated by PrepMate Prediction Studio · ${createdAt}</p><div class="summary"><div class="metric"><strong>${result.summary.sourceQuestions}</strong>historical questions</div><div class="metric"><strong>${result.summary.mergedCount}</strong>variants merged</div><div class="metric"><strong>${result.summary.yearCount}</strong>years analysed</div></div><p>This revision sheet ranks recurring question themes using historical frequency, paper coverage, recency, and trend consistency. Confidence is a revision priority, not a guarantee of the exam paper.</p>${questions}<p class="sub">Use this document alongside your syllabus and instructor guidance.</p></body></html>`;
    
    try {
      const response = await api.post("/generate-docx", { html: documentHtml }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "PrepMate-Most-Probable-Questions.docx"; link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading docx", error);
      setError("Failed to generate DOCX document");
    }
  };

  return <main className="max-w-7xl mx-auto p-4 sm:p-8 min-h-screen text-slate-900 dark:text-white">
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 sm:p-10 shadow-2xl">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 75% 8%, rgba(99,102,241,.72), transparent 28%), radial-gradient(circle at 12% 100%, rgba(6,182,212,.38), transparent 35%)" }} />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-indigo-100"><WandSparkles size={15} /> Prediction Studio</div>
        <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight text-white">Question Paper Predictor</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Turn previous papers into a ranked, de-duplicated revision list. Every prediction is supported by frequency, coverage, recency, and trend—not a black-box guess.</p>
      </div>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1.18fr_.82fr]">
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-xl dark:text-white">Historical paper input</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use the demo dataset or replace it with your own past-paper questions.</p></div><span className="rounded-xl bg-indigo-100 dark:bg-indigo-950/60 p-3 text-indigo-600"><FileUp size={22} /></span></div>
        <textarea value={paste} onChange={(event) => setPaste(event.target.value)} className="mt-5 min-h-32 w-full rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:focus:ring-indigo-900" placeholder={"2023, Explain gradient descent.\n2024, How does gradient descent minimize loss?\n2025, Describe gradient descent step by step."} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-slate-500 dark:text-slate-300">One question per line: <strong>year, question</strong></span><div className="flex flex-wrap gap-2"><button onClick={loadDemo} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-200"><WandSparkles size={16} /> Load Demo</button><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-200"><Upload size={16} /> Import CSV or TXT<input type="file" accept=".csv,.txt,text/csv,text/plain" multiple onChange={importFile} className="sr-only" /></label><button onClick={importPasted} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700"><Database size={16} /> Analyse pasted papers</button></div></div>
      </div>
      <ModelCard result={result} loading={loading} />
    </section>

    {error && <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700" role="alert">{error}</p>}
    {loading && !result && (
      <div className="mt-12 flex flex-col items-center justify-center p-8 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-indigo-100 dark:border-slate-800">
        <LoaderCircle className="animate-spin text-indigo-600 mb-4" size={32} /> 
        <div className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          {progress ? progress.message : "Preparing prediction workspace…"}
        </div>
        {progress && progress.totalBatches && (
          <div className="w-full max-w-md mt-4">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
              <span>Progress</span>
              <span>{Math.round((progress.currentBatch / progress.totalBatches) * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <Motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.currentBatch / progress.totalBatches) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
    )}

    {result && <>
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Database />} label="Source questions" value={result.summary.sourceQuestions} tone="indigo" />
        <Stat icon={<Merge />} label="Variants merged" value={result.summary.mergedCount} tone="cyan" />
        <Stat icon={<Layers3 />} label="Unique themes" value={result.summary.uniquePredictions} tone="violet" />
        <Stat icon={<BarChart3 />} label="Papers covered" value={result.summary.yearCount} tone="emerald" />
      </section>
      <section className="mt-6 glass-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-indigo-600">Retrospective validation</p><h2 className="text-xl font-bold dark:text-white">Backtest against the latest paper</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Hides the newest year, predicts it from earlier papers, then reports precision, recall, and F1. This evaluates historical fit; it does not promise future questions.</p></div><button onClick={runBacktest} disabled={evaluationLoading || result.summary.yearCount < 2} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:bg-slate-400 dark:bg-indigo-600"><Sparkles size={16} />{evaluationLoading ? "Running backtest..." : "Run backtest"}</button></div>{result.summary.yearCount < 2 && <p className="mt-3 text-sm text-amber-700">Add papers from at least two years to enable validation.</p>}{evaluation && <BacktestPanel evaluation={evaluation} />}</section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.28fr_.72fr]">
        <div className="glass-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold dark:text-white">Probability landscape</h2><p className="text-sm text-slate-600 dark:text-slate-300">Confidence combines repeat rate, coverage, freshness, and stable trend.</p></div><label className="relative"><select value={intent} onChange={(event) => setIntent(event.target.value)} className="appearance-none rounded-xl border bg-white px-4 py-2 pr-10 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="all">All question types</option>{intents.map((item) => <option key={item} value={item}>{capitalize(item)} questions</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-2.5" size={16} /></label></div>
          <div className="mt-6 space-y-4">{predictions.slice(0, 7).map((prediction) => <ProbabilityBar key={prediction.id} prediction={prediction} />)}</div>
        </div>
        <SignalChart signals={result.signals} />
      </section>
      <section className="mt-6 glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"><div><h2 className="text-xl font-bold dark:text-white">High-value revision questions</h2><p className="text-sm text-slate-600 dark:text-slate-300">Click a card to inspect every wording variant folded into the prediction.</p></div><div className="flex flex-wrap gap-2"><button onClick={downloadPredictionDocument} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"><Download size={16} /> Download study document</button><span className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-2 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"><BrainCircuit size={16} /> {result.summary.threshold} merge threshold</span></div></div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">{predictions.map((prediction) => <PredictionRow key={prediction.id} prediction={prediction} expanded={expanded === prediction.id} onToggle={() => setExpanded(expanded === prediction.id ? null : prediction.id)} />)}</div>
      </section>
    </>}
  </main>;
}

function ModelCard({ result, loading }) {
  const modelName = result?.summary?.modelType ? `PrepMate ${result.summary.modelType} Model` : "Multi-signal prediction model";
  const initialSignals = ["Phrase & character matching", "Question-intent detection", "Frequency + coverage + trend"];
  const signals = result?.summary?.modelType === "Neural (BGE)"
    ? ["BGE neural embeddings", ...initialSignals]
    : ["TF-IDF term similarity", ...initialSignals];

  return <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-xl">
    <div className="flex items-center gap-3"><span className="rounded-xl bg-white/15 p-3"><Radar size={23} /></span><div><p className="font-bold">{modelName}</p><p className="text-sm text-indigo-100">Transparent scoring, not generated answers.</p></div></div>
    <div className="mt-7 space-y-3">{signals.map((item, index) => <div key={item} className="flex items-center gap-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-xs font-bold">{index + 1}</span>{item}</div>)}</div>
    <p className="mt-6 border-t border-white/15 pt-4 text-sm text-indigo-100">{loading ? "Recomputing results…" : `${result?.summary?.mergedCount || 0} equivalent phrasings consolidated safely.`}</p>
  </div>;
}

function BacktestPanel({ evaluation }) {
  return <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat icon={<TargetIcon />} label="Precision" value={`${evaluation.precision}%`} tone="indigo" /><Stat icon={<Radar />} label="Recall" value={`${evaluation.recall}%`} tone="cyan" /><Stat icon={<BarChart3 />} label="F1 score" value={`${evaluation.f1}%`} tone="violet" /><Stat icon={<Database />} label="Held-out year" value={evaluation.heldOutYear} tone="emerald" /></div><p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Compared {evaluation.evaluatedPredictions} ranked themes against {evaluation.actualQuestions} questions from {evaluation.heldOutYear} using {evaluation.matchMethod} (match threshold: {evaluation.threshold}%).</p><div className="mt-4 max-h-56 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">{evaluation.matches.map((match, index) => <div key={`${match.actualQuestion}-${index}`} className="grid gap-2 p-3 text-sm sm:grid-cols-[auto_1fr_auto]"><span className={`h-fit rounded-full px-2 py-1 text-xs font-bold ${match.hit ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{match.hit ? "Matched" : "Not matched"}</span><div><p className="font-semibold dark:text-white">Actual: {match.actualQuestion}</p><p className="mt-1 text-slate-500 dark:text-slate-300">Closest theme: {match.predictedQuestion}</p></div><span className="font-bold text-indigo-600">{match.similarity}%</span></div>)}</div></div>;
}

function TargetIcon() { return <span className="text-lg font-black">P</span>; }

function Stat({ icon, label, value, tone }) {
  const tones = { indigo: "border-indigo-100 text-indigo-600", cyan: "border-cyan-100 text-cyan-600", violet: "border-violet-100 text-violet-600", emerald: "border-emerald-100 text-emerald-600" };
  return <div className={`rounded-2xl border bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 ${tones[tone]}`}><div>{icon}</div><p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{value}</p><p className="text-xs font-medium text-slate-500 dark:text-slate-300">{label}</p></div>;
}

function ProbabilityBar({ prediction }) { return <div><div className="mb-1.5 flex gap-3 text-sm"><span className="w-6 font-bold text-indigo-600">{prediction.rank}</span><p className="min-w-0 flex-1 truncate font-semibold dark:text-white">{prediction.question}</p><span className="font-black text-indigo-600">{prediction.confidence}%</span></div><div className="ml-9 h-2.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-slate-700"><Motion.div initial={{ width: 0 }} animate={{ width: `${prediction.confidence}%` }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" /></div></div>; }

function SignalChart({ signals }) { const circumference = 2 * Math.PI * 66; return <div className="glass-card p-5 sm:p-6"><h2 className="text-xl font-bold dark:text-white">Scoring signals</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">How the ranking weight is allocated.</p><div className="mt-5 flex items-center gap-5"><svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0 -rotate-90"><circle cx="80" cy="80" r="66" fill="none" stroke="currentColor" strokeWidth="15" className="text-slate-100 dark:text-slate-700" />{signals.map((signal, index) => { const previous = signals.slice(0, index).reduce((sum, item) => sum + item.weight, 0); return <circle key={signal.label} cx="80" cy="80" r="66" fill="none" stroke={["#6366f1", "#06b6d4", "#8b5cf6", "#34d399"][index]} strokeWidth="15" strokeDasharray={`${(signal.weight / 100) * circumference - 3} ${circumference}`} strokeDashoffset={-((previous / 100) * circumference)} />; })}</svg><div className="space-y-2">{signals.map((signal, index) => <div key={signal.label} className="flex items-center gap-2 text-xs dark:text-slate-200"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ["#6366f1", "#06b6d4", "#8b5cf6", "#34d399"][index] }} />{signal.label} <strong>{signal.weight}%</strong></div>)}</div></div></div>; }

function PredictionRow({ prediction, expanded, onToggle }) { return <article><button onClick={onToggle} className="grid w-full grid-cols-[auto_1fr_auto] gap-3 p-5 text-left transition hover:bg-indigo-50/50 dark:hover:bg-slate-800/50"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white">{prediction.rank}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold dark:text-white">{prediction.question}</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-200">{prediction.intent}</span></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Appears {prediction.frequency} times across {prediction.years.join(", ")} · {prediction.coverage}% paper coverage</p></div><div className="text-right"><p className="text-xl font-black text-indigo-600">{prediction.confidence}%</p><p className="text-xs text-slate-500">confidence</p><ChevronDown className={`ml-auto mt-1 transition ${expanded ? "rotate-180" : ""}`} size={16} /></div></button><AnimatePresence>{expanded && <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mx-5 mb-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Merged variants ({prediction.variants.length})</p><ul className="mt-3 space-y-2">{prediction.variants.map((variant, index) => <li key={`${variant.year}-${index}`} className="flex gap-3 text-sm dark:text-slate-200"><span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{variant.year}</span>{variant.question}</li>)}</ul></div></Motion.div>}</AnimatePresence></article>; }

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
