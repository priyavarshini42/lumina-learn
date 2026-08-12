import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarClock, Loader2, Save, Timer } from "lucide-react";
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

const IST_OFFSET_MS = 5.5 * 3600000;

/** Next moment the scheduler will run for this day/hour (IST), as an absolute Date. */
function nextRunAt(dayOfWeek: number, hourIst: number, from: number = Date.now()): Date {
  const ist = new Date(from + IST_OFFSET_MS);
  let daysAhead = (dayOfWeek - ist.getUTCDay() + 7) % 7;
  if (daysAhead === 0 && hourIst <= ist.getUTCHours()) daysAhead = 7;
  const target = Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate() + daysAhead,
    hourIst,
    0,
    0,
    0,
  );
  return new Date(target - IST_OFFSET_MS);
}

function countdownLabel(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function NextRun({ dayOfWeek, hourIst }: { dayOfWeek: number; hourIst: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = nextRunAt(dayOfWeek, hourIst, now);
  const stamp = next.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
          <Timer className="h-3 w-3" /> Next generation run
        </div>
        <div className="mt-1 text-sm font-medium text-white">{stamp} IST</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-lg font-semibold text-[#FF4FD9]">
          {countdownLabel(next.getTime() - now)}
        </div>
        <div className="text-[11px] text-white/45">from now</div>
      </div>
    </div>
  );
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

        {schedule.enabled && (
          <NextRun dayOfWeek={schedule.dayOfWeek} hourIst={schedule.hourIst} />
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
