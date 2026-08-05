import { streamText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  lessonSchema,
  homeworkReportSchema,
  type Lesson,
  type HomeworkReport,
} from "./classroom-types";

const MODEL = "google/gemini-3.6-flash";

export type LessonRequest = {
  studentName: string;
  grade: string;
  medium: string;
  language: string;
  learningSpeed: string;
  dailyMinutes: number;
  subject: string;
  chapterTitle: string;
  chapterNumber: number;
  previousChapterTitle: string | null;
};

function languageInstruction(language: string, medium: string) {
  if (language === "te" || medium.toLowerCase().includes("telugu")) {
    return "Write all explanations in simple Telugu (Telugu script) with English technical terms in brackets.";
  }
  if (language !== "en") {
    return `Write all explanations in the student's language (ISO code "${language}"), keeping English technical terms in brackets.`;
  }
  return "Write in simple, clear Indian-English suitable for a rural student.";
}

export function buildLessonPrompt(req: LessonRequest) {
  return `You are an experienced Andhra Pradesh State Board teacher taking today's live class.

Student: ${req.studentName}
Class/Grade: ${req.grade}
Medium: ${req.medium}
Learning speed: ${req.learningSpeed}
Daily study time: ${req.dailyMinutes} minutes
Subject: ${req.subject}
Today's chapter: Chapter ${req.chapterNumber} — ${req.chapterTitle}
Previous chapter (for revision questions): ${req.previousChapterTitle ?? "none, this is the first chapter"}

Rules:
- Follow the AP State Board syllabus and textbook for ${req.grade} strictly. Do NOT teach content from other chapters.
- Teach exactly this one chapter, split into 4-6 teachable topics that fit ${req.dailyMinutes} minutes.
- ${languageInstruction(req.language, req.medium)}
- Every topic: a classroom-style spoken explanation (4-8 sentences, first person, warm), a real-life village/daily-life example, a tiny story, and a described diagram.
- Add a small table only where it genuinely helps (otherwise null).
- Revision: exactly 5 MCQs from the previous chapter (or from basics if none).
- Quiz: exactly 5 MCQs from today's chapter, gradually harder.
- Assignment: 8-10 items mixing fill in the blanks, MCQ, true/false, match the following, short answer, long answer, HOTS, activity-based and diagram practice, tagged easy/medium/hard.
- Homework: about 30 minutes total — MCQs, short questions, long questions, one real-life activity, one practical observation.
- Difficulty must match learning speed "${req.learningSpeed}".
- Encouraging, never scolding.`;
}

export function buildEvaluationPrompt(input: {
  chapterTitle: string;
  grade: string;
  language: string;
  submissions: { question: string; answer: string }[];
}) {
  return `You are an AP State Board teacher grading homework for a ${input.grade} student on the chapter "${input.chapterTitle}".
Grade fairly and kindly. Award partial marks. Each question is worth 1 mark unless it clearly asks for a long answer (then 2 marks).
Explain mistakes simply and suggest what to revise. Reply in the student's language (code "${input.language}").

Submissions:
${input.submissions
  .map((s, i) => `${i + 1}. Q: ${s.question}\n   Student answer: ${s.answer || "(left blank)"}`)
  .join("\n")}`;
}

export async function generateLessonContent(req: LessonRequest): Promise<Lesson> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const gateway = createLovableAiGatewayProvider(key);

  try {
    const result = streamText({
      model: gateway(MODEL),
      output: Output.object({ schema: lessonSchema }),
      prompt: buildLessonPrompt(req),
    });
    return (await result.output) as Lesson;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("Could not prepare today's lesson. Please try again.");
    }
    throw error;
  }
}

export async function evaluateHomeworkContent(input: {
  chapterTitle: string;
  grade: string;
  language: string;
  submissions: { question: string; answer: string }[];
}): Promise<HomeworkReport> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const gateway = createLovableAiGatewayProvider(key);

  try {
    const result = streamText({
      model: gateway(MODEL),
      output: Output.object({ schema: homeworkReportSchema }),
      prompt: buildEvaluationPrompt(input),
    });
    return (await result.output) as HomeworkReport;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("Could not evaluate the homework. Please try again.");
    }
    throw error;
  }
}
