import { streamText } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const MODEL = "google/gemini-3.6-flash";

export const parentRecommendationsSchema = z.object({
  weekly: z.array(z.string()),
  monthly: z.array(z.string()),
  focusTopics: z.array(z.string()),
  parentNote: z.string(),
});

export type ParentRecommendations = z.infer<typeof parentRecommendationsSchema>;

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "```").trim();
  const fenced = cleaned.match(/```([\s\S]*?)```/);
  const body = fenced?.[1] ?? cleaned;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("The AI mentor returned an unexpected answer.");
  return JSON.parse(body.slice(start, end + 1));
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function gradeLabel(p: {
  education_type: string;
  grade_number: number | null;
  inter_year: string | null;
  stream: string | null;
}) {
  if (p.education_type === "school") return `Grade ${p.grade_number ?? "-"}`;
  return `Intermediate ${p.inter_year === "first" ? "1st Year" : "2nd Year"} · ${p.stream ?? ""}`;
}

/** Consecutive-day streak ending today or yesterday. */
export function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type ChildDashboard = {
  child: { fullName: string; username: string; gradeLabel: string; language: string };
  today: {
    date: string;
    lesson: {
      chapterTitle: string;
      completed: boolean;
      currentStep: number;
      quizScore: number | null;
    } | null;
    minutes: number;
  };
  homework: {
    id: string;
    chapterTitle: string;
    status: string;
    dueDate: string;
    score: number | null;
    teacherRemark: string | null;
  }[];
  quizzes: { chapterTitle: string; score: number; date: string }[];
  attendance: { date: string; minutes: number }[];
  stats: {
    streakDays: number;
    minutesThisWeek: number;
    minutesThisMonth: number;
    chaptersCompleted: number;
    averageQuizScore: number | null;
    averageHomeworkScore: number | null;
    homeworkPending: number;
  };
  weakTopics: string[];
};

/** Reads one child's learning data. RLS lets approved linked parents (and the student) read it. */
export async function loadChildDashboard(
  supabase: SupabaseClient<Database>,
  studentId: string,
): Promise<ChildDashboard> {
  const today = todayISO();

  const [{ data: profile }, { data: sessions }, { data: homework }, { data: attendance }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, username, education_type, grade_number, inter_year, stream, preferred_language",
        )
        .eq("id", studentId)
        .maybeSingle(),
      supabase
        .from("lesson_sessions")
        .select("chapter_title, completed, current_step, quiz_score, session_date")
        .eq("user_id", studentId)
        .order("session_date", { ascending: false })
        .limit(40),
      supabase
        .from("homework")
        .select("id, chapter_title, status, due_date, score, report, created_at")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("study_attendance")
        .select("study_date, minutes")
        .eq("user_id", studentId)
        .order("study_date", { ascending: false })
        .limit(60),
    ]);

  if (!profile) throw new Error("You do not have access to this student yet.");

  const att = (attendance ?? []).map((a) => ({ date: a.study_date, minutes: a.minutes }));
  const dayMs = 86400000;
  const sinceWeek = new Date(Date.now() - 6 * dayMs).toISOString().slice(0, 10);
  const sinceMonth = new Date(Date.now() - 29 * dayMs).toISOString().slice(0, 10);

  const quizzes = (sessions ?? [])
    .filter((s) => s.quiz_score !== null)
    .map((s) => ({
      chapterTitle: s.chapter_title,
      score: s.quiz_score as number,
      date: s.session_date,
    }));

  const gradedHomework = (homework ?? []).filter((h) => h.score !== null);
  const weakTopics = Array.from(
    new Set(
      (homework ?? []).flatMap((h) => {
        const report = h.report as { weakTopics?: unknown } | null;
        const list = Array.isArray(report?.weakTopics) ? report.weakTopics : [];
        return list.filter((t): t is string => typeof t === "string");
      }),
    ),
  ).slice(0, 8);

  const todaySession = (sessions ?? []).find((s) => s.session_date === today) ?? null;

  return {
    child: {
      fullName: profile.full_name,
      username: profile.username,
      gradeLabel: gradeLabel(profile),
      language: profile.preferred_language,
    },
    today: {
      date: today,
      lesson: todaySession
        ? {
            chapterTitle: todaySession.chapter_title,
            completed: todaySession.completed,
            currentStep: todaySession.current_step,
            quizScore: todaySession.quiz_score,
          }
        : null,
      minutes: att.find((a) => a.date === today)?.minutes ?? 0,
    },
    homework: (homework ?? []).map((h) => {
      const report = h.report as { teacherRemark?: unknown } | null;
      return {
        id: h.id,
        chapterTitle: h.chapter_title,
        status: h.status,
        dueDate: h.due_date,
        score: h.score,
        teacherRemark: typeof report?.teacherRemark === "string" ? report.teacherRemark : null,
      };
    }),
    quizzes: quizzes.slice(0, 10).reverse(),
    attendance: att.slice(0, 30).reverse(),
    stats: {
      streakDays: computeStreak(att.filter((a) => a.minutes > 0).map((a) => a.date)),
      minutesThisWeek: att.filter((a) => a.date >= sinceWeek).reduce((s, a) => s + a.minutes, 0),
      minutesThisMonth: att.filter((a) => a.date >= sinceMonth).reduce((s, a) => s + a.minutes, 0),
      chaptersCompleted: (sessions ?? []).filter((s) => s.completed).length,
      averageQuizScore: quizzes.length
        ? Number((quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length).toFixed(1))
        : null,
      averageHomeworkScore: gradedHomework.length
        ? Number(
            (
              gradedHomework.reduce((s, h) => s + Number(h.score ?? 0), 0) / gradedHomework.length
            ).toFixed(1),
          )
        : null,
      homeworkPending: (homework ?? []).filter((h) => h.status !== "evaluated").length,
    },
    weakTopics,
  };
}

export async function generateParentRecommendations(
  dashboard: ChildDashboard,
): Promise<ParentRecommendations> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");

  const prompt = `You advise the parent of a rural Indian student learning with an AI teacher.

Student: ${dashboard.child.fullName}
Class/Grade: ${dashboard.child.gradeLabel}
Chapters completed: ${dashboard.stats.chaptersCompleted}
Average quiz score (out of 5): ${dashboard.stats.averageQuizScore ?? "no quizzes yet"}
Average homework score (%): ${dashboard.stats.averageHomeworkScore ?? "no homework graded yet"}
Study minutes this week: ${dashboard.stats.minutesThisWeek}
Study minutes this month: ${dashboard.stats.minutesThisMonth}
Current streak: ${dashboard.stats.streakDays} days
Pending homework: ${dashboard.stats.homeworkPending}
Weak topics: ${dashboard.weakTopics.join(", ") || "none recorded"}
Recent chapters: ${dashboard.quizzes.map((q) => q.chapterTitle).slice(-5).join(", ") || "none yet"}

Write practical guidance for the PARENT (not the student), in the language with ISO code "${dashboard.child.language}" (keep subject terms in English brackets).
Return JSON exactly: {"weekly": [4 short actions for the coming week], "monthly": [4 short goals for the coming month], "focusTopics": [up to 4 topics to revise], "parentNote": "3-4 warm sentences summarising progress and what to encourage"}.
Keep every item under 18 words, concrete and doable at home with low resources.`;

  const gateway = createLovableAiGatewayProvider(key);
  const result = streamText({
    model: gateway(MODEL),
    system:
      "Reply with a single valid JSON object only. No markdown fences, no commentary, no trailing text.",
    prompt,
  });
  return parentRecommendationsSchema.parse(extractJson(await result.text));
}
