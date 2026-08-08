import { streamText } from "ai";
import type { ZodType } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  examPaperSchema,
  examAnalysisSchema,
  type ExamPaper,
  type ExamAnalysis,
} from "./exam-types";

const MODEL = "google/gemini-3.6-flash";

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "```").trim();
  const fenced = cleaned.match(/```([\s\S]*?)```/);
  const body = fenced?.[1] ?? cleaned;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("The AI examiner returned an unexpected answer.");
  return JSON.parse(body.slice(start, end + 1));
}

async function generateStructured<T>(schema: ZodType<T>, prompt: string): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const gateway = createLovableAiGatewayProvider(key);
  const result = streamText({
    model: gateway(MODEL),
    system:
      "Reply with a single valid JSON object only. No markdown fences, no commentary, no trailing text.",
    prompt,
  });
  return schema.parse(extractJson(await result.text));
}

export type ExamRequest = {
  studentName: string;
  grade: string;
  language: string;
  medium: string;
  chapters: string[];
  weakTopics: string[];
  weekStart: string;
};

export function buildExamPrompt(req: ExamRequest) {
  return `You are an Andhra Pradesh State Board teacher preparing this week's weekend test for a rural student.

Student: ${req.studentName}
Class/Grade: ${req.grade}
Medium: ${req.medium}
Week starting: ${req.weekStart}
Chapters studied this week: ${req.chapters.join("; ") || "basics of the current grade syllabus"}
Known weak topics: ${req.weakTopics.join("; ") || "none recorded"}

Rules:
- Write the paper in the student's language (ISO code "${req.language}"), keeping technical terms in English brackets.
- Exactly 10 multiple-choice questions, 4 options each, only one correct.
- Cover ONLY the chapters listed above (or grade basics if none), spread fairly across them.
- Include at least 3 questions on the known weak topics if any exist.
- Mix difficulty: 4 easy, 4 medium, 2 hard, in increasing order.
- "topic" must be a short specific concept name (2-4 words), "chapter" the chapter it belongs to, "difficulty" one of easy/medium/hard.
- Each explanation: one or two simple sentences explaining why the answer is right.

Return JSON exactly: {"title": "short paper title", "questions": [{"question": "...", "options": ["..","..","..",".."], "correctIndex": 0, "explanation": "...", "topic": "...", "chapter": "...", "difficulty": "easy"}]}`;
}

export function generateExamPaper(req: ExamRequest): Promise<ExamPaper> {
  return generateStructured(examPaperSchema, buildExamPrompt(req));
}

export type AnalysisRequest = {
  grade: string;
  language: string;
  percent: number;
  score: number;
  total: number;
  items: { question: string; topic: string; chapter: string; difficulty: string; correct: boolean }[];
};

export function buildAnalysisPrompt(req: AnalysisRequest) {
  return `You are an AP State Board teacher analysing a ${req.grade} student's weekend test result.

Score: ${req.score}/${req.total} (${req.percent}%)
Per question:
${req.items
  .map(
    (i, n) =>
      `${n + 1}. [${i.correct ? "correct" : "wrong"}] topic: ${i.topic} | chapter: ${i.chapter} | difficulty: ${i.difficulty} | Q: ${i.question}`,
  )
  .join("\n")}

Write the analysis in the student's language (ISO code "${req.language}"), warm and never scolding.
Return JSON exactly: {"summary": "2-3 sentences on how the test went", "weakTopics": [{"topic": "...", "reason": "one short sentence why it looks weak"}], "strongTopics": ["..."], "revisionPlan": [4 short concrete revision steps for this week], "nextWeekGoals": [3 short measurable goals], "encouragement": "one motivating sentence"}
Only list topics that actually appear above. Keep every item under 18 words.`;
}

export function generateExamAnalysis(req: AnalysisRequest): Promise<ExamAnalysis> {
  return generateStructured(examAnalysisSchema, buildAnalysisPrompt(req));
}
