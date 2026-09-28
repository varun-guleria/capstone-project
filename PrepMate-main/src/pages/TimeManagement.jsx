import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, ListTodo, Play, Plus } from "lucide-react";
import { addPersonalTask, getLearningPlan, getRoadmapTasks, removeTask, setTaskStatus, updateTaskTime } from "../lib/studentWorkspace";

export default function TimeManagement() {
  const [tasks, setTasks] = useState(getRoadmapTasks);
  const [plan, setPlan] = useState(getLearningPlan);
  const [taskName, setTaskName] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [activeTaskId, setActiveTaskId] = useState(null);

  useEffect(() => {
    const timer = activeTaskId && setInterval(() => setTasks(updateTaskTime(activeTaskId, -1)), 60000);
    return () => clearInterval(timer);
  }, [activeTaskId]);

  const refresh = () => { setTasks(getRoadmapTasks()); setPlan(getLearningPlan()); };
  const setStatus = (id, status) => { setTasks(setTaskStatus(id, status)); setPlan(getLearningPlan()); if (status === "In Progress") setActiveTaskId(id); if (status === "Completed") setActiveTaskId(null); };
  const addTask = () => { if (!taskName.trim()) return; setTasks(addPersonalTask({ name: taskName, estimatedTime })); setTaskName(""); setEstimatedTime(30); };
  const total = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  const completed = tasks.filter((task) => task.status === "Completed").reduce((sum, task) => sum + task.estimatedTime, 0);
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return <main className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen">
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8"><div><p className="text-indigo-600 font-semibold">Today&apos;s study plan</p><h1 className="text-4xl font-bold text-gray-900 dark:text-white">Tasks & checkpoints</h1><p className="mt-2 text-gray-600 dark:text-gray-300">{plan ? `Tasks are synced with your ${plan.subject} roadmap.` : "Create a roadmap to automatically generate study tasks."}</p></div><Link to="/personalized-learning" className="self-start rounded-lg bg-indigo-600 text-white px-4 py-2 font-semibold">{plan ? "View roadmap" : "Create roadmap"}</Link></div>
    <section className="glass-card p-5 mb-7"><div className="flex gap-3 items-end"><label className="flex-1 text-sm font-semibold dark:text-white">Add a personal task<input value={taskName} onChange={(event) => setTaskName(event.target.value)} placeholder="e.g., Review notes" className="mt-1 w-full border p-3 rounded-lg bg-white/70 dark:bg-gray-700 dark:border-gray-600" /></label><label className="w-24 text-sm font-semibold dark:text-white">Minutes<input type="number" min="5" value={estimatedTime} onChange={(event) => setEstimatedTime(event.target.value)} className="mt-1 w-full border p-3 rounded-lg bg-white/70 dark:bg-gray-700 dark:border-gray-600" /></label><button onClick={addTask} className="p-3 rounded-lg bg-indigo-600 text-white" title="Add task"><Plus /></button></div></section>
    <section className="mb-7"><div className="flex justify-between text-sm mb-2 dark:text-white"><span>Overall completion</span><span>{completed}/{total} minutes</span></div><div className="h-3 rounded-full bg-indigo-100 dark:bg-gray-700 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400" animate={{ width: `${progress}%` }} /></div></section>
    <section className="space-y-3"><AnimatePresence>{tasks.map((task, index) => <motion.article layout key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-indigo-300/70 bg-gradient-to-br from-indigo-500 via-violet-600 to-cyan-500 text-sm font-black tracking-wide text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-100 dark:border-indigo-400/30 dark:ring-indigo-950/70">{String(index + 1).padStart(2, "0")}</span><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${task.status === "Completed" ? "bg-green-100 text-green-600 dark:bg-green-950/50" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50"}`}>{task.status === "Completed" ? <CheckCircle2 /> : <ListTodo />}</span><div><p className="font-semibold text-gray-900 dark:text-white">{task.name}</p><p className="text-sm text-gray-500">{task.source === "roadmap" ? "Roadmap checkpoint · " : "Personal task · "}{task.roadmapEstimate ? `${task.roadmapEstimate} planned · ` : ""}{task.remainingTime}/{task.estimatedTime} study min · {task.status}</p></div></div><div className="flex flex-wrap gap-2"><button onClick={() => setStatus(task.id, "In Progress")} className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-sm font-semibold flex gap-1"><Play size={15} /> Start</button><button onClick={() => setStatus(task.id, "Completed")} className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-semibold">Complete</button><button onClick={() => setTasks(updateTaskTime(task.id, 5))} className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold">+5 min</button><button onClick={() => { setTasks(removeTask(task.id)); refresh(); }} className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold">Remove</button></div></motion.article>)}</AnimatePresence>{!tasks.length && <p className="py-12 text-center text-gray-500"><Clock3 className="inline mr-2" />No tasks yet—your generated roadmap will create them automatically.</p>}</section>
  </main>;
}
