import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Clock, Heart, Trophy, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/parents")({
  head: () => ({ meta: [{ title: "Parent Dashboard — Vidya AI" }] }),
  component: Parents,
});

const hours = [
  { day: "Mon", h: 1.2 },
  { day: "Tue", h: 1.8 },
  { day: "Wed", h: 2.4 },
  { day: "Thu", h: 1.5 },
  { day: "Fri", h: 2.1 },
  { day: "Sat", h: 3.2 },
  { day: "Sun", h: 2.7 },
];

function Parents() {
  return (
    <AppShell>
      <SectionHeader
        eyebrow="Parent Dashboard"
        title="See your child's *whole growth*."
        description="Learning, skills, wellness and weak areas — one clear view for parents."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Clock, val: "14.9h", lbl: "Learning this week" },
          { icon: Trophy, val: "7", lbl: "New badges" },
          { icon: Heart, val: "6/7", lbl: "Wellness days" },
          { icon: AlertCircle, val: "3", lbl: "Weak areas" },
        ].map((s) => (
          <GlassCard key={s.lbl} className="text-center">
            <s.icon className="mx-auto h-5 w-5 text-[#FF4FD9]" />
            <div className="text-2xl font-bold text-white mt-2">{s.val}</div>
            <div className="text-xs uppercase tracking-widest text-white/60">{s.lbl}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <GlassCard hover={false}>
          <div className="text-white font-semibold">Daily Learning Hours</div>
          <div className="h-60 mt-3">
            <ResponsiveContainer>
              <BarChart data={hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="day" stroke="#ffffff70" />
                <YAxis stroke="#ffffff40" />
                <Tooltip
                  contentStyle={{
                    background: "#1a0f3a",
                    border: "1px solid #ffffff20",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="h" fill="url(#gradPink)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="gradPink" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FF4FD9" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <div className="text-white font-semibold">Skills Improved</div>
          <ul className="mt-3 space-y-3 text-sm">
            {[
              ["Mathematics", 82],
              ["Science", 74],
              ["English", 65],
              ["Coding", 58],
              ["Communication", 70],
            ].map(([n, v]) => (
              <li key={n as string}>
                <div className="flex justify-between text-white/85">
                  <span>{n}</span>
                  <span>{v}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF4FD9] to-[#6366F1]"
                    style={{ width: `${v}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard hover={false} className="mt-6">
        <div className="text-white font-semibold">Weekly Note from Vidya</div>
        <p className="mt-2 text-white/75 text-sm leading-relaxed">
          Anitha had a strong week — a 12-day streak and 90% on Friday's science quiz. She struggles
          with trigonometry ratios; we've added extra practice for next week. Wellness looks great
          with 6 out of 7 outdoor days. Consider celebrating her Reading Master badge together this
          weekend.
        </p>
      </GlassCard>
    </AppShell>
  );
}
