import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { GlassCard } from "@/components/ui/Section";
import { LANGUAGES } from "@/lib/i18n";

export type Prefs = {
  medium: string;
  learningSpeed: string;
  dailyMinutes: number;
  voiceLanguage: string;
};

const SPEEDS = [
  { id: "slow", label: "Slow", desc: "Extra examples, gentle pace" },
  { id: "normal", label: "Normal", desc: "Balanced classroom pace" },
  { id: "fast", label: "Fast", desc: "Challenge me, go deeper" },
];
const TIMES = [30, 45, 60, 90];
const MEDIUMS = ["English", "Telugu"];

export function ClassroomOnboarding({
  studentName,
  grade,
  saving,
  onSave,
}: {
  studentName: string;
  grade: string;
  saving: boolean;
  onSave: (prefs: Prefs) => void;
}) {
  const [medium, setMedium] = useState("English");
  const [voiceLanguage, setVoiceLanguage] = useState("en");
  const [learningSpeed, setLearningSpeed] = useState("normal");
  const [dailyMinutes, setDailyMinutes] = useState(45);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard hover={false} className="mx-auto max-w-2xl">
        <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">First class setup</div>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Welcome, {studentName}! Let&apos;s set up your daily class.
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Your class is detected as <span className="text-white">{grade}</span> and we&apos;ll follow
          the Andhra Pradesh State Board syllabus.
        </p>

        <div className="mt-6 space-y-5">
          <Field label="Medium of instruction">
            <div className="flex gap-2">
              {MEDIUMS.map((m) => (
                <Chip key={m} active={medium === m} onClick={() => setMedium(m)}>
                  {m}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Preferred teaching language">
            <select
              value={voiceLanguage}
              onChange={(e) => setVoiceLanguage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1A1640] px-3 py-2 text-sm text-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} · {l.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Learning speed">
            <div className="grid gap-2 sm:grid-cols-3">
              {SPEEDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLearningSpeed(s.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${
                    learningSpeed === s.id
                      ? "border-[#FF4FD9]/50 bg-[#FF4FD9]/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-[11px] text-white/60">{s.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Daily study time">
            <div className="flex gap-2">
              {TIMES.map((t) => (
                <Chip key={t} active={dailyMinutes === t} onClick={() => setDailyMinutes(t)}>
                  {t} min
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <button
          disabled={saving}
          onClick={() => onSave({ medium, learningSpeed, dailyMinutes, voiceLanguage })}
          className="btn-neon btn-neon-hover mt-6 inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Rocket className="h-4 w-4" />
          {saving ? "Saving…" : "Save & enter classroom"}
        </button>
      </GlassCard>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-widest text-white/50">{label}</div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm ${
        active
          ? "bg-gradient-to-r from-[#FF4FD9] to-[#6366F1] text-white"
          : "bg-white/5 text-white/70 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
