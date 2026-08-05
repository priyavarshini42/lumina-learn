import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { ClassroomOnboarding, type Prefs } from "@/components/classroom/ClassroomOnboarding";
import { LessonSession } from "@/components/classroom/LessonSession";
import { useAuth, educationLabel } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { HomeworkReport, Lesson } from "@/lib/classroom-types";
import {
  completeLesson,
  savePreferences,
  saveLessonStep,
  startLesson,
  submitHomework,
} from "@/lib/lesson.functions";

export const Route = createFileRoute("/classroom")({
  head: () => ({
    meta: [
      { title: "AI Avatar Classroom — Daily Live Lessons | Vidya AI" },
      {
        name: "description",
        content:
          "Enter a live AI avatar classroom: one syllabus chapter a day with revision, teaching, quiz, assignment and AI-evaluated homework.",
      },
      { property: "og:title", content: "AI Avatar Classroom — Vidya AI" },
      {
        property: "og:description",
        content:
          "A talking multilingual AI teacher that completes one chapter per day and evaluates your homework.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Classroom,
});

type PrefsRow = {
  medium: string;
  learning_speed: string;
  daily_minutes: number;
  voice_language: string;
  onboarded: boolean;
};
type Subject = { id: string; name: string; code: string };
type Chapter = { id: string; title: string; sort_order: number };

function Classroom() {
  const { user, profile, loading } = useAuth();
  const [prefs, setPrefs] = useState<PrefsRow | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [inProgressIds, setInProgressIds] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<{ id: string; lesson: Lesson; step: number } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [report, setReport] = useState<HomeworkReport | null>(null);
  const [streak, setStreak] = useState(0);

  const grade = educationLabel(profile);

  /* Load preferences, subjects, progress */
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      const [{ data: p }, { data: prog }, { data: att }] = await Promise.all([
        supabase
          .from("learning_preferences")
          .select("medium, learning_speed, daily_minutes, voice_language, onboarded")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("chapter_progress").select("chapter_id, status").eq("user_id", user.id),
        supabase.from("study_attendance").select("study_date").eq("user_id", user.id),
      ]);
      if (!active) return;
      setPrefs((p as PrefsRow | null) ?? null);
      setCompletedIds((prog ?? []).filter((r) => r.status === "completed").map((r) => r.chapter_id));
      setInProgressIds(
        (prog ?? []).filter((r) => r.status === "in_progress").map((r) => r.chapter_id),
      );
      setStreak((att ?? []).length);
      setDataLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    void (async () => {
      let q = supabase
        .from("subjects")
        .select("id, name, code")
        .eq("education_type", profile.education_type)
        .order("sort_order");
      if (profile.education_type === "school" && profile.grade_number !== null) {
        q = q.eq("grade_number", profile.grade_number);
      }
      if (profile.education_type === "intermediate" && profile.stream) {
        q = q.eq("stream", profile.stream);
      }
      const { data } = await q;
      if (!active) return;
      setSubjects(data ?? []);
      setSubjectId((cur) => cur ?? data?.[0]?.id ?? null);
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  useEffect(() => {
    if (!subjectId) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("chapters")
        .select("id, title, sort_order")
        .eq("subject_id", subjectId)
        .order("sort_order");
      if (active) setChapters(data ?? []);
    })();
    return () => {
      active = false;
    };
  }, [subjectId]);

  /** One chapter per day: resume unfinished, else next uncompleted. Never skip ahead. */
  const todayChapter = useMemo(() => {
    const resume = chapters.find((c) => inProgressIds.includes(c.id));
    if (resume) return { chapter: resume, resumed: true };
    const next = chapters.find((c) => !completedIds.includes(c.id));
    return next ? { chapter: next, resumed: false } : null;
  }, [chapters, completedIds, inProgressIds]);

  const previousChapterTitle = useMemo(() => {
    if (!todayChapter) return null;
    const idx = chapters.findIndex((c) => c.id === todayChapter.chapter.id);
    return idx > 0 ? (chapters[idx - 1]?.title ?? null) : null;
  }, [chapters, todayChapter]);

  const handleSavePrefs = async (next: Prefs) => {
    setSavingPrefs(true);
    try {
      await savePreferences({ data: next });
      setPrefs({
        medium: next.medium,
        learning_speed: next.learningSpeed,
        daily_minutes: next.dailyMinutes,
        voice_language: next.voiceLanguage,
        onboarded: true,
      });
      toast.success("Classroom ready!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleStart = async () => {
    if (!prefs || !todayChapter || !profile) return;
    const subject = subjects.find((s) => s.id === subjectId);
    setStarting(true);
    try {
      const idx = chapters.findIndex((c) => c.id === todayChapter.chapter.id);
      const res = await startLesson({
        data: {
          subject: subject?.name ?? "General",
          chapterId: todayChapter.chapter.id,
          chapterTitle: todayChapter.chapter.title,
          chapterNumber: idx + 1,
          previousChapterTitle,
          grade,
          medium: prefs.medium,
          language: prefs.voice_language,
          learningSpeed: prefs.learning_speed,
          dailyMinutes: prefs.daily_minutes,
          studentName: profile.full_name,
        },
      });
      setReport(null);
      setSession({ id: res.sessionId, lesson: res.lesson, step: 0 });
      setInProgressIds((ids) =>
        ids.includes(todayChapter.chapter.id) ? ids : [...ids, todayChapter.chapter.id],
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the class");
    } finally {
      setStarting(false);
    }
  };

  const handleStep = useCallback(
    (step: number) => {
      if (!session) return;
      void saveLessonStep({ data: { sessionId: session.id, step } }).catch(() => {});
    },
    [session],
  );

  const handleComplete = useCallback(
    (quizScore: number) => {
      if (!session || !todayChapter) return;
      void completeLesson({
        data: { sessionId: session.id, chapterId: todayChapter.chapter.id, quizScore },
      })
        .then(() => {
          setCompletedIds((ids) => [...ids, todayChapter.chapter.id]);
          setInProgressIds((ids) => ids.filter((i) => i !== todayChapter.chapter.id));
          toast.success(`Chapter completed! Quiz ${quizScore}/${session.lesson.quiz.length}`);
        })
        .catch(() => {});
    },
    [session, todayChapter],
  );

  const handleHomework = useCallback(
    async (submissions: { question: string; answer: string }[]) => {
      if (!session || !prefs) return;
      setEvaluating(true);
      try {
        const r = await submitHomework({
          data: {
            sessionId: session.id,
            chapterTitle: session.lesson.chapterTitle,
            grade,
            language: prefs.voice_language,
            submissions,
          },
        });
        setReport(r);
        toast.success("Homework evaluated by your AI teacher");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Evaluation failed");
      } finally {
        setEvaluating(false);
      }
    },
    [session, prefs, grade],
  );

  /* --- Render states --- */
  if (loading || dataLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-white/70">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing your classroom…
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <SectionHeader
          eyebrow="AI Avatar Teacher"
          title="Sign in to enter your *AI classroom*."
          description="Your daily chapter, quizzes and homework are saved to your student account."
        />
        <Link to="/auth" className="btn-neon btn-neon-hover inline-block">
          Sign in / Create account
        </Link>
      </AppShell>
    );
  }

  if (!prefs?.onboarded) {
    return (
      <AppShell>
        <SectionHeader
          eyebrow="AI Avatar Teacher"
          title="Set up your *daily class*."
          description="Tell Vidya how you like to learn — she adapts every lesson to you."
        />
        <ClassroomOnboarding
          studentName={profile?.full_name ?? "Student"}
          grade={grade}
          saving={savingPrefs}
          onSave={handleSavePrefs}
        />
      </AppShell>
    );
  }

  if (session) {
    return (
      <AppShell>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">
              Live class in session
            </div>
            <h1 className="text-2xl font-bold text-white">{session.lesson.chapterTitle}</h1>
          </div>
          <button
            onClick={() => setSession(null)}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Exit classroom
          </button>
        </div>
        <LessonSession
          lesson={session.lesson}
          language={prefs.voice_language}
          learningSpeed={prefs.learning_speed}
          startStep={session.step}
          onStep={handleStep}
          onComplete={handleComplete}
          onSubmitHomework={handleHomework}
          evaluating={evaluating}
          report={report}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SectionHeader
        eyebrow="AI Avatar Teacher"
        title="Your *AI teacher* is ready for today's class."
        description="One chapter per day — revision, teaching, quiz, assignment and AI-checked homework."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard hover={false} className="relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#FF4FD9]/25 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
                <CalendarCheck className="h-3.5 w-3.5" /> Today&apos;s chapter
              </div>
              {todayChapter ? (
                <>
                  <h2 className="mt-2 text-3xl font-bold text-white">
                    {todayChapter.chapter.title}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {grade} · {subjects.find((s) => s.id === subjectId)?.name} ·{" "}
                    {prefs.daily_minutes} min · {prefs.medium} medium
                    {todayChapter.resumed && " · resuming unfinished chapter"}
                  </p>
                  <button
                    onClick={handleStart}
                    disabled={starting}
                    className="btn-neon btn-neon-hover mt-6 inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {starting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Vidya is preparing your
                        lesson…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {todayChapter.resumed ? "Resume AI Teacher" : "Start AI Teacher"}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <p className="mt-3 text-white/80">
                  🎉 You have completed every chapter in this subject. Pick another subject to
                  continue.
                </p>
              )}
            </div>
          </GlassCard>

          <GlassCard hover={false} className="mt-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <BookOpen className="h-3.5 w-3.5" /> Chapter roadmap
            </div>
            <div className="mt-3 space-y-2">
              {chapters.map((c, i) => {
                const done = completedIds.includes(c.id);
                const current = todayChapter?.chapter.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                      current
                        ? "border border-[#FF4FD9]/40 bg-[#FF4FD9]/10 text-white"
                        : done
                          ? "bg-white/5 text-emerald-300"
                          : "bg-white/5 text-white/50"
                    }`}
                  >
                    <span>
                      {i + 1}. {c.title}
                    </span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : current ? (
                      <span className="text-xs uppercase tracking-wide">today</span>
                    ) : (
                      <span className="text-xs">locked</span>
                    )}
                  </div>
                );
              })}
              {chapters.length === 0 && (
                <p className="text-sm text-white/60">No chapters yet for this subject.</p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <aside className="space-y-4">
          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Subject</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    subjectId === s.id
                      ? "bg-gradient-to-r from-[#FF4FD9] to-[#6366F1] text-white"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <Flame className="h-3.5 w-3.5" /> Study streak
            </div>
            <div className="mt-2 text-3xl font-bold text-white">{streak} days</div>
            <div className="mt-1 text-sm text-white/60">
              {completedIds.length} chapters completed
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <RefreshCw className="h-3.5 w-3.5" /> Learning setup
            </div>
            <ul className="mt-2 space-y-1 text-sm text-white/80">
              <li>Medium: {prefs.medium}</li>
              <li>Speed: {prefs.learning_speed}</li>
              <li>Daily time: {prefs.daily_minutes} min</li>
            </ul>
            <button
              onClick={() => setPrefs({ ...prefs, onboarded: false })}
              className="mt-3 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white hover:bg-white/10"
            >
              Change setup
            </button>
          </GlassCard>
        </aside>
      </div>
    </AppShell>
  );
}
