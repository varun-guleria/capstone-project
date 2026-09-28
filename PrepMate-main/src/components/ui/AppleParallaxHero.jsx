import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Sparkles, Brain, Target, Trophy, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AppleParallaxHero() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Scroll animations linked to container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Smooth scroll spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transforms for main 3D product showcase
  const rotateX = useTransform(smoothProgress, [0, 0.45], [22, 0]);
  const scale = useTransform(smoothProgress, [0, 0.45, 0.9], [0.86, 1.02, 0.96]);
  const opacity = useTransform(smoothProgress, [0, 0.1, 0.85, 1], [0.8, 1, 1, 0.3]);
  const glowOpacity = useTransform(smoothProgress, [0, 0.45], [0.3, 0.85]);

  // Differential parallax movements for floating layers
  const floatY1 = useTransform(smoothProgress, [0, 1], [40, -180]);
  const floatY2 = useTransform(smoothProgress, [0, 1], [-30, 150]);
  const floatY3 = useTransform(smoothProgress, [0, 1], [80, -120]);
  const floatY4 = useTransform(smoothProgress, [0, 1], [-50, 170]);

  // Mouse hover 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 25,
  });
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 25,
  });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = (e.clientX - rect.left) / width - 0.5;
    const y = (e.clientY - rect.top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-[160vh] w-full pt-12 pb-24 overflow-hidden"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-pink-500/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Header Content */}
      <div className="max-w-5xl mx-auto text-center px-6 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-6 backdrop-blur-md shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>PrepMate 2.0 • Next-Gen AI Placement Engine</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
        >
          Master Technical Exams &amp; <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Interviews with AI Precision
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
        >
          Adaptive roadmaps, intelligent question predictors, real-time readiness analytics, and simulated interview environments crafted for tech leaders.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate("/personalized-learning")}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-600/50"
          >
            <span>Start Personalized Preparation</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate("/readiness-lab")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-white font-bold text-base border border-gray-200 dark:border-gray-700/60 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span>Test Exam Readiness</span>
          </button>
        </motion.div>
      </div>

      {/* Sticky 3D Parallax Device Visual Stage */}
      <div className="sticky top-20 mt-16 max-w-6xl mx-auto px-4 md:px-8 perspective-1000">
        <motion.div
          style={{
            rotateX,
            scale,
            opacity,
            rotateY: tiltY,
            x: tiltX,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-2xl p-2 bg-gradient-to-b from-white/40 via-white/10 to-transparent dark:from-gray-700/40 dark:via-gray-800/20 backdrop-blur-2xl border border-white/50 dark:border-gray-700/60 shadow-[0_25px_60px_-15px_rgba(79,70,229,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-shadow duration-500"
        >
          {/* Glass Browser Frame Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900/90 dark:bg-gray-950/90 rounded-t-xl border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            </div>
            <div className="px-6 py-1 rounded-full bg-gray-800/80 text-gray-400 text-xs font-mono tracking-wide border border-gray-700/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              app.prepmate.ai/dashboard
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-indigo-400">AI Active</span>
            </div>
          </div>

          {/* High-Res Mockup Image Container */}
          <div className="relative overflow-hidden rounded-b-xl bg-gray-950 aspect-[16/9] shadow-inner group">
            <img
              src="/prepmate_hero_mockup.jpg"
              alt="PrepMate AI Dashboard Platform"
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-102"
            />

            {/* Apple-style subtle glare overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-60 pointer-events-none" />

            {/* Ambient dynamic glow overlay */}
            <motion.div
              style={{ opacity: glowOpacity }}
              className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-transparent to-transparent pointer-events-none"
            />
          </div>

          {/* Layer 1: Floating Parallax Glass Card - Left Top */}
          <motion.div
            style={{ y: floatY1 }}
            className="absolute -top-10 -left-6 md:-left-12 p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-white/60 dark:border-gray-700/80 shadow-2xl backdrop-blur-xl flex items-center gap-4 z-30 pointer-events-none max-w-[220px]"
          >
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Neural Engine</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">99.4% Topic Match</p>
            </div>
          </motion.div>

          {/* Layer 2: Floating Parallax Glass Card - Right Top */}
          <motion.div
            style={{ y: floatY2 }}
            className="absolute -top-6 -right-6 md:-right-10 p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-white/60 dark:border-gray-700/80 shadow-2xl backdrop-blur-xl flex items-center gap-4 z-30 pointer-events-none max-w-[230px]"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Success Rate</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">10,000+ Placed</p>
            </div>
          </motion.div>

          {/* Layer 3: Floating Parallax Glass Card - Left Bottom */}
          <motion.div
            style={{ y: floatY3 }}
            className="absolute -bottom-8 -left-4 md:-left-10 p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-white/60 dark:border-gray-700/80 shadow-2xl backdrop-blur-xl flex items-center gap-4 z-30 pointer-events-none max-w-[240px]"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Adaptive Roadmaps</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Personalized Pace</p>
            </div>
          </motion.div>

          {/* Layer 4: Floating Parallax Glass Card - Right Bottom */}
          <motion.div
            style={{ y: floatY4 }}
            className="absolute -bottom-10 -right-4 md:-right-10 p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-white/60 dark:border-gray-700/80 shadow-2xl backdrop-blur-xl flex items-center gap-4 z-30 pointer-events-none max-w-[220px]"
          >
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Question Predictor</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">High Probable Qs</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
