import { Link, useNavigate } from "react-router-dom";
import DarkModeToggle from "./components/ui/DarkModeToggle.jsx";
import { motion } from "framer-motion";
import { AppleParallaxHero } from "./components/ui/AppleParallaxHero.jsx";
import { ParallaxFeatureShowcase } from "./components/ui/ParallaxFeatureShowcase.jsx";
import {
  Brain,
  BookOpen,
  Trophy,
  Target,
  Clock,
  BarChart3,
  Gauge,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getLearningPlan, getPlanProgress } from "./lib/studentWorkspace";

export default function Index() {
  const navigate = useNavigate();

  // Enable smooth scrolling for anchor links
  useEffect(() => {
    const handleSmoothScroll = (e) => {
      if (
        e.target.tagName === "A" &&
        e.target.getAttribute("href")?.startsWith("#")
      ) {
        e.preventDefault();
        const targetId = e.target.getAttribute("href").substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    document.addEventListener("click", handleSmoothScroll);
    return () => document.removeEventListener("click", handleSmoothScroll);
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);
  const [plan, setPlan] = useState(getLearningPlan);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const refreshPlan = () => setPlan(getLearningPlan());
    window.addEventListener("focus", refreshPlan);
    return () => window.removeEventListener("focus", refreshPlan);
  }, []);

  const planProgress = getPlanProgress(plan);

  return (
    <div className="font-sans text-gray-900 dark:text-white min-h-screen">
      {/* Navigation */}
      <nav
        id="navigation"
        className={`sticky top-0 z-40 w-full flex justify-between items-center py-4 px-8 transition-all duration-300 ease-in-out ${
          isScrolled ? 'bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl shadow-lg border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          PrepMate
        </h1>
        <div className="space-x-6">
          <a
            href="#features"
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Features
          </a>
          <Link
            to="#"
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Pricing
          </Link>
          <Link
            to="/about"
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            About
          </Link>
        </div>
        {/* Right section: Dark mode + Auth buttons */}
        <div className="flex items-center space-x-4">
          <DarkModeToggle />
          <Link
            to="#"
            className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Sign In
          </Link>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Get Started
          </button>
        </div>
      </nav>

      {/* Apple-Style Parallax Hero Section */}
      <AppleParallaxHero />

      <section className="max-w-5xl mx-auto px-6 pb-16">
        {plan ? <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"><div><p className="text-sm font-semibold text-indigo-600">Continue your active roadmap</p><h3 className="text-2xl font-bold dark:text-white">{plan.subject}</h3><p className="mt-1 text-gray-600 dark:text-gray-300">{planProgress.nextCheckpoint ? `Next checkpoint: ${planProgress.nextCheckpoint.title}` : "You completed every checkpoint—amazing work!"}</p></div><div className="flex gap-3"><button onClick={() => navigate("/time-management")} className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold">Today&apos;s tasks</button><button onClick={() => navigate("/progress")} className="rounded-lg border border-indigo-300 px-4 py-2 text-indigo-700 dark:text-indigo-200 font-semibold">{planProgress.percentage}% progress</button></div></div> : <div className="glass-card p-6 text-center"><h3 className="text-2xl font-bold dark:text-white">What do you want to learn today?</h3><p className="mt-2 text-gray-600 dark:text-gray-300">Start small with one topic, or plan an entire learning stack. You can return and continue anytime.</p><button onClick={() => navigate("/personalized-learning")} className="mt-4 rounded-lg bg-indigo-600 px-5 py-3 text-white font-semibold">Create my first roadmap</button></div>}
      </section>

      {/* Apple-Style Parallax Feature Showcase Section */}
      <ParallaxFeatureShowcase />

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900" id="features">
        <h3 className="text-4xl font-bold text-center mb-16">
          Everything You Need to Succeed
        </h3>
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto px-6"
        >
          {/* Quizzes */}
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link
              to="/quizzes"
              className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50"
            >
              <Brain className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">AI-Powered Quizzes</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Adaptive quizzes that adjust difficulty based on your performance
                and learning pace.
              </p>
            </Link>
          </motion.div>

          {/* Progress Analytics */}
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link to="/progress" className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50">
              <BarChart3 className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Progress Analytics</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Live neural learning estimates, accuracy, and adaptive difficulty.
              </p>
            </Link>
          </motion.div>

          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link to="/question-predictor" className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50">
              <Sparkles className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Question Predictor</h4>
              <p className="text-gray-600 dark:text-gray-300">Find repeated themes, merge equivalent questions, and prioritise high-value revision.</p>
            </Link>
          </motion.div>

          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link to="/readiness-lab" className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50">
              <Gauge className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Readiness Lab</h4>
              <p className="text-gray-600 dark:text-gray-300">Diagnose your level, build a mastery plan, simulate exam pressure, and prove portfolio evidence.</p>
            </Link>
          </motion.div>

          {/* Curated Content */}
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link
              to="/content"
              className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50"
            >
              <BookOpen className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Curated Content</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Expert-selected study materials covering all major placement
                topics with regular updates.
              </p>
            </Link>
          </motion.div>

          {/* Personalized Learning */}
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link
              to="/personalized-learning"
              className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50"
            >
              <Target className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                Personalized Learning
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Get a customized AI-generated roadmap tailored to your skill level
                and career goals.
              </p>
            </Link>
          </motion.div>

          {/* Time Management */}
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link
              to="/time-management"
              className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50"
            >
              <Clock className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Time Management</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Smart scheduling and tracking tools to help you optimize your
                preparation timeline.
              </p>
            </Link>
          </motion.div>

          {/* Achievement System */}
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Link
              to="/achievements"
              className="glass-card p-8 block h-full hover:shadow-xl hover:border-indigo-400/50"
            >
              <Trophy className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-4" />
              <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Achievement System</h4>
              <p className="text-gray-600 dark:text-gray-300">
                View your badges, track streaks, and unlock new milestones as you
                progress.
              </p>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
          <div>
            <h4 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              10K+
            </h4>
            <p className="text-gray-600 dark:text-gray-300">Students Placed</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              500+
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Partner Companies
            </p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              95%
            </h4>
            <p className="text-gray-600 dark:text-gray-300">Success Rate</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              50K+
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Practice Questions
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center bg-indigo-600 dark:bg-indigo-700 text-white">
        <h3 className="text-3xl font-bold mb-4">
          Ready to Start Your Journey?
        </h3>
        <p className="max-w-2xl mx-auto mb-8">
          Join thousands of successful candidates who have landed their dream
          jobs with PrepMate.
        </p>
        <button
          onClick={() => navigate("/content")}
          className="bg-white text-indigo-600 dark:bg-gray-100 dark:text-indigo-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-200"
        >
          Begin Your Preparation
        </button>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-300 dark:bg-black">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
          <div>
            <h4 className="text-white text-xl font-bold mb-4">PrepMate</h4>
            <p>
              AI-powered placement preparation platform for ambitious students.
            </p>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-4">Platform</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/personalized-learning">Personalized Roadmap</Link>
              </li>
              <li>
                <a href="#navigation">Dashboard</a>
              </li>
              <li>
                <Link to="/quizzes">Quizzes</Link>
              </li>
              <li>
                <Link to="/content">Study Material</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-4">Company</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="#">Contact</Link>
              </li>
              <li>
                <Link to="#">Blog</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-4">Support</h5>
            <ul className="space-y-2">
              <li>
                <Link to="#">Help Center</Link>
              </li>
              <li>
                <Link to="#">Privacy Policy</Link>
              </li>
              <li>
                <Link to="#">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-center text-gray-500 mt-8">
          © 2024 PrepMate. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
