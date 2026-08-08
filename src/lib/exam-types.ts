import { z } from "zod";

export const examQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number(),
  explanation: z.string(),
  topic: z.string(),
  chapter: z.string(),
  difficulty: z.string(),
});

export const examPaperSchema = z.object({
  title: z.string(),
  questions: z.array(examQuestionSchema),
});

export const examAnalysisSchema = z.object({
  summary: z.string(),
  weakTopics: z.array(z.object({ topic: z.string(), reason: z.string() })),
  strongTopics: z.array(z.string()),
  revisionPlan: z.array(z.string()),
  nextWeekGoals: z.array(z.string()),
  encouragement: z.string(),
});

export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type ExamPaper = z.infer<typeof examPaperSchema>;
export type ExamAnalysis = z.infer<typeof examAnalysisSchema>;

export type TopicBreakdown = {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
};

export type ExamResult = {
  score: number;
  total: number;
  percent: number;
  topics: TopicBreakdown[];
  chapters: TopicBreakdown[];
  difficulty: TopicBreakdown[];
  analysis: ExamAnalysis;
};

export type ExamRecord = {
  id: string;
  weekStart: string;
  title: string;
  language: string;
  status: string;
  questions: ExamQuestion[];
  answers: number[] | null;
  score: number | null;
  result: ExamResult | null;
};

/** Groups answered questions by any key for the analytics charts. */
export function groupBreakdown(
  questions: ExamQuestion[],
  answers: number[],
  key: (q: ExamQuestion) => string,
): TopicBreakdown[] {
  const map = new Map<string, { correct: number; total: number }>();
  questions.forEach((q, i) => {
    const k = key(q) || "General";
    const entry = map.get(k) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answers[i] === q.correctIndex) entry.correct += 1;
    map.set(k, entry);
  });
  return Array.from(map.entries()).map(([topic, v]) => ({
    topic,
    correct: v.correct,
    total: v.total,
    accuracy: Math.round((v.correct / v.total) * 100),
  }));
}
