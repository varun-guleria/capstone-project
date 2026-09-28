import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CheckCircle2, CircleDashed, Trophy } from "lucide-react";
import { getLearningSnapshot } from "../lib/adaptiveLearning";
import { getLearningPlan, getPlanProgress } from "../lib/studentWorkspace";

export default function ProgressAnalytics() {
  const [plan, setPlan] = useState(getLearningPlan);

  useEffect(() => {
    const refresh = () => setPlan(getLearningPlan());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!plan) return <EmptyAnalytics />;
  const progress = getPlanProgress(plan);
  const insight = buildReadinessInsight(plan, progress);

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div><p className="text-indigo-600 font-semibold">Learning analytics</p><h1 className="text-4xl font-bold text-gray-900 dark:text-white">{plan.subject}</h1><p className="mt-2 text-gray-600 dark:text-gray-300">{plan.goal}</p></div>
        <div className="rounded-xl bg-white/70 dark:bg-gray-800/80 p-4 shadow"><p className="text-sm text-gray-500">Roadmap progress</p><p className="text-2xl font-bold text-indigo-600">{progress.completed}/{progress.total} checkpoints</p></div>
      </div>
      <div className="h-3 rounded-full bg-indigo-100 dark:bg-gray-700 overflow-hidden mb-8"><div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${progress.percentage}%` }} /></div>
      <section className="grid gap-4 md:grid-cols-[1.4fr_.6fr] mb-8"><article className="glass-card p-5"><p className="text-sm font-semibold text-indigo-600">Recommended next action</p><h2 className="mt-1 text-xl font-bold dark:text-white">{insight.title}</h2><p className="mt-2 text-gray-600 dark:text-gray-300">{insight.message}</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/quizzes" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Take adaptive quiz</Link><Link to="/time-management" className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-800 dark:text-indigo-200">Open study tasks</Link></div></article><article className="glass-card p-5"><p className="text-sm font-semibold text-indigo-600">Placement readiness index</p><p className="mt-1 text-4xl font-black text-gray-900 dark:text-white">{insight.readiness}%</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Combines roadmap completion, average topic proficiency, and quiz consistency.</p><p className="mt-3 text-xs font-semibold text-gray-500">{insight.attempts} completed quiz attempt{insight.attempts === 1 ? "" : "s"} across this roadmap</p></article></section>
      <section className="grid gap-4">
        {plan.checkpoints.map((checkpoint, index) => {
          const learning = getLearningSnapshot(checkpoint.title);
          const completed = checkpoint.status === "Completed";
          return <article key={checkpoint.id} className="glass-card p-5 grid md:grid-cols-[auto_1fr_auto] gap-4 items-center">
            {completed ? <CheckCircle2 className="text-green-500" size={28} /> : <CircleDashed className="text-indigo-500" size={28} />}
            <div><p className="text-sm text-gray-500">Checkpoint {index + 1} · {checkpoint.status}</p><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{checkpoint.title}</h2><p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{learning.attempts ? `${learning.accuracy}% quiz accuracy across ${learning.attempts} attempts` : "No quiz data yet"}</p></div>
            <div className="text-left md:text-right"><p className="text-xs text-gray-500 uppercase">Proficiency</p><p className="text-2xl font-bold text-indigo-600">{learning.isAssessed ? `${learning.proficiency}%` : "Not assessed"}</p><span className="text-sm text-gray-500">{learning.recommendedDifficulty}</span></div>
          </article>;
        })}
      </section>
    </main>
  );
}

function buildReadinessInsight(plan, progress) {
  const topics = plan.checkpoints.map((checkpoint) => ({ checkpoint, learning: getLearningSnapshot(checkpoint.title) }));
  const attempts = topics.reduce((sum, topic) => sum + topic.learning.attempts, 0);
  const assessedTopics = topics.filter((topic) => topic.learning.isAssessed);
  const averageProficiency = assessedTopics.length ? assessedTopics.reduce((sum, topic) => sum + topic.learning.proficiency, 0) / assessedTopics.length : 0;
  const consistency = Math.min(100, attempts * 20);
  const readiness = Math.round((progress.percentage * 0.45) + (averageProficiency * 0.4) + (consistency * 0.15));
  const activeTopics = topics.filter((topic) => topic.checkpoint.status !== "Completed");
  const priority = (activeTopics.length ? activeTopics : topics).sort((left, right) => Number(left.learning.isAssessed) - Number(right.learning.isAssessed) || left.learning.proficiency - right.learning.proficiency)[0];

  if (!priority) return { title: "Create your first roadmap", message: "Your next recommendation will appear after you add learning checkpoints.", readiness: 0, attempts: 0 };
  if (!priority.learning.attempts) return { title: `Diagnose ${priority.checkpoint.title}`, message: "Take a short adaptive quiz to establish a baseline before committing more study time.", readiness, attempts };
  if (priority.learning.accuracy < 60) return { title: `Repair foundations in ${priority.checkpoint.title}`, message: `Your recent accuracy is ${priority.learning.accuracy}%. Revisit the prerequisite material, then retry at ${priority.learning.recommendedDifficulty} level.`, readiness, attempts };
  return { title: `Advance ${priority.checkpoint.title}`, message: `${priority.learning.proficiency}% estimated proficiency suggests you can consolidate this checkpoint with a ${priority.learning.recommendedDifficulty.toLowerCase()}-level quiz.`, readiness, attempts };
}

function EmptyAnalytics() {
  return <main className="max-w-3xl mx-auto p-8 min-h-screen text-center flex flex-col items-center justify-center"><div className="rounded-full p-4 bg-indigo-100 text-indigo-600"><BarChart3 size={36} /></div><h1 className="mt-5 text-3xl font-bold dark:text-white">Your learning analytics will appear here</h1><p className="mt-3 text-gray-600 dark:text-gray-300">Generate a roadmap, complete checkpoints, and take roadmap quizzes to see topic-level proficiency.</p><Link className="mt-6 px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold" to="/personalized-learning">Create a roadmap</Link><Trophy className="mt-8 text-amber-400" size={24} /></main>;
}
