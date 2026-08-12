import { createFileRoute } from "@tanstack/react-router";

/**
 * Weekly exam auto-generation. Called hourly by the scheduled job.
 * Generates this week's paper for every student whose schedule matches
 * the current IST weekday + hour and who has not been run this week yet.
 */
export const Route = createFileRoute("/api/public/hooks/generate-weekly-exams")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        const allowed = [
          process.env["SUPABASE_PUBLISHABLE_KEY"],
          process.env["SUPABASE_ANON_KEY"],
        ].filter((k): k is string => Boolean(k));
        if (!apiKey || !allowed.includes(apiKey)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }


        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { ensureWeeklyExam, serverEducationLabel, weekStartISO } = await import(
          "@/lib/exam-run.server"
        );

        // Current IST weekday/hour (UTC + 5:30).
        const ist = new Date(Date.now() + 5.5 * 3600000);
        const weekday = ist.getUTCDay();
        const hour = ist.getUTCHours();
        const weekStart = weekStartISO();

        const { data: schedules, error } = await supabaseAdmin
          .from("exam_schedules")
          .select("user_id, last_run_at")
          .eq("enabled", true)
          .eq("day_of_week", weekday)
          .eq("hour_ist", hour);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let generated = 0;
        let skipped = 0;

        for (const s of schedules ?? []) {
          try {
            const { data: existing } = await supabaseAdmin
              .from("exams")
              .select("id")
              .eq("user_id", s.user_id)
              .eq("week_start", weekStart)
              .maybeSingle();
            if (existing) {
              skipped += 1;
              continue;
            }

            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("full_name, preferred_language, education_type, grade_number, inter_year, stream")
              .eq("id", s.user_id)
              .maybeSingle();
            if (!profile) {
              skipped += 1;
              continue;
            }

            const { data: prefs } = await supabaseAdmin
              .from("learning_preferences")
              .select("medium")
              .eq("user_id", s.user_id)
              .maybeSingle();

            await ensureWeeklyExam(supabaseAdmin, s.user_id, {
              studentName: profile.full_name,
              grade: serverEducationLabel(profile),
              language: profile.preferred_language,
              medium: prefs?.medium ?? "English",
            });

            await supabaseAdmin
              .from("exam_schedules")
              .update({ last_run_at: new Date().toISOString(), last_status: "generated" })
              .eq("user_id", s.user_id);
            generated += 1;
          } catch (e) {
            await supabaseAdmin
              .from("exam_schedules")
              .update({
                last_run_at: new Date().toISOString(),
                last_status: `failed: ${(e as Error).message}`.slice(0, 200),
              })
              .eq("user_id", s.user_id);
          }
        }

        return Response.json({ success: true, weekStart, weekday, hour, generated, skipped });
      },
    },
  },
});
