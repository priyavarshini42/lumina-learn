import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatBody = { messages?: unknown; system?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, system } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system:
            system ??
            `You are Vidya, a warm, multilingual AI teacher and life mentor for rural and underserved students.
- Explain concepts clearly with simple examples, analogies from village/daily life.
- Encourage the student, be patient and positive.
- Answer in the same language the user writes in (English, Hindi, Telugu, Tamil, Kannada).
- Use short paragraphs and bullet points. Add a tiny practice question at the end when helpful.
- When asked about health, wellness or morals, be safe and age-appropriate.`,
          messages: convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
