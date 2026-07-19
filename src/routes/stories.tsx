import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/stories")({
  head: () => ({ meta: [{ title: "Moral Stories & Inspiration — Vidya AI" }] }),
  component: Stories,
});

const STORIES = [
  {
    title: "APJ Abdul Kalam — The Boy Who Sold Newspapers",
    lesson: "Dreams don't care where you come from — only how hard you work.",
    body: "Born in a small Tamil Nadu town, young Kalam sold newspapers before school to help his family. He dreamed of the sky, studied under kerosene lamps, and grew up to become India's Missile Man and President. His story reminds us that humble beginnings can build extraordinary futures.",
  },
  {
    title: "Marie Curie — Girl Who Refused to Quit",
    lesson: "Curiosity + persistence beats every closed door.",
    body: "Marie couldn't attend university in her country because she was a woman. She studied secretly, moved to Paris, and worked in a freezing lab. She discovered two new elements and became the first person to win two Nobel Prizes.",
  },
  {
    title: "Ratan Tata — The Kind Businessman",
    lesson: "Real success is measured by how you treat others.",
    body: "A quiet leader who built one of the world's most respected companies, Ratan Tata is remembered not only for wealth, but for kindness — from feeding stray dogs to lifting up young entrepreneurs.",
  },
];

function Stories() {
  const [active, setActive] = useState(0);
  const s = STORIES[active];
  const [reflection, setReflection] = useState("");

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Weekend Inspiration"
        title="Stories that *shape character*."
        description="Every weekend, meet the heroes whose lives light the way."
      />

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-2">
          {STORIES.map((st, i) => (
            <button
              key={st.title}
              onClick={() => {
                setActive(i);
                setReflection("");
              }}
              className={`w-full text-left rounded-2xl p-4 transition ${
                active === i
                  ? "bg-gradient-to-br from-[#FF4FD9]/30 to-[#6366F1]/20 neon-ring"
                  : "glass hover:bg-white/10"
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Chapter {i + 1}</div>
              <div className="text-white font-semibold text-sm mt-1">{st.title}</div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
              <BookOpen className="h-3 w-3" /> Story
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">{s.title}</h3>
            <p className="text-white/80 mt-3 leading-relaxed">{s.body}</p>
            <div className="mt-4 glass rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Life Lesson</div>
              <div className="text-white mt-1 italic">“{s.lesson}”</div>
            </div>
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> Reflect
            </div>
            <div className="text-white mt-2 font-medium">What did you learn today?</div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write 2–3 sentences…"
              className="mt-3 w-full h-28 rounded-xl bg-white/5 border border-white/10 p-3 text-white outline-none focus:border-[#FF4FD9]/50"
            />
            <button className="btn-neon btn-neon-hover mt-3 text-sm">Save Reflection</button>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
