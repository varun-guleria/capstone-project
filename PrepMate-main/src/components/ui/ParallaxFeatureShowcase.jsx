import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sparkles, Cpu, Layers, Activity, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ParallaxFeatureShowcase() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  // Parallax transforms
  const imageScale = useTransform(smoothProgress, [0.1, 0.5, 0.9], [0.88, 1.05, 0.95]);
  const imageRotate = useTransform(smoothProgress, [0.1, 0.5, 0.9], [-4, 0, 4]);
  const imageY = useTransform(smoothProgress, [0, 1], [60, -60]);
  const textY = useTransform(smoothProgress, [0, 1], [80, -40]);
  const bgGlowScale = useTransform(smoothProgress, [0.2, 0.6], [0.6, 1.2]);

  const features = [
    {
      icon: Cpu,
      title: "Neural Skill Predictor",
      description: "Identifies exam question trends and synthesizes high-frequency practice modules.",
      link: "/question-predictor",
    },
    {
      icon: Activity,
      title: "Real-Time Readiness Lab",
      description: "Simulate actual interview stress and measure timed problem-solving mastery.",
      link: "/readiness-lab",
    },
    {
      icon: Layers,
      title: "Adaptive Curated Stack",
      description: "Customized learning pathways dynamically adjusting to your weakness areas.",
      link: "/personalized-learning",
    },
  ];

  return (
    <section
      ref={containerRef}
      className="relative py-32 overflow-hidden bg-slate-950 text-white my-16 rounded-3xl mx-4 md:mx-8 shadow-2xl border border-indigo-900/30"
    >
      {/* Background Parallax Glow Elements */}
      <motion.div
        style={{ scale: bgGlowScale }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none -z-10"
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Interactive Parallax Text & Cards */}
        <motion.div style={{ y: textY }} className="lg:col-span-5 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Product Showcase</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Engineered for <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Peak Interview Performance
            </span>
          </h2>

          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            Experience next-generation exam prep driven by contextual AI. PrepMate analyzes your speed, accuracy, and logic structure in real time.
          </p>

          <div className="space-y-4 pt-2">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(feat.link)}
                  className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 transition-all duration-300 cursor-pointer flex items-start gap-4 backdrop-blur-md"
                >
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                      {feat.title}
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-gray-400 text-sm mt-0.5">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: 3D Parallax Image Card Stage */}
        <div className="lg:col-span-7 relative">
          <motion.div
            style={{
              scale: imageScale,
              rotateZ: imageRotate,
              y: imageY,
            }}
            className="relative rounded-2xl overflow-hidden p-2 bg-gradient-to-b from-indigo-500/30 via-purple-500/20 to-transparent border border-white/20 shadow-[0_20px_50px_rgba(79,70,229,0.35)] backdrop-blur-xl group"
          >
            <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[16/10]">
              <img
                src="/prepmate_feature_parallax.jpg"
                alt="PrepMate Holographic AI Feature Analytics"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating Holographic Stats Pill */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-slate-900/85 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-xs text-gray-400 font-mono">LIVE EVALUATION</p>
                    <p className="text-sm font-bold text-white">Algorithm Mastery: 94%</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/quizzes")}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  Try Adaptive Quiz
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
