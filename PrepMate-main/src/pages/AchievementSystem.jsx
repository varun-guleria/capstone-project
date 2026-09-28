import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, BookOpenCheck, CheckCircle2, Flame, LockKeyhole, Star, Trophy } from "lucide-react";
import { getLearningSnapshot } from "../lib/adaptiveLearning";
import { getLearningPlan, getPlanProgress } from "../lib/studentWorkspace";

export default function Achievements() {
  const [plan, setPlan] = useState(getLearningPlan);
  useEffect(() => {
    const refresh = () => setPlan(getLearningPlan());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const progress = getPlanProgress(plan);
  const attempts = plan?.checkpoints.reduce((sum, checkpoint) => sum + getLearningSnapshot(checkpoint.title).attempts, 0) || 0;
  const highProficiency = plan?.checkpoints.filter((checkpoint) => getLearningSnapshot(checkpoint.title).proficiency >= 74).length || 0;
  const badges = [
    { title: "First checkpoint", description: "Complete one roadmap checkpoint", unlocked: progress.completed >= 1, icon: <CheckCircle2 /> },
    { title: "Roadmap runner", description: "Complete every checkpoint in your roadmap", unlocked: progress.total > 0 && progress.completed === progress.total, icon: <Trophy /> },
    { title: "Quiz explorer", description: "Take 3 roadmap quizzes", unlocked: attempts >= 3, icon: <Star /> },
    { title: "Growing mastery", description: "Reach intermediate proficiency in 2 topics", unlocked: highProficiency >= 2, icon: <Award /> },
  ];

  return <main className="max-w-5xl mx-auto p-4 sm:p-8 min-h-screen">
    <div className="text-center mb-10"><p className="text-indigo-600 font-semibold">Your momentum</p><h1 className="text-4xl font-bold text-gray-900 dark:text-white">Achievements & learning topics</h1><p className="mt-2 text-gray-600 dark:text-gray-300">Badges update from your roadmap, tasks, and quiz results.</p></div>
    {!plan ? <div className="glass-card text-center p-10"><BookOpenCheck className="mx-auto text-indigo-500" size={36} /><h2 className="mt-4 text-2xl font-bold dark:text-white">No active learning plan</h2><Link to="/personalized-learning" className="inline-block mt-5 rounded-lg bg-indigo-600 text-white px-5 py-3 font-semibold">Create a roadmap</Link></div> : <>
      <section className="grid sm:grid-cols-3 gap-4 mb-9"><Stat label="Completed topics" value={`${progress.completed}/${progress.total}`} icon={<BookOpenCheck />} /><Stat label="Quiz attempts" value={attempts} icon={<Flame />} /><Stat label="Unlocked badges" value={`${badges.filter((badge) => badge.unlocked).length}/${badges.length}`} icon={<Trophy />} /></section>
      <h2 className="text-2xl font-bold dark:text-white mb-4">Badges</h2><section className="grid md:grid-cols-2 gap-4 mb-9">{badges.map((badge) => <article key={badge.title} className={`glass-card p-5 flex gap-4 ${badge.unlocked ? "" : "opacity-60"}`}><div className={`p-3 rounded-xl h-fit ${badge.unlocked ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-500"}`}>{badge.unlocked ? badge.icon : <LockKeyhole />}</div><div><h3 className="font-bold dark:text-white">{badge.title}</h3><p className="text-sm text-gray-600 dark:text-gray-300">{badge.description}</p><p className={`mt-2 text-sm font-semibold ${badge.unlocked ? "text-green-600" : "text-gray-500"}`}>{badge.unlocked ? "Unlocked" : "Keep going"}</p></div></article>)}</section>
      <h2 className="text-2xl font-bold dark:text-white mb-4">Roadmap topics</h2><section className="grid gap-3">{plan.checkpoints.map((checkpoint) => { const topic = getLearningSnapshot(checkpoint.title); return <article key={checkpoint.id} className="glass-card p-4 flex flex-col sm:flex-row justify-between gap-3"><div><p className="font-semibold dark:text-white">{checkpoint.title}</p><p className="text-sm text-gray-500">{checkpoint.status} · {topic.attempts} quiz attempts</p></div><div className="sm:text-right"><p className="font-bold text-indigo-600">{topic.isAssessed ? `${topic.proficiency}% proficiency` : "Not assessed"}</p><p className="text-sm text-gray-500">{topic.recommendedDifficulty} level</p></div></article>; })}</section>
    </>}
  </main>;
}

function Stat({ label, value, icon }) { return <article className="glass-card p-5"><div className="flex justify-between text-indigo-600">{icon}<span className="text-2xl font-bold">{value}</span></div><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{label}</p></article>; }
