import { useState } from "react";
import { BookOpen, CheckCircle2, Clock, ExternalLink, FileText, Github, Globe2, PlayCircle, Plus, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLearningPlan, getPlanProgress, saveLearningPlan, setCheckpointStatus } from "../lib/studentWorkspace";
import api from "../lib/api";

export default function PersonalizedLearning() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(getLearningPlan);
  const [subject, setSubject] = useState(plan?.subject || "");
  const [goal, setGoal] = useState(plan?.goal || "");
  const [skillLevel, setSkillLevel] = useState(plan?.skillLevel || "Beginner");
  const [scope, setScope] = useState("Topic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateRoadmap = async () => {
    if (!subject.trim() || !goal.trim()) {
      setError("Choose what you want to learn and set a goal first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/generate-roadmap", {
        topic: subject.trim(),
        goal: goal.trim(),
        skillLevel,
        learningScope: scope,
      });
      let roadmap = response.data.roadmap;
      if (typeof roadmap === "string") roadmap = JSON.parse(roadmap.replace(/```json|```/g, "").trim());
      const saved = saveLearningPlan({ subject, goal, skillLevel, roadmap });
      setPlan(saved);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "Could not generate your roadmap. Check that the API server is running and try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateCheckpoint = (checkpointId, status) => setPlan(setCheckpointStatus(checkpointId, status));
  const progress = getPlanProgress(plan);

  return (
    <main className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="text-center mb-8"><p className="text-indigo-600 font-semibold">Your learning workspace</p><h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Build a roadmap you can continue</h1><p className="mt-2 text-gray-600 dark:text-gray-300">Each checkpoint automatically becomes a study task and a quiz topic.</p></div>
      <section className="glass-card p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Learning scope<select value={scope} onChange={(event) => setScope(event.target.value)} className="mt-1 w-full border p-3 rounded-lg bg-white/70 dark:bg-gray-700 dark:border-gray-600"><option>Topic</option><option>Full stack</option></select></label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Current level<select value={skillLevel} onChange={(event) => setSkillLevel(event.target.value)} className="mt-1 w-full border p-3 rounded-lg bg-white/70 dark:bg-gray-700 dark:border-gray-600"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        </div>
        <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={scope === "Full stack" ? "e.g., Web development" : "e.g., Dynamic Programming"} className="mt-4 w-full border p-3 rounded-lg bg-white/70 dark:bg-gray-700 dark:border-gray-600" />
        <input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Your outcome, e.g. crack coding interviews" className="mt-4 w-full border p-3 rounded-lg bg-white/70 dark:bg-gray-700 dark:border-gray-600" />
        <button onClick={generateRoadmap} disabled={loading} className="mt-4 w-full py-3 rounded-lg bg-indigo-600 text-white font-bold disabled:bg-indigo-400">{loading ? "Building your roadmap..." : plan ? "Replace with a new roadmap" : "Generate my roadmap"}</button>
        {error && <p className="mt-3 text-red-600" role="alert">{error}</p>}
      </section>

      {plan && <section>
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-5"><div><h2 className="text-2xl font-bold dark:text-white">{plan.subject} roadmap</h2><p className="text-gray-600 dark:text-gray-300">{plan.overview}</p></div><button onClick={() => navigate("/quizzes")} className="inline-flex gap-2 items-center rounded-lg bg-indigo-100 text-indigo-700 px-4 py-2 font-semibold"><PlayCircle size={18} /> Quiz next checkpoint</button></div>
        <div className="h-2.5 rounded-full bg-indigo-100 dark:bg-gray-700 mb-2"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress.percentage}%` }} /></div><p className="text-sm text-gray-500 mb-5">{progress.completed} of {progress.total} checkpoints completed</p>
        <div className="space-y-4">{plan.checkpoints.map((checkpoint, index) => <article key={checkpoint.id} className="glass-card p-5">
          <div className="flex flex-col sm:flex-row justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-indigo-600">Checkpoint {index + 1} · {checkpoint.status}</p><h3 className="text-xl font-bold dark:text-white mt-1">{checkpoint.title}</h3><p className="mt-2 text-gray-600 dark:text-gray-300">{checkpoint.description}</p><p className="mt-3 flex items-center gap-1 text-sm text-gray-500"><Clock size={15} /> {checkpoint.estimatedTime}</p></div><div className="flex gap-2 items-start"><button onClick={() => updateCheckpoint(checkpoint.id, "In Progress")} className="p-2 rounded-lg bg-amber-100 text-amber-700" title="Start checkpoint"><PlayCircle size={19} /></button><button onClick={() => updateCheckpoint(checkpoint.id, "Completed")} className="p-2 rounded-lg bg-green-100 text-green-700" title="Complete checkpoint"><CheckCircle2 size={19} /></button></div></div>
          {checkpoint.resources.length > 0 && <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"><p className="flex gap-1 items-center font-semibold text-sm dark:text-white"><BookOpen size={16} /> Choose a resource</p><div className="mt-3 flex flex-wrap gap-2">{checkpoint.resources.map((resource) => <ResourceLink key={resource} resource={resource} />)}</div></div>}
        </article>)}</div>
      </section>}
      {!plan && !loading && <div className="text-center text-gray-500 py-8"><Plus className="inline mr-2" />Pick a topic of the day or a whole stack to get started.</div>}
    </main>
  );
}

function ResourceLink({ resource }) {
  const { Icon, label, className } = getResourceDetails(resource);
  return <a href={resource} target="_blank" rel="noreferrer" title={`Open ${label}`} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${className}`}><Icon size={18} /><span>{label}</span><ExternalLink size={14} /></a>;
}

function getResourceDetails(resource) {
  let host = "";
  try { host = new URL(resource).hostname.toLowerCase(); } catch { host = String(resource).toLowerCase(); }
  if (host.includes("youtube.com") || host.includes("youtu.be")) return { Icon: Youtube, label: "YouTube", className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" };
  if (host.includes("github.com")) return { Icon: Github, label: "GitHub", className: "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" };
  if (host.includes("docs.") || host.includes("developer.") || host.includes("mdn") || host.includes("freecodecamp")) return { Icon: FileText, label: "Documentation", className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300" };
  if (host.includes("book") || host.includes("openlibrary") || host.endsWith(".pdf") || host.includes(".pdf")) return { Icon: BookOpen, label: "Book or PDF", className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" };
  return { Icon: Globe2, label: "Website", className: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300" };
}
