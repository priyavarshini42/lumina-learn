import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import {
  examQuestionSchema,
  groupBreakdown,
  type ExamQuestion,
  type ExamRecord,
  type ExamResult,
} from "./exam-types";

/** Monday of the current week, ISO date. */
function weekStartISO(): string {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function parseQuestions(value: unknown): ExamQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((q) => {
    const parsed = examQuestionSchema.safeParse(q);
    return parsed.success ? [parsed.data] : [];
  });
}

function toRecord(row: {
  id: string;
  week_start: string;
  title: string;
  language: string;
  status: string;
  questions: Json;
  answers: Json;
  score: number | null;
  report: Json;
}): ExamRecord {
  return {
    id: row.id,
    weekStart: row.week_start,
    title: row.title,
    language: row.language,
    status: row.status,
    questions: parseQuestions(row.questions),
    answers: Array.isArray(row.answers) ? (row.answers as number[]) : null,
    score: row.score === null ? null : Number(row.score),
    result: (row.report as unknown as ExamResult | null) ?? null,
  };
}

const SELECT = "id, week_start, title, language, status, questions, answers, score, report";

/** Current week's exam (if already generated) plus recent history. */
export const getExamState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ weekStart: string; current: ExamRecord | null; history: ExamRecord[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("exams")
      .select(SELECT)
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);

    const weekStart = weekStartISO();
    const rows = (data ?? []).map(toRecord);
    return {
      weekStart,
      current: rows.find((r) => r.weekStart === weekStart) ?? null,
      history: rows.filter((r) => r.status === "submitted"),
    };
  });

type GenerateInput = {
  studentName: string;
  grade: string;
  language: string;
  medium: string;
  regenerate?: boolean;
};

export const generateWeeklyExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: GenerateInput) => input)
  .handler(async ({ data, context }): Promise<ExamRecord> => {
    const { ensureWeeklyExam } = await import("./exam-run.server");
    const { row } = await ensureWeeklyExam(context.supabase, context.userId, data);
    return toRecord(row);
  });


export const submitExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { examId: string; answers: number[] }) => input)
  .handler(async ({ data, context }): Promise<ExamResult> => {
    const { supabase, userId } = context;
    const { data: row, error: readError } = await supabase
      .from("exams")
      .select("id, grade, language, questions")
      .eq("id", data.examId)
      .eq("user_id", userId)
      .single();
    if (readError) throw new Error(readError.message);

    const questions = parseQuestions(row.questions);
    if (questions.length === 0) throw new Error("This exam paper is no longer available.");

    const answers = questions.map((_q, i) => (typeof data.answers[i] === "number" ? data.answers[i]! : -1));
    const score = questions.reduce((s, q, i) => (answers[i] === q.correctIndex ? s + 1 : s), 0);
    const percent = Math.round((score / questions.length) * 100);

    const { generateExamAnalysis } = await import("./exam.server");
    const analysis = await generateExamAnalysis({
      grade: row.grade,
      language: row.language,
      score,
      total: questions.length,
      percent,
      items: questions.map((q, i) => ({
        question: q.question,
        topic: q.topic,
        chapter: q.chapter,
        difficulty: q.difficulty,
        correct: answers[i] === q.correctIndex,
      })),
    });

    const result: ExamResult = {
      score,
      total: questions.length,
      percent,
      topics: groupBreakdown(questions, answers, (q) => q.topic),
      chapters: groupBreakdown(questions, answers, (q) => q.chapter),
      difficulty: groupBreakdown(questions, answers, (q) => q.difficulty),
      analysis,
    };

    const { error } = await supabase
      .from("exams")
      .update({
        answers: answers as unknown as Json,
        score: percent,
        report: result as unknown as Json,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", data.examId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return result;
  });
