import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Sparkles,
  Trophy,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { useAuth } from "@/hooks/useAuth";
import {
  getChildDashboard,
  getChildRecommendations,
  listChildren,
  requestChildLink,
} from "@/lib/parent.functions";

export const Route = createFileRoute("/parents")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — Track Your Child's Learning | Vidya AI" },
      {
        name: "description",
        content:
          "See today's lesson, homework status, quiz scores, attendance, streak and AI weekly/monthly recommendations for every child.",
      },
      { property: "og:title", content: "Parent Dashboard — Vidya AI" },
      {
        property: "og:description",
        content:
          "Daily lesson, homework, quiz scores, attendance, streaks and AI guidance for each child.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Parents,
});

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: string;
  label: string;
}) {
  return (
    <GlassCard className="text-center">
      <Icon className="mx-auto h-5 w-5 text-[#FF4FD9]" />
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      <div className="text-xs uppercase tracking-widest text-white/60">{label}</div>
    </GlassCard>
  );
}

function AddChild() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [relation, setRelation] = useState("guardian");
  const request = useServerFn(requestChildLink);
  const mutation = useMutation({
    mutationFn: (v: { username: string; relation: string }) => request({ data: v }),
    onSuccess: () => {
      toast.success("Request sent. Your child can approve it from their profile.");
      setUsername("");
      void qc.invalidateQueries({ queryKey: ["children"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <GlassCard hover={false}>
      <div className="flex items-center gap-2 font-semibold text-white">
        <UserPlus className="h-4 w-4 text-[#FF4FD9]" /> Link a child
      </div>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (username.trim()) mutation.mutate({ username, relation });
        }}
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Child's username"
          className="glass flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
        />
        <select
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          className="glass rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          <option value="guardian">Guardian</option>
          <option value="mother">Mother</option>
          <option value="father">Father</option>
        </select>
        <button
          type="submit"
          disabled={mutation.isPending || !username.trim()}
          className="btn-neon btn-neon-hover text-sm disabled:opacity-50"
        >
          {mutation.isPending ? "Sending…" : "Send request"}
        </button>
      </form>
    </GlassCard>
  );
}

function Recommendations({ studentId }: { studentId: string }) {
  const fetchRecs = useServerFn(getChildRecommendations);
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["child-recs", studentId],
    queryFn: () => fetchRecs({ data: { studentId } }),
    enabled: false,
    retry: false,
  });

  return (
    <GlassCard hover={false}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Sparkles className="h-4 w-4 text-[#FF4FD9]" /> Weekly &amp; monthly plan
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="btn-neon btn-neon-hover text-xs disabled:opacity-50"
        >
          {isFetching ? "Thinking…" : data ? "Refresh" : "Generate"}
        </button>
      </div>

      {!data && !isFetching && !error && (
        <p className="mt-2 text-sm text-white/60">
          Get AI guidance for the coming week and month based on your child's real progress.
        </p>
      )}
      {isFetching && (
        <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing your plan…
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-300">Couldn't prepare the plan. Try again.</p>}

      {data && (
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-white/80">{data.parentNote}</p>
          {[
            { title: "This week", items: data.weekly },
            { title: "This month", items: data.monthly },
            { title: "Revise these topics", items: data.focusTopics },
          ].map((block) => (
            <div key={block.title}>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">{block.title}</div>
              <ul className="mt-1 space-y-1 text-white/75">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#FF4FD9]">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function ChildDashboardView({ studentId }: { studentId: string }) {
  const fetchDashboard = useServerFn(getChildDashboard);
  const { data, isPending, error } = useQuery({
    queryKey: ["child-dashboard", studentId],
    queryFn: () => fetchDashboard({ data: { studentId } }),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-white/60">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your child's progress…
      </div>
    );
  }
  if (error || !data) {
    return (
      <GlassCard hover={false}>
        <p className="text-sm text-white/70">
          This child's data isn't available yet — the link may still be waiting for their approval.
        </p>
      </GlassCard>
    );
  }

  const { today, stats, homework, quizzes, attendance, weakTopics } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          value={`${(stats.minutesThisWeek / 60).toFixed(1)}h`}
          label="Learning this week"
        />
        <StatCard icon={Flame} value={`${stats.streakDays}`} label="Day streak" />
        <StatCard
          icon={Trophy}
          value={stats.averageQuizScore === null ? "—" : `${stats.averageQuizScore}/5`}
          label="Avg quiz score"
        />
        <StatCard icon={AlertCircle} value={`${stats.homeworkPending}`} label="Homework pending" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 font-semibold text-white">
              <BookOpen className="h-4 w-4 text-[#FF4FD9]" /> Today's lesson
            </div>
            {today.lesson ? (
              <div className="mt-3 space-y-2">
                <div className="text-lg font-semibold text-white">{today.lesson.chapterTitle}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      today.lesson.completed
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    {today.lesson.completed ? "Completed" : "In progress"}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">
                    {today.minutes} min studied today
                  </span>
                  {today.lesson.quizScore !== null && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">
                      Quiz {today.lesson.quizScore}/5
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/60">
                No lesson started today yet. Encourage your child to open the AI Classroom.
              </p>
            )}
          </GlassCard>

          <GlassCard hover={false}>
            <div className="font-semibold text-white">Quiz scores</div>
            <div className="mt-3 h-56">
              {quizzes.length ? (
                <ResponsiveContainer>
                  <LineChart data={quizzes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#ffffff60" tickLine={false} />
                    <YAxis domain={[0, 5]} stroke="#ffffff40" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#1a0f3a",
                        border: "1px solid #ffffff20",
                        borderRadius: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#FF4FD9"
                      strokeWidth={3}
                      dot={{ fill: "#FF4FD9", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-white/60">No quizzes attempted yet.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center gap-2 font-semibold text-white">
              <CalendarCheck className="h-4 w-4 text-[#FF4FD9]" /> Attendance &amp; study minutes
            </div>
            <div className="mt-3 h-56">
              {attendance.length ? (
                <ResponsiveContainer>
                  <BarChart data={attendance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#ffffff60" />
                    <YAxis stroke="#ffffff40" />
                    <Tooltip
                      contentStyle={{
                        background: "#1a0f3a",
                        border: "1px solid #ffffff20",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="minutes" fill="url(#gradPink)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="gradPink" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#FF4FD9" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-white/60">No study days recorded yet.</p>
              )}
            </div>
            <div className="mt-2 text-xs text-white/50">
              {stats.chaptersCompleted} chapters completed ·{" "}
              {(stats.minutesThisMonth / 60).toFixed(1)}h this month
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="font-semibold text-white">Homework status</div>
            {homework.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {homework.slice(0, 8).map((h) => (
                  <li key={h.id} className="glass rounded-xl p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-white">{h.chapterTitle}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                          h.status === "evaluated"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {h.status === "evaluated" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {h.status === "evaluated" ? `Scored ${h.score ?? 0}%` : "Not submitted"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-white/50">Due {h.dueDate}</div>
                    {h.teacherRemark && (
                      <p className="mt-1 text-xs text-white/70">{h.teacherRemark}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-white/60">No homework assigned yet.</p>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-4">
          <Recommendations studentId={studentId} />
          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Weak areas</div>
            {weakTopics.length ? (
              <ul className="mt-2 space-y-1 text-sm text-white/80">
                {weakTopics.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-white/60">
                No weak areas yet — homework reports will list them here.
              </p>
            )}
          </GlassCard>
          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Homework average</div>
            <div className="mt-1 text-2xl font-bold text-white">
              {stats.averageHomeworkScore === null ? "—" : `${stats.averageHomeworkScore}%`}
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}

function Parents() {
  const { user, loading } = useAuth();
  const fetchChildren = useServerFn(listChildren);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: children } = useQuery({
    queryKey: ["children"],
    queryFn: () => fetchChildren({}),
    enabled: !!user,
    retry: false,
  });

  const activeId = selected ?? children?.find((c) => c.approved)?.studentId ?? null;

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Parent Dashboard"
        title="See your child's *whole growth*."
        description="Today's lesson, homework, quiz scores, attendance, streak and AI recommendations — one clear view."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !user ? (
        <GlassCard hover={false}>
          <div className="font-semibold text-white">Sign in to follow your child</div>
          <p className="mt-1 text-sm text-white/70">
            Parents need an account to link a child and view their learning report.
          </p>
          <Link to="/auth" className="btn-neon btn-neon-hover mt-3 inline-flex text-sm">
            Sign in
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <AddChild />

          {children && children.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <button
                  key={c.studentId}
                  onClick={() => c.approved && setSelected(c.studentId)}
                  className={`glass rounded-2xl px-4 py-3 text-left transition ${
                    activeId === c.studentId ? "ring-2 ring-[#FF4FD9]" : ""
                  } ${c.approved ? "hover:bg-white/10" : "opacity-60"}`}
                >
                  <div className="text-sm font-semibold text-white">{c.fullName}</div>
                  <div className="text-xs text-white/60">
                    @{c.username} {c.gradeLabel && `· ${c.gradeLabel}`}
                  </div>
                  {!c.approved && (
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-amber-300">
                      Waiting for approval
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeId ? (
            <ChildDashboardView studentId={activeId} />
          ) : (
            <GlassCard hover={false}>
              <p className="text-sm text-white/70">
                Link your child with their username above. Once they approve from their profile,
                their full learning report appears here.
              </p>
            </GlassCard>
          )}
        </div>
      )}
    </AppShell>
  );
}
