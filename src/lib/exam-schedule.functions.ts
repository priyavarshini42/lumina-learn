import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ExamSchedule = {
  enabled: boolean;
  dayOfWeek: number;
  hourIst: number;
  lastRunAt: string | null;
  lastStatus: string | null;
};

const DEFAULT_SCHEDULE: ExamSchedule = {
  enabled: false,
  dayOfWeek: 6,
  hourIst: 8,
  lastRunAt: null,
  lastStatus: null,
};

const SELECT = "enabled, day_of_week, hour_ist, last_run_at, last_status";

export const getExamSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExamSchedule> => {
    const { data, error } = await context.supabase
      .from("exam_schedules")
      .select(SELECT)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return DEFAULT_SCHEDULE;
    return {
      enabled: data.enabled,
      dayOfWeek: data.day_of_week,
      hourIst: data.hour_ist,
      lastRunAt: data.last_run_at,
      lastStatus: data.last_status,
    };
  });

export const saveExamSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { enabled: boolean; dayOfWeek: number; hourIst: number }) => ({
    enabled: input.enabled,
    dayOfWeek: Math.min(6, Math.max(0, Math.round(input.dayOfWeek))),
    hourIst: Math.min(23, Math.max(0, Math.round(input.hourIst))),
  }))
  .handler(async ({ data, context }): Promise<ExamSchedule> => {
    const { data: saved, error } = await context.supabase
      .from("exam_schedules")
      .upsert(
        {
          user_id: context.userId,
          enabled: data.enabled,
          day_of_week: data.dayOfWeek,
          hour_ist: data.hourIst,
        },
        { onConflict: "user_id" },
      )
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return {
      enabled: saved.enabled,
      dayOfWeek: saved.day_of_week,
      hourIst: saved.hour_ist,
      lastRunAt: saved.last_run_at,
      lastStatus: saved.last_status,
    };
  });
