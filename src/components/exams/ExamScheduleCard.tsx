import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarClock, Loader2, Save } from "lucide-react";
import { GlassCard } from "@/components/ui/Section";
import {
  getExamSchedule,
  saveExamSchedule,
  type ExamSchedule,
} from "@/lib/exam-schedule.functions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hourLabel(h: number) {
  const suffix = h < 12 ? "AM" : "PM";
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base}:00 ${suffix}`;
}

export function ExamScheduleCard() {
  const load = useServerFn(getExamSchedule);
  const save = useServerFn(saveExamSchedule);

  const [schedule, setSchedule] = useState<ExamSchedule | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const s = await load({});
        if (active) setSchedule(s);
      } catch {
        if (active) setSchedule(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const persist = useCallback(
    async (next: ExamSchedule) => {
      setSchedule(next);
      setBusy(true);
      try {
        const saved = await save({
          data: { enabled: next.enabled, dayOfWeek: next.dayOfWeek, hourIst: next.hourIst },
        });
        setSchedule(saved);
        toast.success(
          saved.enabled
            ? `Auto exam set for every ${DAYS[saved.dayOfWeek]} at ${hourLabel(saved.hourIst)}.`
            : "Automatic exam generation turned off.",
        );
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [save],
  );

  if (!schedule) return null;

  return (
    <GlassCard hover={false}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <CalendarClock className="h-3 w-3" /> Auto-schedule
            </div>
            <div className="mt-1 font-semibold text-white">
              Generate my weekend test automatically
            </div>
            <div className="mt-1 text-sm text-white/60">
              We&apos;ll build your paper every week at the time you pick — no tapping needed.
            </div>
          </div>
          <button
            role="switch"
            aria-checked={schedule.enabled}
            aria-label="Automatic weekly exam generation"
            onClick={() => void persist({ ...schedule, enabled: !schedule.enabled })}
            disabled={busy}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              schedule.enabled ? "bg-[#FF4FD9]" : "bg-white/15"
            }`}
          >
            <motion.span
              layout
              className="absolute top-1 h-5 w-5 rounded-full bg-white"
              style={{ left: schedule.enabled ? 26 : 4 }}
            />
          </button>
        </div>

        {schedule.enabled && (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-sm text-white/70">
              Day
              <select
                value={schedule.dayOfWeek}
                onChange={(e) =>
                  setSchedule({ ...schedule, dayOfWeek: Number(e.target.value) })
                }
                className="glass mt-1 w-full rounded-xl bg-transparent px-3 py-2 text-white outline-none"
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i} className="bg-[#1A1440]">
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-white/70">
              Time (IST)
              <select
                value={schedule.hourIst}
                onChange={(e) => setSchedule({ ...schedule, hourIst: Number(e.target.value) })}
                className="glass mt-1 w-full rounded-xl bg-transparent px-3 py-2 text-white outline-none"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h} className="bg-[#1A1440]">
                    {hourLabel(h)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => void persist(schedule)}
              disabled={busy}
              className="btn-neon btn-neon-hover inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        )}

        {schedule.lastRunAt && (
          <div className="text-xs text-white/50">
            Last automatic run: {new Date(schedule.lastRunAt).toLocaleString()}
            {schedule.lastStatus ? ` · ${schedule.lastStatus}` : ""}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
