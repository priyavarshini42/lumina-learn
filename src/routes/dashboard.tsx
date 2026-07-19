import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Trophy, Flame, BookOpen, Target, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — Vidya AI" }] }),
  component: Dashboard,
});

const progress = [
  { day: "Mon", xp: 40 },
  { day: "Tue", xp: 65 },
  { day: "Wed", xp: 50 },
  { day: "Thu", xp: 90 },
  { day: "Fri", xp: 75 },
  { day: "Sat", xp: 110 },
  { day: "Sun", xp: 130 },
];

const skills = [
  { skill: "Math", value: 82 },
  { skill: "Science", value: 74 },
  { skill: "English", value: 65 },
  { skill: "Coding", value: 58 },
  { skill: "Communication", value: 70 },
];

function Dashboard() {
  return (
    <AppShell>
      <SectionHeader
        eyebrow="Personalized Dashboard"
        title="Your *learning journey* at a glance."
        description="Track progress, weak topics and skill growth — with AI recommendations built in."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="glass-strong rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center text-2xl font-bold text-white">
              A
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Welcome back</div>
              <div className="text-2xl font-bold text-white">Anitha, Class 9</div>
              <div className="text-white/60 text-sm">Rural Learner · Andhra Pradesh · Telugu</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Flame, val: "12", lbl: "Day streak" },
                { icon: Trophy, val: "7", lbl: "Badges" },
                { icon: Target, val: "82%", lbl: "Avg score" },
              ].map((s) => (
                <div key={s.lbl} className="glass rounded-2xl p-3 text-center">
                  <s.icon className="mx-auto h-4 w-4 text-[#FF4FD9]" />
                  <div className="text-white font-bold mt-1">{s.val}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard hover={false}>
              <div className="text-white font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#FF4FD9]" /> Weekly XP
              </div>
              <div className="h-56 mt-3">
                <ResponsiveContainer>
                  <LineChart data={progress}>
                    <defs>
                      <linearGradient id="xp" x1="0" x2="1">
                        <stop offset="0%" stopColor="#FF4FD9" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#ffffff60" tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#1a0f3a",
                        border: "1px solid #ffffff20",
                        borderRadius: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      stroke="url(#xp)"
                      strokeWidth={3}
                      dot={{ fill: "#FF4FD9", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard hover={false}>
              <div className="text-white font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF4FD9]" /> Skill Radar
              </div>
              <div className="h-56 mt-3">
                <ResponsiveContainer>
                  <RadarChart data={skills}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis dataKey="skill" stroke="#ffffff80" />
                    <PolarRadiusAxis stroke="#ffffff30" />
                    <Radar
                      dataKey="value"
                      stroke="#FF4FD9"
                      fill="#FF4FD9"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <GlassCard hover={false}>
            <div className="text-white font-semibold">Completed Courses</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { t: "Algebra Basics", p: 100 },
                { t: "Cells & Life", p: 92 },
                { t: "English Grammar", p: 78 },
              ].map((c) => (
                <div key={c.t} className="glass rounded-xl p-3">
                  <div className="text-sm text-white">{c.t}</div>
                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4FD9] to-[#6366F1]"
                      style={{ width: `${c.p}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-white/60">{c.p}% mastered</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <aside className="space-y-4">
          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">AI Recommendation</div>
            <div className="mt-2 text-white font-semibold">Learn Python next</div>
            <p className="text-white/70 text-sm mt-1">
              Based on your logic scores and interest in problem-solving, Python is a great next
              step. I'll build you a 3-month roadmap.
            </p>
            <button className="btn-neon btn-neon-hover mt-3 text-sm">Start Roadmap</button>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Weak topics</div>
            <ul className="mt-2 space-y-2 text-sm">
              {[
                ["Trigonometry", 45],
                ["Chemical Reactions", 52],
                ["Essay writing", 60],
              ].map(([t, p]) => (
                <li key={t as string}>
                  <div className="flex justify-between text-white/80">
                    <span>{t}</span>
                    <span>{p}%</span>
                  </div>
                  <div className="h-1.5 mt-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#F472B6] to-[#FF4FD9]"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Badges</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {[
                "🏆 Knowledge Champion",
                "🔥 7 Day Streak",
                "⚽ Fitness Explorer",
                "📚 Reading Master",
              ].map((b) => (
                <div key={b} className="glass rounded-xl p-2 text-white/85">{b}</div>
              ))}
            </div>
          </GlassCard>
        </aside>
      </div>
    </AppShell>
  );
}
