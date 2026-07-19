import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { Sparkles, Code2, Brain, Languages, Target } from "lucide-react";

export const Route = createFileRoute("/skills")({
  head: () => ({ meta: [{ title: "AI Skill Mentor — Vidya AI" }] }),
  component: Skills,
});

const ROADMAP = [
  {
    month: "Month 1",
    title: "Python Basics",
    items: ["Variables & data types", "Loops & conditions", "Functions", "Mini calculator project"],
  },
  {
    month: "Month 2",
    title: "Data Structures & Algorithms",
    items: ["Lists & dicts", "Sorting & searching", "Recursion", "Solve 30 practice problems"],
  },
  {
    month: "Month 3",
    title: "Real Projects",
    items: ["Build a chatbot", "Weather app with API", "Publish on GitHub", "Present to community"],
  },
];

const skills = [
  { icon: Code2, name: "Programming" },
  { icon: Languages, name: "English speaking" },
  { icon: Brain, name: "Problem solving" },
  { icon: Sparkles, name: "AI tools" },
  { icon: Target, name: "Communication" },
];

function Skills() {
  return (
    <AppShell>
      <SectionHeader
        eyebrow="AI Skill Mentor"
        title="Your *personal career* co-pilot."
        description="Vidya turns your interests and strengths into a step-by-step growth roadmap."
      />

      <div className="grid gap-4 md:grid-cols-5">
        {skills.map((s) => (
          <GlassCard key={s.name} className="text-center">
            <div className="mx-auto h-11 w-11 rounded-xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center">
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className="mt-3 text-white text-sm font-medium">{s.name}</div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-10 relative">
        <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF4FD9] via-[#A855F7] to-[#6366F1]" />
        <div className="space-y-8">
          {ROADMAP.map((r, i) => (
            <div
              key={r.month}
              className={`relative md:grid md:grid-cols-2 md:gap-8 ${
                i % 2 === 0 ? "" : "md:direction-rtl"
              }`}
            >
              <div
                className={`pl-10 md:pl-0 ${i % 2 === 0 ? "md:pr-10 md:text-right" : "md:col-start-2 md:pl-10"}`}
              >
                <GlassCard hover={false}>
                  <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">{r.month}</div>
                  <div className="text-white text-xl font-bold mt-1">{r.title}</div>
                  <ul className="mt-3 space-y-1 text-sm text-white/80">
                    {r.items.map((it) => (
                      <li key={it}>• {it}</li>
                    ))}
                  </ul>
                </GlassCard>
              </div>
              <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-3 h-6 w-6 rounded-full bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] animate-pulse-glow" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
