import { streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3.6-flash";

export const parentRecommendationsSchema = z.object({
  weekly: z.array(z.string()),
  monthly: z.array(z.string()),
  focusTopics: z.array(z.string()),
  parentNote: z.string(),
});

export type ParentRecommendations = z.infer<typeof parentRecommendationsSchema>;

export type RecommendationInput = {
  studentName: string;
  grade: string;
  language: string;
  chaptersCompleted: number;
  averageQuizScore: number | null;
  averageHomeworkScore: number | null;
  minutesThisWeek: number;
  streakDays: number;
  weakTopics: string[];
  recentChapters: string[];
};

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "```").trim();
  const fenced = cleaned.match(/```([\s\S]*?)```/);
  const body = fenced?.[1] ?? cleaned;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("The AI mentor returned an unexpected answer.");
  return JSON.parse(body.slice(start, end + 1));
}

export async function generateParentRecommendations(
  input: RecommendationInput,
): Promise<ParentRecommendations> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");

  const prompt = `You advise the parent of a rural Indian student learning with an AI teacher.

Student: ${input.studentName}
Class/Grade: ${input.grade}
Chapters completed: ${input.chaptersCompleted}
Average quiz score: ${input.averageQuizScore ?? "no quizzes yet"}
Average homework score: ${input.averageHomeworkScore ?? "no homework graded yet"}
Study minutes this week: ${input.minutesThisWeek}
Current streak: ${input.streakDays} days
Weak topics from homework reports: ${input.weakTopics.join(", ") || "none recorded"}
Recent chapters: ${input.recentChapters.join(", ") || "none yet"}

Write practical guidance for the PARENT (not the student), in the language with ISO code "${input.language}" (keep subject terms in English brackets).
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
