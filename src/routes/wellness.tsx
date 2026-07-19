import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeader } from "@/components/ui/Section";
import { Heart, Wind, Activity, Apple, Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/wellness")({
  head: () => ({ meta: [{ title: "Healthy Student Life — Vidya AI" }] }),
  component: Wellness,
});

function Wellness() {
  return (
    <AppShell>
      <SectionHeader
        eyebrow="Healthy Student Life"
        title="A *strong body* powers a strong mind."
        description="Daily wellness challenges, meditation and food guidance — designed for young learners."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard hover={false} className="relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#22D3EE]/25 blur-2xl" />
          <div className="flex items-center gap-3 text-[#22D3EE]">
            <Wind className="h-5 w-5" /> Meditation Challenge
          </div>
          <div className="text-white text-2xl font-bold mt-2">30-Minute Calm</div>
          <p className="text-white/70 text-sm mt-1">
            A daily guided meditation to reduce stress, improve focus and sleep better.
          </p>
          <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-[#22D3EE] to-[#6366F1]" />
          </div>
          <div className="mt-1 text-xs text-white/60">22 / 30 min today</div>
          <button className="btn-neon btn-neon-hover mt-4 text-sm">Continue Session</button>
        </GlassCard>

        <GlassCard hover={false} className="relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#FF4FD9]/25 blur-2xl" />
          <div className="flex items-center gap-3 text-[#FF4FD9]">
            <Activity className="h-5 w-5" /> Outdoor Challenge
          </div>
          <div className="text-white text-2xl font-bold mt-2">1-Hour Play</div>
          <p className="text-white/70 text-sm mt-1">
            Football, cycling, running or gardening — 60 minutes outside every day.
          </p>
          <div className="mt-4 grid grid-cols-7 gap-1">
            {[1, 1, 1, 1, 0.5, 0, 0].map((v, i) => (
              <div key={i} className="h-8 rounded bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-t from-[#FF4FD9] to-[#A855F7]"
                  style={{ height: `${v * 100}%` }}
                />
              </div>
            ))}
          </div>
          <button className="btn-neon btn-neon-hover mt-4 text-sm">Log Activity</button>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard hover={false}>
          <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
            <Sun className="h-3 w-3" /> Morning
          </div>
          <div className="text-white font-semibold mt-1">Meditation Guide</div>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• 5 min breathing (4-7-8)</li>
            <li>• 10 min body scan</li>
            <li>• 5 min gratitude</li>
          </ul>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
            <Activity className="h-3 w-3" /> Afternoon
          </div>
          <div className="text-white font-semibold mt-1">Exercise Ideas</div>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• Skipping — 10 min</li>
            <li>• Yoga — Surya Namaskar x 5</li>
            <li>• Village run — 2 km</li>
          </ul>
        </GlassCard>
        <GlassCard hover={false}>
          <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
            <Apple className="h-3 w-3" /> Food (age 12–15)
          </div>
          <div className="text-white font-semibold mt-1">Recommended</div>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• Ragi mudde + dal</li>
            <li>• Banana + peanuts</li>
            <li>• Curd rice + greens</li>
            <li>• Seasonal fruit</li>
          </ul>
        </GlassCard>
      </div>

      <GlassCard hover={false} className="mt-6">
        <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
          <Moon className="h-3 w-3" /> Mental Wellness
        </div>
        <div className="mt-2 text-white font-semibold">How are you feeling today?</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["😊 Happy", "😐 Okay", "😔 Low", "😟 Stressed", "😴 Tired"].map((m) => (
            <button key={m} className="glass rounded-full px-4 py-2 text-sm text-white/85 hover:bg-white/10">
              {m}
            </button>
          ))}
        </div>
        <p className="text-white/60 text-xs mt-3 flex items-center gap-1">
          <Heart className="h-3 w-3 text-[#FF4FD9]" /> Your check-ins are private.
        </p>
      </GlassCard>
    </AppShell>
  );
}
