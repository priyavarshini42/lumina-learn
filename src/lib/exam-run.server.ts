import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { generateExamPaper } from "./exam.server";

export const EXAM_SELECT =
  "id, week_start, title, language, status, questions, answers, score, report";

export type ExamRow = {
  id: string;
  week_start: string;
  title: string;
  language: string;
  status: string;
  questions: Json;
  answers: Json;
  score: number | null;
  report: Json;
};

/** Monday of the current week, ISO date. */
export function weekStartISO(): string {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export type EnsureExamOptions = {
  studentName: string;
  grade: string;
  language: string;
  medium: string;
  regenerate?: boolean;
};

/**
 * Creates (or returns) the current week's exam for a student.
 * Works with any Supabase client: the user-scoped one from the auth middleware
 * or the admin client used by the weekly scheduler.
 */
export async function ensureWeeklyExam(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts: EnsureExamOptions,
): Promise<{ row: ExamRow; created: boolean }> {
  const weekStart = weekStartISO();

  const { data: existing } = await supabase
    .from("exams")
    .select(EXAM_SELECT)
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existing && !opts.regenerate) return { row: existing as ExamRow, created: false };

  const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
  const [{ data: sessions }, { data: homework }] = await Promise.all([
    supabase
      .from("lesson_sessions")
      .select("chapter_title, session_date")
      .eq("user_id", userId)
      .gte("session_date", since)
      .order("session_date", { ascending: false })
      .limit(20),
    supabase
      .from("homework")
      .select("report")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const chapters = Array.from(new Set((sessions ?? []).map((s) => s.chapter_title))).slice(0, 6);
  const weakTopics = Array.from(
    new Set(
      (homework ?? []).flatMap((h) => {
        const report = h.report as { weakTopics?: unknown } | null;
        const list = Array.isArray(report?.weakTopics) ? report.weakTopics : [];
        return list.filter((t): t is string => typeof t === "string");
      }),
    ),
  ).slice(0, 6);

  const paper = await generateExamPaper({
    studentName: opts.studentName,
    grade: opts.grade,
    language: opts.language,
    medium: opts.medium,
    chapters,
    weakTopics,
    weekStart,
  });

  const { data: saved, error } = await supabase
    .from("exams")
    .upsert(
      {
        user_id: userId,
        week_start: weekStart,
        title: paper.title,
        grade: opts.grade,
        language: opts.language,
        chapters: chapters as unknown as Json,
        questions: paper.questions as unknown as Json,
        answers: null,
        score: null,
        report: null,
        status: "generated",
        submitted_at: null,
      },
      { onConflict: "user_id,week_start" },
    )
    .select(EXAM_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return { row: saved as ExamRow, created: true };
}
