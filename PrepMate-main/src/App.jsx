import { BrowserRouter, Link, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import Index from "./index.jsx";
import Quizzes from "./pages/Quizzes";
import CuratedContent from "./pages/CuratedContent";
import PersonalizedLearning from "./pages/PersonalizedLearning";
import TimeManagement from  "./pages/TimeManagement.jsx";
import Achievements from "./pages/AchievementSystem";
import About from "./pages/About";
import { AnimatedBackground } from "./components/ui/AnimatedBackground";
import ProgressAnalytics from "./pages/ProgressAnalytics";
import QuestionPredictor from "./pages/QuestionPredictor";
import ReadinessLab from "./pages/ReadinessLab";



function App() {
  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10">
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <HomeLink />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/progress" element={<ProgressAnalytics />} />
            <Route path="/question-predictor" element={<QuestionPredictor />} />
            <Route path="/readiness-lab" element={<ReadinessLab />} />
            <Route path="/content" element={<CuratedContent />} />
            <Route
              path="/personalized-learning"
              element={<PersonalizedLearning />}
            />
            <Route path="/time-management" element={<TimeManagement />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/about" element={<About />} />
            <Route path="/PrepMate/*" element={<LegacyPrepMateRedirect />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}

function LegacyPrepMateRedirect() {
  const location = useLocation();
  const destination = location.pathname.replace(/^\/PrepMate/, "") || "/";
  return <Navigate to={`${destination}${location.search}${location.hash}`} replace />;
}

function HomeLink() {
  const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <Link
      to="/"
      aria-label="Return to PrepMate home"
      className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/75 dark:bg-gray-900/75 px-3 py-2 text-indigo-700 dark:text-indigo-300 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-700 text-white shadow-sm">
        <GraduationCap size={19} />
      </span>
      <span className="font-bold tracking-tight">PrepMate</span>
    </Link>
  );
}

export default App;
