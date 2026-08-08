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
    const { supabase, userId } = context;
    const weekStart = weekStartISO();

    const { data: existing } = await supabase
      .from("exams")
      .select(SELECT)
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();
    if (existing && !data.regenerate) return toRecord(existing);


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

    const { generateExamPaper } = await import("./exam.server");
    const paper = await generateExamPaper({
      studentName: data.studentName,
      grade: data.grade,
      language: data.language,
      medium: data.medium,
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
          grade: data.grade,
          language: data.language,
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
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toRecord(saved);
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
