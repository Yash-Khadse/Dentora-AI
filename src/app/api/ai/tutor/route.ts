import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { buildTutorPrompt, DENTAL_CONTEXT } from "@/lib/ai/prompts";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only currently live Gemini models (1.5 series deprecated in v1beta)
const GEMINI_MODELS = [
  process.env.AI_MODEL || "gemini-2.0-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
].filter((m, i, arr) => arr.indexOf(m) === i);

// Errors that mean "try the next model" vs "stop immediately"
function shouldTryNextModel(err: Error): boolean {
  const msg = err.message || "";
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("overload") ||
    msg.includes("404") // model deprecated/not found — try next
  );
}

// OpenRouter streaming fallback
async function streamFromOpenRouter(
  prompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const OPENROUTER_MODELS = [
    process.env.OPENROUTER_MODEL,
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
  ].filter(Boolean) as string[];

  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://dentora.ai",
          "X-Title": "Dentora AI",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: true,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok || !response.body) {
        console.warn(`[AI Tutor] OpenRouter ${model} failed (${response.status}), trying next...`);
        continue;
      }

      const reader = response.body.getReader();
      const dec = new TextDecoder();
      let gotContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = dec.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const text: string = parsed.choices?.[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
              gotContent = true;
            }
          } catch { /* skip malformed SSE line */ }
        }
      }

      if (gotContent) return; // success
    } catch (err) {
      console.warn(`[AI Tutor] OpenRouter ${model} threw:`, err);
    }
  }

  throw new Error("All OpenRouter models failed");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const {
      message,
      history = [],
      subject,
      topic,
      mode = "standard",
    } = await req.json();

    if (!message?.trim()) {
      return new Response("Message required", { status: 400 });
    }

    // Optional RAG lookup from uploaded notes
    let contextDocs: string | undefined;
    try {
      const { generateEmbedding } = await import("@/lib/ai/client");
      const embedding = await generateEmbedding(message);
      const { data: chunks } = await supabase.rpc("match_document_chunks", {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 3,
        p_user_id: user.id,
      }) as { data: { content: string }[] | null };
      if (chunks && chunks.length > 0) {
        contextDocs = chunks.map((c) => c.content).join("\n\n---\n\n");
      }
    } catch { /* RAG is optional */ }

    // Build prompt
    const historyText = history.length > 0
      ? history.map((h: { role: string; content: string }) =>
          `${h.role === "user" ? "Student" : "Tutor"}: ${h.content}`
        ).join("\n\n")
      : "";

    const fullPrompt = historyText
      ? `${DENTAL_CONTEXT}

You are a BDS dental tutor in ${mode} mode. Answer clearly with markdown formatting. Include exam tips and mnemonics when relevant.

## Conversation History
${historyText}

## Current Question
${message}`
      : buildTutorPrompt(
          subject || "General Dentistry",
          topic || "General",
          message,
          contextDocs,
          mode
        );

    // ── Try Gemini models in cascade ──
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    let geminiStream: AsyncIterable<{ text: () => string }> | null = null;
    let lastGeminiError: Error = new Error("No Gemini models tried");

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        });
        geminiStream = (await model.generateContentStream(fullPrompt)).stream;
        break; // success
      } catch (err) {
        lastGeminiError = err as Error;
        if (shouldTryNextModel(err as Error)) {
          console.warn(`[AI Tutor] ${modelName} unavailable, trying next...`);
          continue;
        }
        break; // auth error or unknown — don't try more Gemini models
      }
    }

    const encoder = new TextEncoder();

    if (geminiStream) {
      const stream = geminiStream;
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
          } catch (err) {
            // Mid-stream failure — append an error note
            controller.enqueue(encoder.encode("\n\n*[Connection interrupted — please retry]*"));
          }
          controller.close();
        },
      });
      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // ── Gemini exhausted — stream via OpenRouter ──
    console.warn("[AI Tutor] All Gemini models failed, falling back to OpenRouter:", lastGeminiError.message);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          await streamFromOpenRouter(fullPrompt, controller, encoder);
        } catch (err) {
          console.error("[AI Tutor] OpenRouter fallback also failed:", err);
          controller.enqueue(
            encoder.encode(
              "⚠️ AI service is experiencing high demand right now. Please wait 30 seconds and try again."
            )
          );
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[AI Tutor]", error);
    return new Response("Internal server error", { status: 500 });
  }
}
