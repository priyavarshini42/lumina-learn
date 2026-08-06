import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Loader2, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useDoubt } from "@/lib/doubt-context";
import { useLanguage, languageName, languageNative } from "@/lib/i18n";
import { useSpeech } from "@/hooks/useSpeech";
import { VOICE_LOCALES } from "@/lib/classroom-types";

/** Renders ```diagram fences as an ASCII diagram card, everything else as markdown. */
function AnswerBody({ text }: { text: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:text-white">
      <ReactMarkdown
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const raw = String(children).replace(/\n$/, "");
            const isBlock = (className ?? "").includes("language-");
            if (!isBlock) {
              return (
                <code className="rounded bg-white/10 px-1 py-0.5 text-[#FFB3F0]">{raw}</code>
              );
            }
            const isDiagram = /language-(diagram|ascii|mermaid|graph)/.test(className ?? "");
            return (
              <div
                className={`my-3 rounded-2xl border p-3 ${
                  isDiagram
                    ? "border-[#FF4FD9]/40 bg-[#FF4FD9]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {isDiagram && (
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-[#FF4FD9]">
                    Diagram
                  </div>
                )}
                <pre className="overflow-x-auto whitespace-pre text-[11px] leading-snug text-white/90">
                  {raw}
                </pre>
              </div>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function DoubtSolver() {
  const { open, setOpen, topic, prefill, ask } = useDoubt();
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const [voiceOn, setVoiceOn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, stop, speaking } = useSpeech(VOICE_LOCALES[language] ?? "en-IN");

  const system = useMemo(
    () => `You are Vidya, an always-available AI doubt-solving teacher for rural and underserved students.
Answer in ${languageName(language)} (${languageNative(language)}); keep English technical terms in brackets.
${topic ? `The student is currently learning: ${topic}. Prefer explanations tied to this.` : ""}
Rules:
- Answer instantly and simply: 3-6 short sentences or bullets, then a one-line "In short:".
- ALWAYS include one visual aid as a fenced code block tagged diagram, using plain ASCII/text (boxes, arrows, labelled parts, number lines or simple tables). Keep it under 12 lines.
- Give one real-life village/daily-life example.
- End with a tiny check-question for the student.
- Be warm and encouraging, never scolding. Stay age-appropriate and safe.`,
    [language, topic],
  );

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { system } }),
    [system],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open && prefill) setInput(prefill);
  }, [open, prefill]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const lastAnswer = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return "";
    return last.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  }, [messages]);

  useEffect(() => {
    if (!voiceOn || isLoading || !lastAnswer) return;
    speak(lastAnswer.replace(/```[\s\S]*?```/g, " ").replace(/[#*`_>-]/g, " "));
  }, [voiceOn, isLoading, lastAnswer, speak]);

  const submit = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const quick = topic
    ? [`Explain this part again simply`, `Give another example`, `Draw a diagram for this`]
    : [`Explain photosynthesis simply`, `How do I solve x² - 5x + 6 = 0?`, `Draw the water cycle`];

  return (
    <>
      <button
        onClick={() => ask()}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] shadow-2xl animate-pulse-glow lg:bottom-6 lg:right-6"
        aria-label="Ask a doubt"
      >
        <HelpCircle className="h-6 w-6 text-white" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="glass-strong fixed bottom-20 right-2 z-50 flex h-[72vh] w-[calc(100vw-1rem)] max-w-md flex-col overflow-hidden rounded-3xl shadow-2xl sm:right-4 lg:bottom-24 lg:right-6"
            role="dialog"
            aria-label="Doubt solver"
          >
            <header className="flex items-center gap-3 border-b border-white/10 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">Ask a doubt · anytime</div>
                <div className="truncate text-[11px] text-white/50">
                  {topic ? `On: ${topic}` : `Answers in ${languageNative(language)}`}
                </div>
              </div>
              <button
                onClick={() => {
                  setVoiceOn((v) => !v);
                  if (speaking) stop();
                }}
                className="p-2 text-white/60 hover:text-white"
                aria-label={voiceOn ? "Turn voice off" : "Turn voice on"}
              >
                {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  stop();
                  setOpen(false);
                }}
                className="p-2 text-white/60 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-white/70">
                    Ask me anything — during a lesson or after it. I'll answer with a small
                    diagram in your language.
                  </p>
                  {quick.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="glass w-full rounded-xl p-3 text-left text-sm text-white/80 transition hover:bg-white/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                        isUser
                          ? "bg-gradient-to-br from-[#FF4FD9] to-[#A855F7] text-white"
                          : "glass text-white/90"
                      }`}
                    >
                      {isUser ? text : <AnswerBody text={text} />}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Vidya is drawing an answer…
                </div>
              )}
              {error && (
                <div className="glass rounded-xl p-3 text-sm text-red-300">
                  Couldn't reach your AI teacher. Please try again.
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your doubt…"
                className="flex-1 bg-transparent px-2 text-white outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn-neon btn-neon-hover inline-flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Ask
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
