import { z } from "zod";

export const mcqSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number(),
  explanation: z.string(),
});

export const topicSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  realLifeExample: z.string(),
  story: z.string(),
  diagramDescription: z.string(),
  keyWords: z.array(z.string()),
  tableTitle: z.string().nullable(),
  tableRows: z.array(z.array(z.string())).nullable(),
});

export const lessonSchema = z.object({
  chapterTitle: z.string(),
  subject: z.string(),
  grade: z.string(),
  durationMinutes: z.number(),
  revision: z.array(mcqSchema),
  objectives: z.array(z.string()),
  introduction: z.string(),
  topics: z.array(topicSchema),
  summary: z.object({
    keyPoints: z.array(z.string()),
    formulas: z.array(z.string()),
    definitions: z.array(z.object({ term: z.string(), meaning: z.string() })),
    mindMap: z.array(z.object({ branch: z.string(), leaves: z.array(z.string()) })),
    flashCards: z.array(z.object({ front: z.string(), back: z.string() })),
  }),
  quiz: z.array(mcqSchema),
  assignment: z.array(
    z.object({
      type: z.string(),
      difficulty: z.string(),
      question: z.string(),
      answer: z.string(),
    }),
  ),
  homework: z.array(
    z.object({
      type: z.string(),
      question: z.string(),
      estimatedMinutes: z.number(),
    }),
  ),
  encouragement: z.string(),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type Mcq = z.infer<typeof mcqSchema>;
export type LessonTopic = z.infer<typeof topicSchema>;

export const homeworkReportSchema = z.object({
  score: z.number(),
  total: z.number(),
  accuracy: z.number(),
  items: z.array(
    z.object({
      question: z.string(),
      verdict: z.string(),
      marks: z.number(),
      feedback: z.string(),
      correctAnswer: z.string(),
    }),
  ),
  weakTopics: z.array(z.string()),
  strongTopics: z.array(z.string()),
  revisionSuggestions: z.array(z.string()),
  teacherRemark: z.string(),
});

export type HomeworkReport = z.infer<typeof homeworkReportSchema>;

/** BCP-47 voice tags for browser speech synthesis. */
export const VOICE_LOCALES: Record<string, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  ur: "ur-IN",
  pa: "pa-IN",
  or: "or-IN",
};
