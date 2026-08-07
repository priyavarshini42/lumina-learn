import { useEffect, useState } from "react";
import { BookOpen, Flame, Loader2, Trophy, BellRing } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/Section";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Prefs = {
  homework_enabled: boolean;
  quiz_enabled: boolean;
  streak_enabled: boolean;
};

const ROWS = [
  {
    key: "homework_enabled" as const,
    icon: BookOpen,
    label: "Homework alerts",
    hint: "New assignments, due-date changes and evaluation results.",
  },
  {
    key: "quiz_enabled" as const,
    icon: Trophy,
    label: "Quiz score alerts",
    hint: "Every time a quiz score is recorded or updated.",
  },
  {
    key: "streak_enabled" as const,
    icon: Flame,
    label: "Streak milestones",
    hint: "Celebrations at 3, 7, 14, 30, 50 and 100 days.",
  },
];

/** Per-user switches to mute or enable homework, quiz and streak notifications. */
export function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("homework_enabled, quiz_enabled, streak_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setPrefs(data ?? { homework_enabled: true, quiz_enabled: true, streak_enabled: true });
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const toggle = async (key: keyof Prefs) => {
    if (!user || !prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(key);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    setSaving(null);
    if (error) {
      setPrefs(prefs);
      toast.error("Could not save that preference. Please try again.");
    } else {
      toast.success(next[key] ? "Alerts enabled" : "Alerts muted");
    }
  };

  if (!user) return null;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-[#FF4FD9]" />
        <h3 className="font-heading text-lg font-semibold text-white">Notification preferences</h3>
      </div>
      <p className="mt-1 text-xs text-white/55">
        Mute or enable each alert type. Muted types stop arriving in your bell and as pop-ups.
      </p>

      <div className="mt-5 space-y-3">
        {prefs === null && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your preferences…
          </div>
        )}
        {prefs !== null &&
          ROWS.map(({ key, icon: Icon, label, hint }) => {
            const on = prefs[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex min-w-0 gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4FD9]" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{label}</div>
                    <p className="mt-0.5 text-xs text-white/55">{hint}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${label}: ${on ? "enabled" : "muted"}`}
                  disabled={saving === key}
                  onClick={() => void toggle(key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
                    on ? "bg-[#FF4FD9] shadow-[0_0_14px_#FF4FD9aa]" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      on ? "left-[1.375rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
      </div>
    </GlassCard>
  );
}
