import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateParentRecommendations, type ParentRecommendations } from "./parent.server";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function gradeLabel(p: {
  education_type: string;
  grade_number: number | null;
  inter_year: string | null;
  stream: string | null;
}) {
  if (p.education_type === "school") return `Grade ${p.grade_number ?? "-"}`;
  return `Intermediate ${p.inter_year === "first" ? "1st Year" : "2nd Year"} · ${p.stream ?? ""}`;
}

/** Consecutive-day streak ending today or yesterday. */
function computeStreak(dates: string[]): number {
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

export type ChildSummary = {
  studentId: string;
  fullName: string;
  username: string;
  gradeLabel: string;
  approved: boolean;
  relation: string;
};

export const listChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChildSummary[]> => {
    const { supabase, userId } = context;
    const { data: links, error } = await supabase
      .from("parent_student_links")
      .select("student_id, relation, approved")
      .eq("parent_id", userId);
    if (error) throw new Error(error.message);
    if (!links?.length) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, education_type, grade_number, inter_year, stream")
      .in(
        "id",
        links.map((l) => l.student_id),
      );

    return links.map((l) => {
      const p = profiles?.find((x) => x.id === l.student_id);
      return {
        studentId: l.student_id,
        fullName: p?.full_name ?? "Pending approval",
        username: p?.username ?? "—",
        gradeLabel: p ? gradeLabel(p) : "",
        approved: l.approved,
        relation: l.relation,
      };
    });
  });

export const requestChildLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { username: string; relation: string }) => ({
    username: input.username.trim().toLowerCase(),
    relation: input.relation || "guardian",
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .maybeSingle();
    if (!student) throw new Error("No student found with that username.");
    if (student.id === context.userId) throw new Error("You cannot link your own account.");

    const { error } = await context.supabase.from("parent_student_links").insert({
      parent_id: context.userId,
      student_id: student.id,
      relation: data.relation,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const listParentRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("parent_student_links")
      .select("parent_id, relation, approved, created_at")
      .eq("student_id", context.userId)
      .eq("approved", false);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const approveParentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { parentId: string; approve: boolean }) => input)
  .handler(async ({ data, context }) => {
    if (!data.approve) {
      const { error } = await context.supabase
        .from("parent_student_links")
        .delete()
        .eq("parent_id", data.parentId)
        .eq("student_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase
      .from("parent_student_links")
      .update({ approved: true })
      .eq("parent_id", data.parentId)
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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

export const getChildDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId: string }) => input)
  .handler(async ({ data, context }): Promise<ChildDashboard> => {
    const { supabase } = context;
    const studentId = data.studentId;
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
          const list = Array.isArray(report?.weakTopics) ? report?.weakTopics : [];
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
        minutesThisWeek: att
          .filter((a) => a.date >= sinceWeek)
          .reduce((sum, a) => sum + a.minutes, 0),
        minutesThisMonth: att
          .filter((a) => a.date >= sinceMonth)
          .reduce((sum, a) => sum + a.minutes, 0),
        chaptersCompleted: (sessions ?? []).filter((s) => s.completed).length,
        averageQuizScore: quizzes.length
          ? Number((quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length).toFixed(1))
          : null,
        averageHomeworkScore: gradedHomework.length
          ? Number(
              (
                gradedHomework.reduce((s, h) => s + Number(h.score ?? 0), 0) /
                gradedHomework.length
              ).toFixed(1),
            )
          : null,
        homeworkPending: (homework ?? []).filter((h) => h.status !== "evaluated").length,
      },
      weakTopics,
    };
  });

export const getChildRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId: string }) => input)
  .handler(async ({ data, context }): Promise<ParentRecommendations> => {
    const dashboard = await getChildDashboard({ data: { studentId: data.studentId } });
    void context;
    return generateParentRecommendations({
      studentName: dashboard.child.fullName,
      grade: dashboard.child.gradeLabel,
      language: dashboard.child.language,
      chaptersCompleted: dashboard.stats.chaptersCompleted,
      averageQuizScore: dashboard.stats.averageQuizScore,
      averageHomeworkScore: dashboard.stats.averageHomeworkScore,
      minutesThisWeek: dashboard.stats.minutesThisWeek,
      streakDays: dashboard.stats.streakDays,
      weakTopics: dashboard.weakTopics,
      recentChapters: dashboard.quizzes.map((q) => q.chapterTitle).slice(-5),
    });
  });
