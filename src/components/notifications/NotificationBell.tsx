import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Bell, BookOpen, CheckCheck, Flame, Trophy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Notification = Tables<"notifications">;

const ICONS = {
  homework: BookOpen,
  quiz: Trophy,
  streak: Flame,
} as const;

function iconFor(kind: string) {
  return ICONS[kind as keyof typeof ICONS] ?? Bell;
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Live notification bell: streams homework, quiz and streak alerts for the signed-in user. */
export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  const load = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) {
      data.forEach((n) => seen.current.add(n.id));
      setItems(data);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      seen.current.clear();
      return;
    }
    void load(user.id);

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as Notification | undefined;
          if (!row) return;
          setItems((prev) => [row, ...prev.filter((n) => n.id !== row.id)].slice(0, 30));
          if (payload.eventType === "INSERT" && !seen.current.has(row.id)) {
            seen.current.add(row.id);
            toast(row.title, { description: row.body });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", user.id)
      .eq("read", false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4FD9] px-1 text-[10px] font-bold text-white shadow-[0_0_12px_#FF4FD9]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="glass-strong absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] rounded-2xl p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-2">
              <span className="text-sm font-semibold text-white">Notifications</span>
              <span className="flex items-center gap-1">
                <button
                  onClick={() => void markAllRead()}
                  disabled={unread === 0}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/60 hover:text-white disabled:opacity-40"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="rounded-lg p-1 text-white/50 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-white/50">
                  No alerts yet. Homework due dates, quiz scores and streak milestones appear here
                  instantly.
                </p>
              )}
              {items.map((n) => {
                const Icon = iconFor(n.kind);
                return (
                  <div
                    key={n.id}
                    className={`glass flex gap-3 rounded-xl p-3 ${n.read ? "opacity-60" : ""}`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4FD9]" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{n.title}</div>
                      <p className="mt-0.5 text-xs text-white/70">{n.body}</p>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
