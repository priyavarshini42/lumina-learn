import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Kind = "homework" | "quiz" | "streak";

const PREF_COLUMN: Record<Kind, "homework_enabled" | "quiz_enabled" | "streak_enabled"> = {
  homework: "homework_enabled",
  quiz: "quiz_enabled",
  streak: "streak_enabled",
};

const SAMPLE: Record<Kind, { title: string; body: string }> = {
  homework: {
    title: "Test homework alert",
    body: "This is a test homework notification. Your homework alerts are working.",
  },
  quiz: {
    title: "Test quiz alert",
    body: "This is a test quiz notification. Your quiz score alerts are working.",
  },
  streak: {
    title: "Test streak alert",
    body: "This is a test streak notification. Your streak milestone alerts are working.",
  },
};

/** Sends a test notification to the signed-in user, honouring their notification preferences. */
export const sendTestNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { kind: Kind }) => {
    if (!["homework", "quiz", "streak"].includes(input.kind)) throw new Error("Unknown alert type.");
    return { kind: input.kind };
  })
  .handler(async ({ data, context }): Promise<{ sent: boolean }> => {
    const { supabase, userId } = context;

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("homework_enabled, quiz_enabled, streak_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    const enabled = prefs ? prefs[PREF_COLUMN[data.kind]] !== false : true;
    if (!enabled) return { sent: false };

    const sample = SAMPLE[data.kind];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("notifications").insert({
      recipient_id: userId,
      student_id: userId,
      kind: data.kind,
      title: sample.title,
      body: sample.body,
      href: "/profile",
      meta: { test: true },
    });
    if (error) throw new Error(error.message);
    return { sent: true };
  });
