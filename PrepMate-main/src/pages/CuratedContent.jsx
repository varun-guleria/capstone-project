import { createElement, useState } from "react";
import { BookOpen, Github, Globe2, Search, Youtube } from "lucide-react";
import { getLearningPlan } from "../lib/studentWorkspace";
import api from "../lib/api";

const groups = [
  { key: "youtube", title: "Video learning", icon: Youtube },
  { key: "github", title: "GitHub projects", icon: Github },
  { key: "books", title: "Books", icon: BookOpen },
  { key: "web", title: "Web content", icon: Globe2 },
];

export default function CuratedContent() {
  const plan = getLearningPlan();
  const suggestedTopic = plan?.checkpoints.find((checkpoint) => checkpoint.status !== "Completed")?.title || plan?.subject || "";
  const [topic, setTopic] = useState(suggestedTopic);
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await api.get("/curated-content", { params: { topic: topic.trim() } });
      setResources(response.data.results);
    } catch (requestError) {
      console.error(requestError);
      setError("Could not reach the resource service. Start the API server and try again.");
    } finally { setLoading(false); }
  };

  return <main className="max-w-6xl mx-auto p-4 sm:p-8 min-h-screen">
    <div className="text-center mb-8"><p className="font-semibold text-indigo-600">Relevant resources, not a static list</p><h1 className="text-4xl font-bold text-gray-900 dark:text-white">Curated content explorer</h1><p className="mt-2 text-gray-600 dark:text-gray-300">Search a roadmap topic to find current projects, books, articles, and video results.</p></div>
    <section className="glass-card p-5 flex flex-col sm:flex-row gap-3"><input value={topic} onChange={(event) => setTopic(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} placeholder="Search any subject or roadmap checkpoint" className="flex-1 border rounded-lg p-3 bg-white/70 dark:bg-gray-700 dark:border-gray-600" /><button onClick={search} disabled={loading || !topic.trim()} className="rounded-lg bg-indigo-600 text-white px-5 py-3 font-semibold disabled:bg-indigo-400 flex justify-center items-center gap-2"><Search size={18} />{loading ? "Searching..." : "Find resources"}</button></section>
    {plan && <p className="mt-3 text-sm text-gray-500">Suggested from your roadmap: <button className="text-indigo-600 font-semibold" onClick={() => setTopic(suggestedTopic)}>{suggestedTopic}</button></p>}
    {error && <p className="text-red-600 mt-4" role="alert">{error}</p>}
    {resources && <section className="mt-8 grid md:grid-cols-2 gap-5">{groups.map(({ key, title, icon }) => <div key={key} className="glass-card p-5"><div className="flex gap-2 items-center text-indigo-600">{createElement(icon, { size: 20 })}<h2 className="font-bold text-lg">{title}</h2></div><div className="mt-4 space-y-3">{resources[key]?.length ? resources[key].map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="block rounded-lg bg-white/70 dark:bg-gray-700 p-4 hover:ring-2 hover:ring-indigo-400"><p className="font-semibold text-gray-900 dark:text-white">{resource.title}</p><p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{resource.description}</p><p className="mt-2 text-xs font-semibold text-indigo-600">Open {resource.source} →</p></a>) : <p className="text-sm text-gray-500">No results available right now.</p>}</div></div>)}</section>}
    {!resources && !loading && <div className="mt-14 text-center text-gray-500"><Globe2 className="mx-auto text-indigo-400" size={32} /><p className="mt-3">Choose a topic to search live public sources.</p></div>}
  </main>;
}
