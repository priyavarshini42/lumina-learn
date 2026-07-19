import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader, GlassCard } from "@/components/ui/Section";

export const Route = createFileRoute("/lens")({
  head: () => ({ meta: [{ title: "AI Lens Scanner — Vidya AI" }] }),
  component: Lens,
});

function Lens() {
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImage(url);
    setStatus("processing");
    setTimeout(() => setStatus("done"), 2200);
  };

  return (
    <AppShell>
      <SectionHeader
        eyebrow="AI Lens"
        title="Scan a problem. *Get instant solutions*."
        description="Snap a textbook page, math problem or science diagram — Vidya explains it step by step."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-strong rounded-3xl p-6">
          <div className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-white/15 bg-black/20 flex items-center justify-center overflow-hidden">
            {image ? (
              <img src={image} alt="Uploaded" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center text-white/60">
                <Camera className="mx-auto h-10 w-10" />
                <div className="mt-2 text-sm">Camera preview / upload area</div>
              </div>
            )}
            {status === "processing" && (
              <div className="absolute inset-0 bg-[#120F33]/70 backdrop-blur flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-[#FF4FD9]/30 border-t-[#FF4FD9] animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-[#FF4FD9]" />
                </div>
                <div className="mt-4 text-sm text-white/80">Analyzing your problem…</div>
                {/* Scan line */}
                <motion.div
                  initial={{ y: -100 }}
                  animate={{ y: 100 }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-[#FF4FD9] to-transparent"
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <label className="btn-neon btn-neon-hover inline-flex items-center gap-2 cursor-pointer">
              <Upload className="h-4 w-4" /> Upload Image
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            </label>
            <button
              onClick={() => {
                setImage(null);
                setStatus("idle");
              }}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-[#FF4FD9] text-xs uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> AI Solution
            </div>
            {status !== "done" ? (
              <p className="mt-3 text-white/60 text-sm">
                Upload an image to see the step-by-step solution here.
              </p>
            ) : (
              <div className="mt-3 space-y-3 text-sm text-white/85">
                <div>
                  <div className="text-white font-semibold">Problem</div>
                  <div className="text-white/70">Solve: 2x + 6 = 14</div>
                </div>
                <div>
                  <div className="text-white font-semibold">Step-by-step</div>
                  <ol className="mt-1 list-decimal list-inside space-y-1 text-white/80">
                    <li>Subtract 6 from both sides: 2x = 8</li>
                    <li>Divide both sides by 2: x = 4</li>
                    <li>Check: 2(4) + 6 = 14 ✓</li>
                  </ol>
                </div>
                <div>
                  <div className="text-white font-semibold">Easy explanation</div>
                  <p className="text-white/70">
                    Think of a balance scale — whatever you do to one side, do to the other. We take
                    away 6 from both, then split what's left equally.
                  </p>
                </div>
                <div>
                  <div className="text-white font-semibold">Practice</div>
                  <ul className="mt-1 space-y-1 text-white/70">
                    <li>• Solve 3x + 9 = 24</li>
                    <li>• Solve 5x - 4 = 21</li>
                  </ul>
                </div>
              </div>
            )}
          </GlassCard>
          <GlassCard hover={false}>
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Works on</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs text-white/80">
              {["Math problems", "Textbook pages", "Diagrams", "Handwritten", "Equations", "Charts"].map((t) => (
                <div key={t} className="glass rounded-xl py-2">{t}</div>
              ))}
            </div>
          </GlassCard>
          {status === "done" && (
            <div className="glass rounded-2xl p-3 flex items-center gap-2 text-emerald-300 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Solution ready — ask Vidya for more examples.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
