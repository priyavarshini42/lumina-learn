import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { useState } from "react";
import { BookOpen, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [{ title: "Weekend AI Exams — Vidya AI" }] }),
  component: Exams,
});

const QUESTIONS = [
  {
    q: "The value of x in 3x - 12 = 0 is?",
    options: ["2", "3", "4", "6"],
    correct: 2,
    topic: "Linear equations",
  },
  {
    q: "Photosynthesis mainly happens in?",
    options: ["Roots", "Stems", "Leaves", "Flowers"],
    correct: 2,
    topic: "Biology",
  },
  {
    q: "Which one is a prime number?",
    options: ["9", "15", "17", "21"],
    correct: 2,
    topic: "Number theory",
  },
  {
    q: "Past tense of 'run' is?",
    options: ["runned", "ran", "running", "runs"],
    correct: 1,
    topic: "English grammar",
  },
];

function Exams() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = QUESTIONS.reduce(
    (s, q, i) => (answers[i] === q.correct ? s + 1 : s),
    0,
  );
  const percent = Math.round((score / QUESTIONS.length) * 100);

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Weekend AI Exam"
        title="Test yourself. *Grow every week*."
        description="AI generates fresh tests every weekend, tailored to what you learnt."
      />

      {!submitted ? (
        <div className="glass-strong rounded-3xl p-6 space-y-5">
          {QUESTIONS.map((q, i) => (
            <div key={i}>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">
                Q{i + 1} · {q.topic}
              </div>
              <div className="mt-1 text-white font-medium">{q.q}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const picked = answers[i] === oi;
                  return (
                    <button
                      key={o}
                      onClick={() => setAnswers({ ...answers, [i]: oi })}
                      className={`rounded-xl px-4 py-2 text-left text-sm ${
                        picked
                          ? "bg-gradient-to-r from-[#FF4FD9] to-[#6366F1] text-white"
                          : "bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length < QUESTIONS.length}
            className="btn-neon btn-neon-hover disabled:opacity-50 inline-flex items-center gap-2"
          >
            Submit Exam <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <GlassCard hover={false}>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-[#120F33] flex items-center justify-center">
                    <div className="text-2xl font-bold text-white">{percent}%</div>
                  </div>
                </div>
                <div>
                  <div className="text-white font-bold text-xl">
                    You scored {score} / {QUESTIONS.length}
                  </div>
                  <div className="text-white/60 text-sm">
                    {percent >= 75
                      ? "Excellent work! Keep the streak going 🔥"
                      : percent >= 50
                      ? "Good effort — a few weak spots to polish."
                      : "Let's revise together. Vidya has a plan for you."}
                  </div>
                </div>
              </div>
            </GlassCard>

            {QUESTIONS.map((q, i) => {
              const correct = answers[i] === q.correct;
              return (
                <GlassCard key={i} hover={false}>
                  <div className="flex items-start gap-3">
                    {correct ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div className="flex-1">
                      <div className="text-white font-medium">{q.q}</div>
                      <div className="text-sm mt-1 text-white/70">
                        Correct answer:{" "}
                        <span className="text-emerald-300">{q.options[q.correct]}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <aside className="space-y-4">
            <GlassCard hover={false}>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9] flex items-center gap-2">
                <Sparkles className="h-3 w-3" /> AI Analysis
              </div>
              <div className="mt-2 text-white font-semibold">Focus areas next week</div>
              <ul className="mt-2 space-y-2 text-sm text-white/80">
                {QUESTIONS.filter((_, i) => answers[i] !== QUESTIONS[i].correct).map((q, i) => (
                  <li key={i} className="glass rounded-xl p-2">
                    Revise · {q.topic}
                  </li>
                ))}
                {Object.entries(answers).every(([i, v]) => QUESTIONS[+i].correct === v) && (
                  <li className="glass rounded-xl p-2">Perfect run! Try Advanced level.</li>
                )}
              </ul>
            </GlassCard>
            <GlassCard hover={false}>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9] flex items-center gap-2">
                <BookOpen className="h-3 w-3" /> Next Mock
              </div>
              <div className="mt-2 text-white text-sm">Class 9 · Full Syllabus · Saturday 10 AM</div>
              <button className="btn-neon btn-neon-hover mt-3 text-sm">Schedule</button>
            </GlassCard>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
