import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Play, Volume2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";

export const Route = createFileRoute("/classroom")({
  head: () => ({
    meta: [{ title: "AI Avatar Classroom — Vidya AI" }],
  }),
  component: Classroom,
});

const LANGS = ["English", "Hindi", "Telugu", "Tamil", "Kannada"];
const SUBJECTS = ["Mathematics", "Science", "Programming", "English"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const LESSON = {
  title: "Photosynthesis — How plants make food",
  transcript: [
    "Namaste! Today, let's understand photosynthesis with a simple story.",
    "Imagine every leaf as a tiny solar kitchen ☀️🍃 that cooks food using sunlight.",
    "Plants take in sunlight, water from the roots, and carbon dioxide from the air.",
    "Inside the leaf, chlorophyll (the green colour) absorbs the sunlight.",
    "The plant uses this energy to make glucose — its food — and releases oxygen for us!",
  ],
  quiz: {
    q: "Which part of the leaf absorbs sunlight?",
    options: ["Roots", "Chlorophyll", "Stem", "Petals"],
    correct: 1,
  },
};

function Classroom() {
  const [lang, setLang] = useState("English");
  const [subject, setSubject] = useState("Science");
  const [level, setLevel] = useState("Beginner");
  const [line, setLine] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);

  return (
    <AppShell>
      <SectionHeader
        eyebrow="AI Avatar Teacher"
        title="Step into your *interactive AI classroom*."
        description="A talking, multilingual AI teacher who explains, asks and cheers you on."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Avatar stage */}
        <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,79,217,0.25),transparent_60%)]" />
          <div className="relative flex flex-col items-center py-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative"
            >
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-[#FF4FD9] via-[#A855F7] to-[#6366F1] flex items-center justify-center animate-pulse-glow">
                <div className="h-32 w-32 rounded-full bg-[#120F33] flex items-center justify-center">
                  <GraduationCap className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full glass px-3 py-1 text-xs text-white">
                Vidya · Speaking {lang}
              </div>
            </motion.div>

            <div className="mt-8 text-center">
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Now Teaching</div>
              <div className="mt-1 text-xl font-bold text-white">{LESSON.title}</div>
            </div>

            <motion.div
              key={line}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl px-6 py-4 max-w-xl text-white/90 text-center"
            >
              {LESSON.transcript[line]}
            </motion.div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setLine((l) => Math.max(0, l - 1))}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setLine((l) => Math.min(LESSON.transcript.length - 1, l + 1))
                }
                className="btn-neon btn-neon-hover inline-flex items-center gap-2"
              >
                <Play className="h-4 w-4" /> Next
              </button>
              <button className="rounded-full border border-white/15 bg-white/5 p-2 text-white">
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Understanding check */}
          {line === LESSON.transcript.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-6 glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
                <Sparkles className="h-3 w-3" /> Let's check your understanding
              </div>
              <div className="mt-2 text-white font-semibold">{LESSON.quiz.q}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {LESSON.quiz.options.map((opt, i) => {
                  const isCorrect = i === LESSON.quiz.correct;
                  const picked = answered === i;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswered(i)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2 text-left text-sm transition ${
                        answered === null
                          ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                          : isCorrect
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                          : picked
                          ? "border-red-400/40 bg-red-400/10 text-red-200"
                          : "border-white/10 bg-white/5 text-white/50"
                      }`}
                    >
                      {opt}
                      {answered !== null && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      {answered !== null && picked && !isCorrect && <XCircle className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
              {answered !== null && (
                <div className="mt-3 text-sm text-white/80">
                  {answered === LESSON.quiz.correct
                    ? "🎉 Correct! Chlorophyll captures sunlight for the plant."
                    : "No worries — let me explain again. Chlorophyll is the green pigment that absorbs sunlight."}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <aside className="space-y-4">
          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Language</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    lang === l
                      ? "bg-gradient-to-r from-[#FF4FD9] to-[#6366F1] text-white"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Subject</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    subject === s ? "bg-white/15 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Level</div>
            <div className="mt-2 flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm ${
                    level === l ? "bg-white/15 text-white" : "bg-white/5 text-white/70"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </GlassCard>
        </aside>
      </div>
    </AppShell>
  );
}
