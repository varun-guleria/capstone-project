import { useEffect, useState } from "react";
import { BarChart3, BookOpenCheck, CalendarDays, CheckCircle2, Clock3, Code2, FileSearch, Gauge, GitBranch, Play, ShieldCheck, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";
import { recordQuizAttempt } from "../lib/adaptiveLearning";
import { createWeeklyPlan, getReadinessLab, getReadinessReport, recordDiagnostic, recordMockExam, saveReadinessProfile, saveWeeklyPlan } from "../lib/readinessLab";
import api from "../lib/api";

const DIAGNOSTIC_ITEMS = ["I understand the foundations and vocabulary.", "I can solve an unseen problem without hints.", "I can explain my approach clearly.", "I can work accurately under time pressure.", "I revise weak areas on a regular schedule.", "I have evidence of my work through tests, projects, or mock results."];

export default function ReadinessLab() {
  const [lab, setLab] = useState(getReadinessLab);
  const [profile, setProfile] = useState(() => lab.profile || { mode: "Exam", target: "", targetDate: "", dailyMinutes: 90, role: "" });
  const [ratings, setRatings] = useState(Array(DIAGNOSTIC_ITEMS.length).fill(3));
  const [weeklyPlan, setWeeklyPlan] = useState(() => lab.weeklyPlan || []);
  const [mock, setMock] = useState(null);
  const [mockTopic, setMockTopic] = useState(() => lab.profile?.target || "");
  const [mockError, setMockError] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [portfolio, setPortfolio] = useState({ repoUrl: "", role: lab.profile?.role || "Frontend Developer", deployed: false, tests: false, documentation: false });
  const [portfolioResult, setPortfolioResult] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const report = getReadinessReport();

  useEffect(() => {
    if (!mock?.startedAt || secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mock?.startedAt, secondsLeft]);

  const refresh = () => setLab(getReadinessLab());
  const saveProfile = (event) => {
    event.preventDefault();
    saveReadinessProfile({ ...profile, dailyMinutes: Number(profile.dailyMinutes) });
    refresh();
    setMockTopic(profile.target);
  };
  const completeDiagnostic = () => { recordDiagnostic(Math.round((ratings.reduce((sum, value) => sum + value, 0) / (ratings.length * 5)) * 100)); refresh(); };
  const buildSchedule = () => { const next = createWeeklyPlan({ dailyMinutes: Number(profile.dailyMinutes) || 90 }); saveWeeklyPlan(next); setWeeklyPlan(next); refresh(); };

  const startMock = async () => {
    if (!mockTopic.trim()) { setMockError("Add a target topic before starting a mock exam."); return; }
    setMockLoading(true); setMockError("");
    try {
      const response = await api.post("/generate-quiz", { topic: mockTopic.trim(), difficulty: "Intermediate", proficiency: report.mastery, questionCount: 10 });
      const questions = response.data.quiz || [];
      if (!questions.length) throw new Error("No questions were generated.");
      setMock({ questions, startedAt: Date.now() }); setAnswers({}); setSecondsLeft(15 * 60);
    } catch (error) { setMockError(error.response?.data?.error || "Mock exam could not start. Check the AI service configuration."); } finally { setMockLoading(false); }
  };

  const submitMock = () => {
    if (!mock) return;
    const correct = mock.questions.filter((question, index) => answers[index] === question.correct_answer).length;
    const incorrect = mock.questions.length - correct;
    const net = Math.max(0, correct - (incorrect * 0.25));
    const percentage = Math.round((net / mock.questions.length) * 100);
    const durationSeconds = Math.max(1, Math.round((Date.now() - mock.startedAt) / 1000));
    recordQuizAttempt({ topic: mockTopic, correctAnswers: correct, totalQuestions: mock.questions.length, difficulty: "Intermediate", durationSeconds });
    recordMockExam({ topic: mockTopic, correct, incorrect, net: Number(net.toFixed(2)), total: mock.questions.length, percentage, durationSeconds });
    setMock((current) => ({ ...current, result: { correct, incorrect, net, percentage } })); refresh();
  };

  const reviewPortfolio = async (event) => {
    event.preventDefault(); setPortfolioLoading(true); setPortfolioResult(null);
    try { const response = await api.post("/review-portfolio", portfolio); setPortfolioResult(response.data.review); } catch (error) { setPortfolioResult({ error: error.response?.data?.error || "Portfolio review could not be completed." }); } finally { setPortfolioLoading(false); }
  };

  return <main className="mx-auto min-h-screen max-w-7xl p-4 sm:p-8">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-950 p-6 text-white shadow-2xl sm:p-10"><div className="max-w-3xl"><p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm"><Gauge size={16} /> Capstone module</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">PrepMate Readiness Lab</h1><p className="mt-3 text-indigo-100">A closed learning loop for skills and exams: diagnose, plan, practise under pressure, prove work, and improve from measurable evidence.</p></div></section>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={<Gauge />} label="Readiness" value={`${report.score}%`} /><Metric icon={<GitBranch />} label="Mastery" value={`${report.mastery}%`} /><Metric icon={<BookOpenCheck />} label="Coverage" value={`${report.completion}%`} /><Metric icon={<TimerReset />} label="Mock average" value={report.mocks.length ? `${report.mockAverage}%` : "—"} /><Metric icon={<BarChart3 />} label="Consistency" value={`${report.consistency}%`} /></section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><form onSubmit={saveProfile} className="glass-card p-5 sm:p-6"><p className="font-semibold text-indigo-600">1. Target profile</p><h2 className="mt-1 text-2xl font-bold dark:text-white">Define the outcome</h2><div className="mt-5 grid gap-3"><label className="text-sm font-semibold dark:text-white">Preparation type<select value={profile.mode} onChange={(event) => setProfile({ ...profile, mode: event.target.value })} className="mt-1 w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900"><option>Exam</option><option>Skill</option><option>Placement</option></select></label><label className="text-sm font-semibold dark:text-white">Target<input required value={profile.target} onChange={(event) => setProfile({ ...profile, target: event.target.value })} placeholder="e.g. GATE CSE or React" className="mt-1 w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900" /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold dark:text-white">Target date<input type="date" value={profile.targetDate} onChange={(event) => setProfile({ ...profile, targetDate: event.target.value })} className="mt-1 w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900" /></label><label className="text-sm font-semibold dark:text-white">Daily minutes<input type="number" min="20" max="480" value={profile.dailyMinutes} onChange={(event) => setProfile({ ...profile, dailyMinutes: event.target.value })} className="mt-1 w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900" /></label></div><label className="text-sm font-semibold dark:text-white">Target role (optional)<input value={profile.role} onChange={(event) => setProfile({ ...profile, role: event.target.value })} placeholder="e.g. Frontend Developer" className="mt-1 w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900" /></label><button className="rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white">Save readiness profile</button></div></form>
      <article className="glass-card p-5 sm:p-6"><p className="font-semibold text-indigo-600">Recommended next action</p><h2 className="mt-1 text-2xl font-bold dark:text-white">{report.priority ? `Strengthen ${report.priority.checkpoint.title}` : "Create a learning roadmap"}</h2><p className="mt-3 text-gray-600 dark:text-gray-300">{report.priority ? report.priority.snapshot.isAssessed ? `${report.priority.snapshot.proficiency}% current proficiency. Begin with a diagnostic, then use the weekly plan and timed mock results to focus your revision.` : "This topic is not assessed yet. Take a short adaptive quiz to establish a real baseline before assigning proficiency." : "Your roadmap supplies the competency map. Add one before building a schedule."}</p><div className="mt-5 flex flex-wrap gap-2"><Link to="/personalized-learning" className="rounded-lg bg-indigo-100 px-4 py-2 font-semibold text-indigo-700">Build roadmap</Link><Link to="/quizzes" className="rounded-lg border border-indigo-200 px-4 py-2 font-semibold text-indigo-700">Take adaptive quiz</Link></div><p className="mt-5 text-xs text-gray-500">Readiness combines coverage (25%), assessed mastery (30%), diagnostic (15%), mocks (20%), and consistency (10%).</p></article></section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]"><article className="glass-card p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-indigo-600">2. Diagnostic</p><h2 className="text-2xl font-bold dark:text-white">Baseline confidence check</h2></div><FileSearch className="text-indigo-600" /></div><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Rate your current evidence honestly. Follow it with an adaptive quiz for a performance-based baseline.</p><div className="mt-5 space-y-3">{DIAGNOSTIC_ITEMS.map((item, index) => <label key={item} className="grid gap-2 text-sm font-medium sm:grid-cols-[1fr_auto]"><span>{item}</span><select value={ratings[index]} onChange={(event) => setRatings(ratings.map((value, itemIndex) => itemIndex === index ? Number(event.target.value) : value))} className="rounded-lg border px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900"><option value="1">1 — not yet</option><option value="2">2 — limited</option><option value="3">3 — developing</option><option value="4">4 — confident</option><option value="5">5 — strong evidence</option></select></label>)}</div><button onClick={completeDiagnostic} className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 font-bold text-white dark:bg-indigo-600">Save diagnostic: {Math.round((ratings.reduce((sum, value) => sum + value, 0) / (ratings.length * 5)) * 100)}%</button></article>
      <article className="glass-card p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-indigo-600">3. Competency map</p><h2 className="text-2xl font-bold dark:text-white">Mastery by roadmap checkpoint</h2></div><GitBranch className="text-indigo-600" /></div><div className="mt-5 space-y-3">{report.topics.length ? report.topics.map(({ checkpoint, snapshot }, index) => <div key={checkpoint.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="flex justify-between gap-3"><p className="font-semibold dark:text-white"><span className="mr-2 text-indigo-600">{index + 1}</span>{checkpoint.title}</p><span className="text-sm font-bold text-indigo-600">{snapshot.isAssessed ? `${snapshot.proficiency}%` : "Not assessed"}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100 dark:bg-slate-700"><div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${snapshot.proficiency || 0}%` }} /></div><p className="mt-2 text-xs text-gray-500">{checkpoint.status} · {snapshot.attempts} adaptive attempt{snapshot.attempts === 1 ? "" : "s"} · {snapshot.recommendedDifficulty}</p></div>) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-gray-600 dark:bg-slate-900 dark:text-gray-300">Create a roadmap to turn prerequisites and skills into a visual mastery map.</p>}</div></article></section>

    <section className="mt-6 glass-card p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-semibold text-indigo-600">4. Adaptive weekly planner</p><h2 className="text-2xl font-bold dark:text-white">Time-boxed plan with revision spacing</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Every third day includes a revision block, while unfinished roadmap tasks are rotated through the week.</p></div><button onClick={buildSchedule} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-bold text-white"><CalendarDays size={17} /> Generate 7-day plan</button></div>{weeklyPlan.length > 0 && <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{weeklyPlan.map((day) => <div key={day.date} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p className="font-bold dark:text-white">{day.label}</p><p className="text-xs text-gray-500">{day.minutes} focused minutes</p><div className="mt-3 space-y-2">{day.blocks.map((block) => <div key={`${day.date}-${block.title}-${block.type}`} className="rounded-lg bg-indigo-50 p-2 text-sm dark:bg-indigo-950/40"><span className="text-xs font-bold text-indigo-600">{block.type} · {block.minutes}m</span><p className="font-medium dark:text-white">{block.title}</p></div>)}</div></div>)}</div>}</section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><article className="glass-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-indigo-600">5. Exam-day simulator</p><h2 className="text-2xl font-bold dark:text-white">Timed mock with negative marking</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">10 AI-generated questions · 15 minutes · +1 correct / −0.25 incorrect.</p></div>{mock?.startedAt && !mock.result && <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-2 font-bold text-rose-700"><Clock3 size={16} />{formatTime(secondsLeft)}</span>}</div>{!mock && <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={mockTopic} onChange={(event) => setMockTopic(event.target.value)} placeholder="Mock topic" className="flex-1 rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900" /><button onClick={startMock} disabled={mockLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-bold text-white dark:bg-indigo-600"><Play size={17} />{mockLoading ? "Preparing..." : "Start mock"}</button></div>}{mockError && <p className="mt-3 text-sm text-rose-600">{mockError}</p>}{mock && <MockExam mock={mock} answers={answers} setAnswers={setAnswers} onSubmit={submitMock} onReset={() => setMock(null)} />}</article>
      <form onSubmit={reviewPortfolio} className="glass-card p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="font-semibold text-indigo-600">6. Portfolio evidence review</p><h2 className="text-2xl font-bold dark:text-white">Job-role skill-gap check</h2></div><Code2 className="text-indigo-600" /></div><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Submit a public GitHub repository for an evidence-based rubric—not an invented AI code review.</p><div className="mt-5 space-y-3"><input required value={portfolio.repoUrl} onChange={(event) => setPortfolio({ ...portfolio, repoUrl: event.target.value })} placeholder="https://github.com/owner/repository" className="w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900" /><input value={portfolio.role} onChange={(event) => setPortfolio({ ...portfolio, role: event.target.value })} placeholder="Target role" className="w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900" /><label className="flex gap-2 text-sm"><input type="checkbox" checked={portfolio.deployed} onChange={(event) => setPortfolio({ ...portfolio, deployed: event.target.checked })} /> Live demo or deployment exists</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={portfolio.tests} onChange={(event) => setPortfolio({ ...portfolio, tests: event.target.checked })} /> Automated tests included</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={portfolio.documentation} onChange={(event) => setPortfolio({ ...portfolio, documentation: event.target.checked })} /> Clear setup and usage documentation</label><button disabled={portfolioLoading} className="rounded-lg bg-indigo-600 px-4 py-2.5 font-bold text-white">{portfolioLoading ? "Reviewing..." : "Review portfolio evidence"}</button></div>{portfolioResult && <PortfolioResult result={portfolioResult} />}</form></section>
  </main>;
}

function MockExam({ mock, answers, setAnswers, onSubmit, onReset }) {
  if (mock.result) return <div className="mt-5 rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/30"><div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300"><CheckCircle2 /><h3 className="text-xl font-bold">Mock complete: {mock.result.percentage}%</h3></div><p className="mt-2 text-sm">{mock.result.correct} correct, {mock.result.incorrect} incorrect, net score {mock.result.net.toFixed(2)}/{mock.questions.length}. Your readiness index and topic proficiency have been updated.</p><button onClick={onReset} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white">Start another mock</button></div>;
  return <div className="mt-5 space-y-5">{mock.questions.map((question, index) => <fieldset key={question.question} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><legend className="px-1 font-semibold dark:text-white">{index + 1}. {question.question}</legend><div className="mt-3 grid gap-2">{question.options.map((option) => <label key={option} className={`cursor-pointer rounded-lg border p-3 text-sm ${answers[index] === option ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-slate-200 dark:border-slate-700"}`}><input className="mr-2" type="radio" name={`mock-${index}`} checked={answers[index] === option} onChange={() => setAnswers({ ...answers, [index]: option })} />{option}</label>)}</div></fieldset>)}<button onClick={onSubmit} className="rounded-lg bg-indigo-600 px-5 py-3 font-bold text-white">Submit timed mock</button></div>;
}

function PortfolioResult({ result }) {
  if (result.error) return <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{result.error}</p>;
  return <div className="mt-4 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/40"><div className="flex items-center justify-between"><p className="font-bold dark:text-white">Portfolio evidence score</p><p className="text-2xl font-black text-indigo-600">{result.score}%</p></div><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{result.repository.fullName} · {result.repository.language || "No primary language reported"} · {result.repository.stars} stars</p><div className="mt-3"><p className="text-xs font-bold uppercase text-gray-500">Next evidence to add</p><ul className="mt-1 list-disc pl-5 text-sm">{result.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></div></div>;
}

function Metric({ icon, label, value }) { return <article className="glass-card p-4"><div className="flex items-center justify-between text-indigo-600">{icon}<span className="text-2xl font-black text-slate-900 dark:text-white">{value}</span></div><p className="mt-2 text-xs font-semibold text-gray-500">{label}</p></article>; }
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
