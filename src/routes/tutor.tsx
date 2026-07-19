import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/ui/Section";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "AI Doubt Solver — Vidya AI" },
      { name: "description", content: "Ask any doubt in text, voice or image. Get instant, patient explanations." },
    ],
  }),
  component: Tutor,
});

function Tutor() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  };

  const suggestions = [
    "Explain photosynthesis with a village example",
    "Help me solve x² - 5x + 6 = 0",
    "మీరు తెలుగులో గురుత్వాకర్షణ గురించి చెప్పగలరా?",
    "Give me a Python roadmap for 3 months",
  ];

  return (
    <AppShell>
      <SectionHeader
        eyebrow="AI Doubt Solver"
        title="Ask *anything*. In *any language*."
        description="Text, voice or images — Vidya explains patiently and gives examples you can relate to."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="glass-strong rounded-3xl flex flex-col overflow-hidden h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center animate-pulse-glow">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="mt-4 text-white font-semibold">Namaste! I'm Vidya.</div>
                <div className="text-white/60 text-sm">Ask me anything — I'll explain with love.</div>
                <div className="mt-6 grid gap-2 sm:grid-cols-2 max-w-xl mx-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="glass rounded-xl p-3 text-left text-sm text-white/80 hover:bg-white/10 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const isUser = m.role === "user";
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-[#FF4FD9] to-[#6366F1] flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      isUser
                        ? "bg-gradient-to-br from-[#FF4FD9] to-[#A855F7] text-white"
                        : "glass text-white/90"
                    }`}
                  >
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:text-white">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Vidya is thinking…
              </div>
            )}
            {error && (
              <div className="text-sm text-red-300 glass rounded-xl p-3">
                Something went wrong. Please try again.
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="border-t border-white/10 p-3 flex items-center gap-2"
          >
            <button type="button" className="p-2 text-white/60 hover:text-white" aria-label="Voice">
              <Mic className="h-5 w-5" />
            </button>
            <button type="button" className="p-2 text-white/60 hover:text-white" aria-label="Image">
              <ImageIcon className="h-5 w-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vidya a doubt…"
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 px-2"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-neon btn-neon-hover inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Tip</div>
            <div className="mt-2 text-white font-semibold">Ask in your language</div>
            <p className="text-white/60 text-sm mt-1">
              Vidya replies in Telugu, Hindi, Tamil, Kannada or English — whichever you use.
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-widest text-[#FF4FD9]">Try</div>
            <ul className="mt-2 space-y-2 text-sm text-white/80">
              <li>• “Give me 3 MCQs on gravity”</li>
              <li>• “Explain like I'm 10”</li>
              <li>• “Make a study plan for exams”</li>
              <li>• “Motivate me in Hindi”</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
