import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/Section";
import { AvatarStage } from "./AvatarStage";
import { useSpeech } from "@/hooks/useSpeech";
import { VOICE_LOCALES, type HomeworkReport, type Lesson, type Mcq } from "@/lib/classroom-types";

type Phase = "revision" | "intro" | "topic" | "summary" | "quiz" | "assignment" | "homework";

const PHASES: { id: Phase; label: string }[] = [
  { id: "revision", label: "Revision" },
  { id: "intro", label: "Objectives" },
  { id: "topic", label: "Teaching" },
  { id: "summary", label: "Summary" },
  { id: "quiz", label: "Quiz" },
  { id: "assignment", label: "Assignment" },
  { id: "homework", label: "Homework" },
];

export function LessonSession({
  lesson,
  language,
  learningSpeed,
  startStep,
  onStep,
  onComplete,
  onSubmitHomework,
  evaluating,
  report,
}: {
  lesson: Lesson;
  language: string;
  learningSpeed: string;
  startStep: number;
  onStep: (step: number) => void;
  onComplete: (quizScore: number) => void;
  onSubmitHomework: (submissions: { question: string; answer: string }[]) => void;
  evaluating: boolean;
  report: HomeworkReport | null;
}) {
  const [phase, setPhase] = useState<Phase>(
    (PHASES[startStep]?.id ?? "revision") as Phase,
  );
  const [topicIndex, setTopicIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [detail, setDetail] = useState<"main" | "again" | "example" | "story">("main");
  const [quizScore, setQuizScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const rate = learningSpeed === "slow" ? 0.85 : learningSpeed === "fast" ? 1.15 : 1;
  const locale = VOICE_LOCALES[language] ?? "en-IN";
  const { speak, stop, speaking } = useSpeech(locale, rate);

  const topic = lesson.topics[topicIndex];

  const spokenText = useMemo(() => {
    if (phase === "intro") return `${lesson.introduction}`;
    if (phase === "topic" && topic) {
      if (detail === "example") return topic.realLifeExample;
      if (detail === "story") return topic.story;
      if (detail === "again") return `Let me explain again, slowly. ${topic.explanation}`;
      return `${topic.title}. ${topic.explanation}`;
    }
    if (phase === "summary") return lesson.summary.keyPoints.join(". ");
    if (phase === "revision") return "First, a quick revision of what we learnt last time.";
    if (phase === "quiz") return "Now let us check today's learning with five questions.";
    if (phase === "assignment") return "Here is today's assignment.";
    return lesson.encouragement;
  }, [phase, topic, detail, lesson]);

  useEffect(() => {
    if (voiceOn) speak(spokenText);
    else stop();
  }, [spokenText, voiceOn, speak, stop]);

  const goto = useCallback(
    (next: Phase) => {
      setPhase(next);
      setDetail("main");
      onStep(PHASES.findIndex((p) => p.id === next));
    },
    [onStep],
  );

  const nextFromTopic = () => {
    if (topicIndex < lesson.topics.length - 1) {
      setTopicIndex((i) => i + 1);
      setDetail("main");
    } else goto("summary");
  };

  const activeIndex = PHASES.findIndex((p) => p.id === phase);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Avatar column */}
      <div className="glass-strong relative overflow-hidden rounded-3xl p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,79,217,0.22),transparent_60%)]" />
        <div className="relative">
          <AvatarStage
            speaking={speaking}
            label={`Vidya · ${lesson.grade}`}
            caption={speaking ? "Teaching…" : "Tap next when you are ready"}
            voiceOn={voiceOn}
            onToggleVoice={() => setVoiceOn((v) => !v)}
          />
          <div className="mt-6 space-y-2">
            {PHASES.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  i === activeIndex
                    ? "bg-white/15 text-white"
                    : i < activeIndex
                      ? "text-emerald-300"
                      : "text-white/45"
                }`}
              >
                {i < activeIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4 text-center text-xs">{i + 1}</span>
                )}
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board column */}
      <div className="space-y-4">
        <GlassCard hover={false}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">
                {lesson.subject} · Today&apos;s chapter
              </div>
              <h2 className="text-xl font-bold text-white">{lesson.chapterTitle}</h2>
            </div>
            <div className="rounded-full glass px-3 py-1 text-xs text-white/80">
              {lesson.durationMinutes} min class
            </div>
          </div>
        </GlassCard>

        {phase === "revision" && (
          <QuizBlock
            title="Previous day revision"
            icon={<RefreshCw className="h-4 w-4" />}
            items={lesson.revision}
            onDone={() => goto("intro")}
            ctaLabel="Start today's chapter"
          />
        )}

        {phase === "intro" && (
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <Target className="h-3.5 w-3.5" /> Today&apos;s learning objectives
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              {lesson.objectives.map((o) => (
                <li key={o} className="flex gap-2">
                  <span className="text-[#FF4FD9]">•</span>
                  {o}
                </li>
              ))}
            </ul>
            <p className="mt-4 whitespace-pre-line text-sm text-white/80">{lesson.introduction}</p>
            <button
              onClick={() => goto("topic")}
              className="btn-neon btn-neon-hover mt-5 inline-flex items-center gap-2 text-sm"
            >
              Begin lesson <ArrowRight className="h-4 w-4" />
            </button>
          </GlassCard>
        )}

        {phase === "topic" && topic && (
          <motion.div key={`${topicIndex}-${detail}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false}>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">
                  Topic {topicIndex + 1} of {lesson.topics.length}
                </div>
                <div className="text-xs text-white/50">{lesson.chapterTitle}</div>
              </div>
              <h3 className="mt-1 text-lg font-bold text-white">{topic.title}</h3>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/85">
                {detail === "example"
                  ? topic.realLifeExample
                  : detail === "story"
                    ? topic.story
                    : topic.explanation}
              </p>

              {topic.keyWords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topic.keyWords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-[#FF4FD9]/15 px-3 py-1 text-xs text-[#FFC7F1]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-widest text-white/50">
                  Board diagram
                </div>
                <p className="mt-1 text-sm text-white/80">{topic.diagramDescription}</p>
              </div>

              {topic.tableRows && topic.tableRows.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <div className="mb-1 text-xs uppercase tracking-widest text-white/50">
                    {topic.tableTitle ?? "Table"}
                  </div>
                  <table className="w-full text-left text-sm text-white/85">
                    <tbody>
                      {topic.tableRows.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/10">
                          {row.map((cell, ci) => (
                            <td key={ci} className={`py-2 pr-4 ${ri === 0 ? "font-semibold text-white" : ""}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Did you understand?</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={nextFromTopic} className="btn-neon btn-neon-hover text-sm">
                    ✅ Yes, next topic
                  </button>
                  <SecondaryButton onClick={() => setDetail("again")}>
                    🔁 Explain again
                  </SecondaryButton>
                  <SecondaryButton onClick={() => setDetail("example")}>
                    📝 Give example
                  </SecondaryButton>
                  <SecondaryButton onClick={() => setDetail("story")}>🎥 Show story</SecondaryButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {phase === "summary" && (
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <BookOpenCheck className="h-3.5 w-3.5" /> Chapter summary
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Panel title="Key points" items={lesson.summary.keyPoints} />
              <Panel title="Formula sheet" items={lesson.summary.formulas} />
              <div>
                <PanelTitle>Important definitions</PanelTitle>
                <ul className="mt-2 space-y-2 text-sm text-white/80">
                  {lesson.summary.definitions.map((d) => (
                    <li key={d.term}>
                      <span className="text-white">{d.term}:</span> {d.meaning}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <PanelTitle>Mind map</PanelTitle>
                <ul className="mt-2 space-y-2 text-sm text-white/80">
                  {lesson.summary.mindMap.map((b) => (
                    <li key={b.branch}>
                      <span className="text-[#FF4FD9]">◆ {b.branch}</span>
                      <div className="ml-4 text-white/70">{b.leaves.join(" · ")}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <PanelTitle className="mt-6">Flash cards</PanelTitle>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {lesson.summary.flashCards.map((c) => (
                <FlashCard key={c.front} front={c.front} back={c.back} />
              ))}
            </div>

            <button
              onClick={() => goto("quiz")}
              className="btn-neon btn-neon-hover mt-6 inline-flex items-center gap-2 text-sm"
            >
              Take today&apos;s quiz <ArrowRight className="h-4 w-4" />
            </button>
          </GlassCard>
        )}

        {phase === "quiz" && (
          <QuizBlock
            title="Today's quiz"
            icon={<Brain className="h-4 w-4" />}
            items={lesson.quiz}
            ctaLabel="See assignment"
            onDone={(score) => {
              setQuizScore(score);
              onComplete(score);
              goto("assignment");
            }}
          />
        )}

        {phase === "assignment" && (
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <ClipboardList className="h-3.5 w-3.5" /> Daily assignment
            </div>
            <div className="mt-3 space-y-3">
              {lesson.assignment.map((a, i) => (
                <details key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <summary className="cursor-pointer text-sm text-white/90">
                    <span className="mr-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
                      {a.type} · {a.difficulty}
                    </span>
                    {a.question}
                  </summary>
                  <div className="mt-2 text-sm text-emerald-200">Answer: {a.answer}</div>
                </details>
              ))}
            </div>
            <div className="mt-4 text-sm text-white/70">
              Quiz score today: <span className="text-white">{quizScore}/{lesson.quiz.length}</span>
            </div>
            <button
              onClick={() => goto("homework")}
              className="btn-neon btn-neon-hover mt-4 inline-flex items-center gap-2 text-sm"
            >
              Go to homework <ArrowRight className="h-4 w-4" />
            </button>
          </GlassCard>
        )}

        {phase === "homework" && (
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
              <Lightbulb className="h-3.5 w-3.5" /> Homework —{" "}
              {lesson.homework.reduce((t, h) => t + h.estimatedMinutes, 0)} min
            </div>
            <div className="mt-3 space-y-3">
              {lesson.homework.map((h, i) => (
                <div key={i}>
                  <div className="text-sm text-white/90">
                    <span className="mr-2 text-[#FF4FD9]">{i + 1}.</span>
                    {h.question}
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-white/45">
                      {h.type}
                    </span>
                  </div>
                  <textarea
                    value={answers[String(i)] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [String(i)]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Write your answer…"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35"
                  />
                </div>
              ))}
            </div>

            <button
              disabled={evaluating}
              onClick={() =>
                onSubmitHomework(
                  lesson.homework.map((h, i) => ({
                    question: h.question,
                    answer: answers[String(i)] ?? "",
                  })),
                )
              }
              className="btn-neon btn-neon-hover mt-5 inline-flex items-center gap-2 text-sm disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {evaluating ? "Evaluating…" : "Submit for AI evaluation"}
            </button>

            {report && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">
                  Score {report.score}/{report.total} · Accuracy {Math.round(report.accuracy)}%
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {report.items.map((it, i) => (
                    <div key={i} className="text-white/80">
                      <span className="text-white">{i + 1}.</span> {it.verdict} ({it.marks} mark) —{" "}
                      {it.feedback}
                      <div className="text-emerald-200/90">Correct: {it.correctAnswer}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="text-red-200">Weak: {report.weakTopics.join(", ") || "—"}</div>
                  <div className="text-emerald-200">
                    Strong: {report.strongTopics.join(", ") || "—"}
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/80">
                  Revise: {report.revisionSuggestions.join(" · ")}
                </div>
                <div className="mt-2 text-sm italic text-[#FFC7F1]">{report.teacherRemark}</div>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function PanelTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-xs uppercase tracking-widest text-white/50 ${className}`}>{children}</div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <PanelTitle>{title}</PanelTitle>
      <ul className="mt-2 space-y-1 text-sm text-white/80">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}

function FlashCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="min-h-[76px] rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-sm text-white/85 hover:bg-white/10"
    >
      <div className="text-[10px] uppercase tracking-widest text-white/45">
        {flipped ? "Answer" : "Tap to flip"}
      </div>
      {flipped ? back : front}
    </button>
  );
}

function QuizBlock({
  title,
  icon,
  items,
  onDone,
  ctaLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: Mcq[];
  onDone: (score: number) => void;
  ctaLabel: string;
}) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const score = items.reduce(
    (t, q, i) => t + (picked[i] === q.correctIndex ? 1 : 0),
    0,
  );
  const allAnswered = Object.keys(picked).length === items.length;

  return (
    <GlassCard hover={false}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF4FD9]">
        {icon} {title}
      </div>
      <div className="mt-4 space-y-4">
        {items.map((q, qi) => (
          <div key={qi}>
            <div className="text-sm font-medium text-white">
              {qi + 1}. {q.question}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => {
                const answered = picked[qi] !== undefined;
                const isCorrect = oi === q.correctIndex;
                const isPicked = picked[qi] === oi;
                return (
                  <button
                    key={oi}
                    disabled={answered}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      !answered
                        ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        : isCorrect
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                          : isPicked
                            ? "border-red-400/40 bg-red-400/10 text-red-200"
                            : "border-white/10 bg-white/5 text-white/45"
                    }`}
                  >
                    {opt}
                    {answered && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                    {answered && isPicked && !isCorrect && <XCircle className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            {picked[qi] !== undefined && (
              <div className="mt-1 text-xs text-white/70">{q.explanation}</div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          disabled={!allAnswered}
          onClick={() => onDone(score)}
          className="btn-neon btn-neon-hover inline-flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </button>
        <span className="text-sm text-white/70">
          {score}/{items.length} correct
        </span>
      </div>
    </GlassCard>
  );
}
