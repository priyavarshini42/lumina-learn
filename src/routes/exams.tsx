import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { useAuth, educationLabel } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateWeeklyExam, getExamState, submitExam } from "@/lib/exam.functions";
import type { ExamRecord, ExamResult } from "@/lib/exam-types";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Weekend AI Exams — Weekly Tests & Weak-Area Analytics | Vidya AI" },
      {
        name: "description",
        content:
          "Take an AI-generated weekend test built from the chapters you studied this week, then see topic-wise accuracy, weak areas and a revision plan.",
      },
      { property: "og:title", content: "Weekend AI Exams — Vidya AI" },
      {
        property: "og:description",
        content:
          "Fresh weekly tests from your own syllabus, auto-scored with topic-wise weak-area analytics and a revision plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Exams,
});

function Ring({ percent }: { percent: number }) {
  return (
    <div className="relative h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] p-[3px]">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#120F33]">
        <div className="text-2xl font-bold text-white">{percent}%</div>
      </div>
    </div>
  );
}

function accuracyColor(a: number) {
  if (a >= 75) return "#34D399";
  if (a >= 40) return "#FBBF24";
  return "#F87171";
}

function Exams() {
  const { user, profile, loading } = useAuth();
  const loadState = useServerFn(getExamState);
  const generate = useServerFn(generateWeeklyExam);
  const submit = useServerFn(submitExam);

  const [medium, setMedium] = useState("English");
  const [exam, setExam] = useState<ExamRecord | null>(null);
  const [history, setHistory] = useState<ExamRecord[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [stateLoading, setStateLoading] = useState(true);

  const grade = educationLabel(profile);

  const refresh = useCallback(async () => {
    const state = await loadState({});
    setExam(state.current);
    setHistory(state.history);
    setResult(state.current?.result ?? null);
    setAnswers(
      state.current?.answers
        ? Object.fromEntries(state.current.answers.map((a, i) => [i, a]))
        : {},
    );
  }, [loadState]);

  useEffect(() => {
    if (!user) {
      setStateLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      const { data: prefs } = await supabase
        .from("learning_preferences")
        .select("medium")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (prefs?.medium) setMedium(prefs.medium);
      try {
        await refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
      if (active) setStateLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, refresh]);

  const onGenerate = async (regenerate = false) => {
    if (!profile) return;
    setBusy(true);
    try {
      const paper = await generate({
        data: {
          studentName: profile.full_name,
          grade,
          language: profile.preferred_language,
          medium,
          regenerate,
        },
      });
      setExam(paper);
      setResult(paper.result);
      setAnswers({});
      toast.success("Your weekend test is ready.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!exam) return;
    setBusy(true);
    try {
      const r = await submit({
        data: {
          examId: exam.id,
          answers: exam.questions.map((_q, i) => answers[i] ?? -1),
        },
      });
      setResult(r);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const trend = useMemo(
    () =>
      [...history]
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((h) => ({ week: h.weekStart.slice(5), score: h.score ?? 0 })),
    [history],
  );

  if (loading || stateLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-white/60">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <SectionHeader
          eyebrow="Weekend AI Exam"
          title="Sign in to take your *weekly test*."
          description="Your exam is built from the chapters you studied this week, so you need an account."
        />
        <Link to="/auth" className="btn-neon btn-neon-hover inline-flex items-center gap-2">
          Sign in <ArrowRight className="h-4 w-4" />
        </Link>
      </AppShell>
    );
  }

  const answered = exam ? Object.keys(answers).length : 0;

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Weekend AI Exam"
        title="Test yourself. *Grow every week*."
        description="A fresh AI paper from this week's chapters, auto-scored with topic-wise weak-area analytics."
      />

      {!exam && (
        <GlassCard hover={false}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-white">This week&apos;s paper is not generated yet</div>
              <div className="mt-1 text-sm text-white/60">
                10 questions from the chapters you studied — {grade || "your class"}, in your language.
              </div>
            </div>
            <button
              onClick={() => void onGenerate(false)}
              disabled={busy}
              className="btn-neon btn-neon-hover inline-flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate my weekend test
            </button>
          </div>
        </GlassCard>
      )}

      {exam && !result && (
        <div className="glass-strong space-y-5 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">
                Week of {exam.weekStart}
              </div>
              <h2 className="font-poppins text-lg font-semibold text-white">{exam.title}</h2>
            </div>
            <div className="text-sm text-white/60">
              {answered}/{exam.questions.length} answered
            </div>
          </div>

          {exam.questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">
                Q{i + 1} · {q.topic} · {q.difficulty}
              </div>
              <div className="mt-1 font-medium text-white">{q.question}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const picked = answers[i] === oi;
                  return (
                    <button
                      key={`${o}-${oi}`}
                      onClick={() => setAnswers({ ...answers, [i]: oi })}
                      className={`rounded-xl px-4 py-2 text-left text-sm transition ${
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
            </motion.div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void onSubmit()}
              disabled={busy || answered < exam.questions.length}
              className="btn-neon btn-neon-hover inline-flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {busy ? "Evaluating…" : "Submit exam"}
            </button>
            <button
              onClick={() => void onGenerate(true)}
              disabled={busy}
              className="glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white/70 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> New paper
            </button>
          </div>
        </div>
      )}

      {exam && result && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <GlassCard hover={false}>
              <div className="flex flex-wrap items-center gap-4">
                <Ring percent={result.percent} />
                <div>
                  <div className="text-xl font-bold text-white">
                    You scored {result.score} / {result.total}
                  </div>
                  <div className="mt-1 max-w-lg text-sm text-white/70">{result.analysis.summary}</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard hover={false}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
                <Target className="h-3 w-3" /> Topic-wise accuracy
              </div>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.topics}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="topic"
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#1A1440",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: "#fff",
                      }}
                      formatter={(v: number) => [`${v}%`, "Accuracy"]}
                    />
                    <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                      {result.topics.map((t) => (
                        <Cell key={t.topic} fill={accuracyColor(t.accuracy)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {result.chapters.map((c) => (
                  <div key={c.topic} className="glass flex items-center justify-between rounded-xl p-3 text-sm">
                    <span className="text-white/80">{c.topic}</span>
                    <span style={{ color: accuracyColor(c.accuracy) }}>
                      {c.correct}/{c.total} · {c.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard hover={false}>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Question review</div>
              <div className="mt-3 space-y-3">
                {exam.questions.map((q, i) => {
                  const picked = answers[i];
                  const correct = picked === q.correctIndex;
                  return (
                    <div key={i} className="glass rounded-xl p-3">
                      <div className="flex items-start gap-3">
                        {correct ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-white">{q.question}</div>
                          <div className="mt-1 text-sm text-white/70">
                            Your answer:{" "}
                            <span className={correct ? "text-emerald-300" : "text-red-300"}>
                              {picked >= 0 ? q.options[picked] : "not answered"}
                            </span>
                          </div>
                          {!correct && (
                            <div className="text-sm text-white/70">
                              Correct: <span className="text-emerald-300">{q.options[q.correctIndex]}</span>
                            </div>
                          )}
                          <div className="mt-1 text-sm text-white/60">{q.explanation}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          <aside className="space-y-4">
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
                <Sparkles className="h-3 w-3" /> Weak areas
              </div>
              <ul className="mt-2 space-y-2 text-sm">
                {result.analysis.weakTopics.length === 0 && (
                  <li className="glass rounded-xl p-2 text-white/80">Perfect run! Try a harder paper.</li>
                )}
                {result.analysis.weakTopics.map((w) => (
                  <li key={w.topic} className="glass rounded-xl p-2">
                    <div className="font-medium text-white">{w.topic}</div>
                    <div className="text-white/60">{w.reason}</div>
                  </li>
                ))}
              </ul>
              {result.analysis.strongTopics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.analysis.strongTopics.map((s) => (
                    <span key={s} className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard hover={false}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
                <BookOpen className="h-3 w-3" /> Revision plan
              </div>
              <ul className="mt-2 space-y-2 text-sm text-white/80">
                {result.analysis.revisionPlan.map((r) => (
                  <li key={r} className="glass rounded-xl p-2">
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs uppercase tracking-widest text-white/50">Next week goals</div>
              <ul className="mt-2 space-y-2 text-sm text-white/80">
                {result.analysis.nextWeekGoals.map((g) => (
                  <li key={g} className="glass rounded-xl p-2">
                    {g}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-sm text-[#FF4FD9]">{result.analysis.encouragement}</div>
            </GlassCard>

            {trend.length > 1 && (
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
                  <TrendingUp className="h-3 w-3" /> Weekly score trend
                </div>
                <div className="mt-3 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#1A1440",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                        formatter={(v: number) => [`${v}%`, "Score"]}
                      />
                      <Line type="monotone" dataKey="score" stroke="#FF4FD9" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            <GlassCard hover={false}>
              <div className="text-sm text-white/70">
                Next paper unlocks next week — or practise again now with a fresh set.
              </div>
              <button
                onClick={() => void onGenerate(true)}
                disabled={busy}
                className="btn-neon btn-neon-hover mt-3 inline-flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                New practice paper
              </button>
            </GlassCard>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
