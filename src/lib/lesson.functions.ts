import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateLessonContent, evaluateHomeworkContent } from "./lesson.server";
import type { Lesson, HomeworkReport } from "./classroom-types";
import type { Json } from "@/integrations/supabase/types";

type StartInput = {
  subject: string;
  chapterId: string | null;
  chapterTitle: string;
  chapterNumber: number;
  previousChapterTitle: string | null;
  grade: string;
  medium: string;
  language: string;
  learningSpeed: string;
  dailyMinutes: number;
  studentName: string;
};

export const startLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StartInput) => input)
  .handler(async ({ data, context }): Promise<{ sessionId: string; lesson: Lesson }> => {
    const lesson = await generateLessonContent({
      studentName: data.studentName,
      grade: data.grade,
      medium: data.medium,
      language: data.language,
      learningSpeed: data.learningSpeed,
      dailyMinutes: data.dailyMinutes,
      subject: data.subject,
      chapterTitle: data.chapterTitle,
      chapterNumber: data.chapterNumber,
      previousChapterTitle: data.previousChapterTitle,
    });

    const { supabase, userId } = context;
    const { data: session, error } = await supabase
      .from("lesson_sessions")
      .insert({
        user_id: userId,
        chapter_id: data.chapterId,
        chapter_title: data.chapterTitle,
        lesson: lesson as unknown as Json,
        language: data.language,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.chapterId) {
      await supabase
        .from("chapter_progress")
        .upsert(
          { user_id: userId, chapter_id: data.chapterId, status: "in_progress" },
          { onConflict: "user_id,chapter_id" },
        );
    }

    await supabase.from("homework").insert({
      user_id: userId,
      session_id: session.id,
      chapter_title: data.chapterTitle,
      questions: lesson.homework as unknown as Json,
    });

    await supabase
      .from("study_attendance")
      .upsert(
        { user_id: userId, minutes: data.dailyMinutes },
        { onConflict: "user_id,study_date" },
      );

    return { sessionId: session.id, lesson };
  });

export const saveLessonStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; step: number }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("lesson_sessions")
      .update({ current_step: data.step })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { sessionId: string; chapterId: string | null; quizScore: number }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("lesson_sessions")
      .update({ completed: true, quiz_score: data.quizScore })
      .eq("id", data.sessionId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    if (data.chapterId) {
      await supabase
        .from("chapter_progress")
        .upsert(
          {
            user_id: userId,
            chapter_id: data.chapterId,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,chapter_id" },
        );
    }
    return { ok: true };
  });

export const submitHomework = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      sessionId: string;
      chapterTitle: string;
      grade: string;
      language: string;
      submissions: { question: string; answer: string }[];
    }) => input,
  )
  .handler(async ({ data, context }): Promise<HomeworkReport> => {
    const report = await evaluateHomeworkContent({
      chapterTitle: data.chapterTitle,
      grade: data.grade,
      language: data.language,
      submissions: data.submissions,
    });

    const accuracy = report.total > 0 ? (report.score / report.total) * 100 : 0;
    await context.supabase
      .from("homework")
      .update({
        answers: data.submissions as unknown as Json,
        score: Number(accuracy.toFixed(2)),
        report: report as unknown as Json,
        status: "evaluated",
      })
      .eq("session_id", data.sessionId)
      .eq("user_id", context.userId);

    return report;
  });

export const savePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      medium: string;
      learningSpeed: string;
      dailyMinutes: number;
      voiceLanguage: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("learning_preferences").upsert(
      {
        user_id: context.userId,
        medium: data.medium,
        learning_speed: data.learningSpeed,
        daily_minutes: data.dailyMinutes,
        voice_language: data.voiceLanguage,
        onboarded: true,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
