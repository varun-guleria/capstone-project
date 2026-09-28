import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ChartNoAxesCombined, Flame, RotateCcw, Sparkles, Target } from "lucide-react";
import {
  getLearningSnapshot,
  recordQuizAttempt,
  resetLearningProgress,
} from "../lib/adaptiveLearning";
import { getLearningPlan, setCheckpointStatus } from "../lib/studentWorkspace";
import api from "../lib/api";

const emptySnapshot = {
  attempts: 0,
  accuracy: 0,
  proficiency: 0,
  isAssessed: false,
  recommendedDifficulty: "Beginner",
  currentStreak: 0,
  bestStreak: 0,
};

const difficultyStyles = {
  Beginner: "bg-emerald-100 text-emerald-800",
  Intermediate: "bg-amber-100 text-amber-800",
  Advanced: "bg-violet-100 text-violet-800",
};

export default function Quizzes() {
  const [plan, setPlan] = useState(getLearningPlan);
  const [topic, setTopic] = useState(() => plan?.checkpoints.find((checkpoint) => checkpoint.status !== "Completed")?.title || "");
  const [quiz, setQuiz] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [quizDifficulty, setQuizDifficulty] = useState("Beginner");
  const [quizStartedAt, setQuizStartedAt] = useState(null);

  useEffect(() => {
    setSnapshot(topic.trim() ? getLearningSnapshot(topic) : emptySnapshot);
  }, [topic]);

  const generateQuiz = async () => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setError("Enter a topic to start an adaptive quiz.");
      return;
    }

    const currentSnapshot = getLearningSnapshot(cleanTopic);
    const recommendedDifficulty = currentSnapshot.recommendedDifficulty;
    setLoading(true);
    setError("");
    setFeedback("");
    setSubmitted(false);
    setSelectedAnswers({});
    const roadmapCheckpoint = plan?.checkpoints.find((checkpoint) => checkpoint.title === cleanTopic);
    if (roadmapCheckpoint?.status === "Not Started") setPlan(setCheckpointStatus(roadmapCheckpoint.id, "In Progress"));
    try {
      const response = await api.post("/generate-quiz", {
        topic: cleanTopic,
        difficulty: recommendedDifficulty,
        proficiency: currentSnapshot.proficiency,
      });
      const quizData = Array.isArray(response.data.quiz) ? response.data.quiz : [];
      setQuiz(quizData);
      setQuizDifficulty(recommendedDifficulty);
      setQuizStartedAt(Date.now());
      setSnapshot(currentSnapshot);
      if (!quizData.length) setError("No quiz could be generated. Try again.");
    } catch (requestError) {
      console.error(requestError);
      setError("The quiz service is unavailable. Start the server and try again.");
      setQuiz([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (index, option) => {
    if (!submitted) setSelectedAnswers((previous) => ({ ...previous, [index]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz.length) return;
    setSubmitted(true);
    let correct = 0;
    const incorrectQuestions = [];
    quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct += 1;
      } else {
        incorrectQuestions.push({
          question: question.question,
          yourAnswer: selectedAnswers[index] || "Not Answered",
          correctAnswer: question.correct_answer,
        });
      }
    });
    setScore(correct);

    const durationSeconds = Math.max(1, Math.round((Date.now() - (quizStartedAt || Date.now())) / 1000));
    const updatedSnapshot = recordQuizAttempt({
      topic,
      correctAnswers: correct,
      totalQuestions: quiz.length,
      difficulty: quizDifficulty,
      durationSeconds,
    });
    setSnapshot(updatedSnapshot);

    if (incorrectQuestions.length) {
      try {
        const response = await api.post("/personalized-feedback", {
          topic,
          incorrectQuestions,
        });
        setFeedback(response.data.advice);
      } catch (requestError) {
        console.error(requestError);
        setFeedback("Review the missed questions, then continue with the recommended level.");
      }
    } else {
      setFeedback("Excellent work! Your learning model has raised the challenge for your next quiz.");
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setSelectedAnswers({});
    setScore(0);
    setFeedback("");
    setQuizStartedAt(Date.now());
  };

  const handleResetProgress = () => {
    if (!topic.trim()) return;
    setSnapshot(resetLearningProgress(topic));
    setQuizDifficulty("Beginner");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-center text-gray-800 dark:text-white">Adaptive AI Quizzes</h1>
      <p className="text-center text-gray-500 dark:text-gray-300 mb-8">Your results train a private learning model that selects your next quiz level.</p>

      <section className="flex flex-col sm:flex-row gap-2 mb-6 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg">
        <input
          type="text"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && generateQuiz()}
          placeholder="Enter a topic (e.g., Data Structures)"
          className="border p-3 rounded-lg w-full bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition"
        />
        <motion.button onClick={generateQuiz} disabled={loading} className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-lg disabled:bg-indigo-400 whitespace-nowrap" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          {loading ? "Generating..." : "Start adaptive quiz"}
        </motion.button>
      </section>

      {plan && (
        <section className="mb-6 glass-card p-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Quiz from your roadmap
            <select value={plan.checkpoints.some((checkpoint) => checkpoint.title === topic) ? topic : ""} onChange={(event) => setTopic(event.target.value)} className="mt-2 w-full rounded-lg border p-3 bg-white/70 dark:bg-gray-700 dark:border-gray-600">
              <option value="">Choose a roadmap checkpoint</option>
              {plan.checkpoints.map((checkpoint, index) => <option key={checkpoint.id} value={checkpoint.title}>{index + 1}. {checkpoint.title} — {checkpoint.status}</option>)}
            </select>
          </label>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">Starting a roadmap quiz marks that checkpoint as in progress. Complete it from the roadmap or task list when you are ready.</p>
        </section>
      )}

      {topic.trim() && (
        <motion.section layout className="mb-8 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/70 dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div className="flex gap-3">
              <span className="rounded-lg bg-indigo-600 p-2 text-white"><BrainCircuit size={22} /></span>
              <div>
                <h2 className="font-bold text-gray-800 dark:text-white">Live learning model</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Tracking <span className="font-semibold">{topic.trim()}</span> on this device</p>
              </div>
            </div>
            <button onClick={handleResetProgress} className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 flex items-center gap-1"><RotateCcw size={15} /> Reset topic data</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric icon={<ChartNoAxesCombined size={18} />} label="Proficiency" value={snapshot.isAssessed ? `${snapshot.proficiency}%` : "Not assessed"} />
            <Metric icon={<Target size={18} />} label="Accuracy" value={snapshot.attempts ? `${snapshot.accuracy}%` : "—"} />
            <Metric icon={<Flame size={18} />} label="Quiz streak" value={`${snapshot.currentStreak}`} />
            <div className="rounded-lg bg-white dark:bg-gray-700 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">Next level</p>
              <span className={`inline-block mt-2 rounded-full px-2.5 py-1 text-sm font-semibold ${difficultyStyles[snapshot.recommendedDifficulty]}`}>{snapshot.recommendedDifficulty}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2.5 rounded-full bg-indigo-100 dark:bg-gray-700 overflow-hidden"><motion.div className="h-full rounded-full bg-indigo-600" animate={{ width: `${snapshot.proficiency || 0}%` }} /></div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">{snapshot.attempts ? `${snapshot.attempts} completed quizzes • best streak ${snapshot.bestStreak}` : "Complete your first quiz to personalize this model."}</p>
          </div>
        </motion.section>
      )}

      {error && <p className="text-red-600 text-center mb-4" role="alert">{error}</p>}

      {quiz.length > 0 && (
        <div className="mb-4 flex justify-center"><span className={`rounded-full px-3 py-1 text-sm font-semibold ${difficultyStyles[quizDifficulty]}`}>{quizDifficulty} quiz</span></div>
      )}
      <AnimatePresence>
        {quiz.length > 0 && (
          <motion.section variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="grid gap-5">
            {quiz.map((question, index) => {
              const isCorrect = submitted && selectedAnswers[index] === question.correct_answer;
              const isWrong = submitted && !isCorrect;
              return (
                <motion.article key={`${question.question}-${index}`} variants={itemVariants} className={`p-6 border rounded-xl shadow-md ${isCorrect ? "bg-green-50 border-green-400" : isWrong ? "bg-red-50 border-red-400" : "bg-white dark:bg-gray-800 dark:border-gray-700"}`}>
                  <p className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">{index + 1}. {question.question}</p>
                  <ul className="space-y-3">
                    {question.options?.map((option, optionIndex) => (
                      <li key={`${option}-${optionIndex}`}><motion.button onClick={() => handleSelect(index, option)} className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedAnswers[index] === option ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"}`} disabled={submitted} whileHover={{ scale: submitted ? 1 : 1.01 }}>{option}</motion.button></li>
                    ))}
                  </ul>
                  {submitted && isWrong && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm font-semibold text-green-700">Correct answer: {question.correct_answer}</motion.p>}
                </motion.article>
              );
            })}
            {!submitted && <motion.button onClick={handleSubmit} className="mt-3 bg-green-600 text-white font-bold px-8 py-3 rounded-lg block mx-auto shadow-md" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>Submit & update my model</motion.button>}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitted && (
          <motion.section initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-8 p-7 border rounded-xl bg-indigo-50 dark:bg-gray-800 dark:border-gray-700 shadow-xl text-center">
            <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">Your score: {score}/{quiz.length}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300 flex justify-center items-center gap-1"><Sparkles size={16} /> Next quiz: {snapshot.recommendedDifficulty}</p>
            {feedback && <div className="mt-5 text-left p-5 bg-white dark:bg-gray-700 rounded-lg shadow-inner"><h3 className="font-semibold text-lg text-gray-800 dark:text-white">Personalized feedback</h3><p className="text-gray-600 dark:text-gray-200 mt-2">{feedback}</p></div>}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <motion.button onClick={generateQuiz} className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-lg" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>Continue adaptive quiz</motion.button>
              <motion.button onClick={handleRetry} className="bg-yellow-500 text-white font-bold px-6 py-3 rounded-lg" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>Retry this quiz</motion.button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-700 p-3">
      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300">{icon}<p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">{label}</p></div>
      <p className="mt-2 text-xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}
