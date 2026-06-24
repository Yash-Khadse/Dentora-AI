// ============================================================
// DENTORA AI - Unified AI Client
// Supports: Gemini 2.5 Flash | OpenRouter | Ollama
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = "gemini" | "openrouter" | "ollama";

interface AIRequestOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: AIProvider;
}

interface AIStreamOptions extends AIRequestOptions {
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

// ---- Gemini Client ----
function getGeminiClient(jsonMode = false, modelOverride?: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({
    model: modelOverride || process.env.AI_MODEL || "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  });
}

// ---- JSON repair: fix common LLM JSON issues ----
export function repairJSON(raw: string): string {
  // Extract from markdown fences first
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  let text = fenceMatch ? fenceMatch[1] : raw;

  // Find the outermost { } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    text = text.slice(start, end + 1);
  }

  // Remove trailing commas before ] or }
  text = text.replace(/,(\s*[}\]])/g, "$1");

  return text;
}

// Gemini model cascade — only models confirmed live in v1beta API
// gemini-1.5-* series is deprecated and returns 404
const GEMINI_FALLBACK_MODELS = [
  process.env.AI_MODEL || "gemini-2.0-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
].filter((m, i, arr) => arr.indexOf(m) === i); // deduplicate

async function generateWithGeminiCascade(options: AIRequestOptions, jsonMode = false): Promise<string> {
  let lastError: Error = new Error("No Gemini models available");
  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const result = await generateWithGemini(options, jsonMode, model);
      return result;
    } catch (err) {
      lastError = err as Error;
      const msg = (err as Error).message || "";
      // Continue on: overload (503), quota (429), deprecated/not found (404)
      // Stop on: auth errors (401/403), bad API key, etc.
      if (msg.includes("503") || msg.includes("429") || msg.includes("overload") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("404") || msg.includes("not found")) {
        console.warn(`[AI] Gemini ${model} unavailable, trying next model...`);
        continue;
      }
      throw err; // auth error or real failure — stop immediately
    }
  }
  throw lastError;
}

// ---- Generate (non-streaming) ----
export async function generateText(options: AIRequestOptions): Promise<string> {
  const provider = options.provider || (process.env.AI_PROVIDER as AIProvider) || "gemini";

  if (provider === "gemini") {
    try {
      return await generateWithGeminiCascade(options);
    } catch (geminiErr) {
      console.error("[AI] All Gemini models failed, trying OpenRouter:", geminiErr);
      try {
        return await generateWithOpenRouter(options);
      } catch (orErr) {
        console.error("[AI] OpenRouter also failed:", orErr);
        throw geminiErr; // throw original Gemini error as primary context
      }
    }
  } else if (provider === "openrouter") {
    return await generateWithOpenRouter(options);
  } else {
    return await generateWithOllama(options);
  }
}

// ---- Generate JSON (uses native JSON mode for cleaner output) ----
export async function generateJSON<T = unknown>(options: AIRequestOptions): Promise<T> {
  const provider = options.provider || (process.env.AI_PROVIDER as AIProvider) || "gemini";

  let raw: string;
  if (provider === "gemini") {
    try {
      raw = await generateWithGeminiCascade(options, true);
    } catch (geminiErr) {
      console.error("[AI] generateJSON: all Gemini models failed, trying OpenRouter:", geminiErr);
      try {
        raw = await generateWithOpenRouter(options);
      } catch (orErr) {
        console.error("[AI] generateJSON: OpenRouter also failed:", orErr);
        throw geminiErr; // surface Gemini error — it's the primary provider
      }
    }
  } else {
    raw = await generateWithOpenRouter(options);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try repairing
    const repaired = repairJSON(raw);
    return JSON.parse(repaired) as T;
  }
}

async function generateWithGemini(options: AIRequestOptions, jsonMode = false, modelOverride?: string): Promise<string> {
  const model = getGeminiClient(jsonMode, modelOverride);
  const fullPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\n${options.prompt}`
    : options.prompt;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

// Free models to try in order — first available wins
const OPENROUTER_FREE_MODELS = [
  process.env.OPENROUTER_MODEL,                       // user-configured override (if set)
  "meta-llama/llama-3.3-70b-instruct:free",           // reliable free tier
  "google/gemma-4-31b-it:free",                       // Google's open model
  "qwen/qwen3-coder:free",                            // Alibaba free model
  "openrouter/free",                                  // OpenRouter dynamic free model
].filter(Boolean) as string[];

async function generateWithOpenRouter(options: AIRequestOptions): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://dentora.ai",
    "X-Title": "Dentora AI",
  };

  const messages = [
    ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
    { role: "user", content: options.prompt },
  ];

  let lastError: Error = new Error("No OpenRouter models available");

  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        lastError = new Error(`OpenRouter [${model}] ${response.status}: ${response.statusText}`);
        console.warn(`[AI] OpenRouter model ${model} failed (${response.status}), trying next...`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        lastError = new Error(`OpenRouter [${model}] returned empty response`);
        continue;
      }

      return content;
    } catch (err) {
      lastError = err as Error;
      console.warn(`[AI] OpenRouter model ${model} threw:`, err);
    }
  }

  throw lastError;
}

async function generateWithOllama(options: AIRequestOptions): Promise<string> {
  const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "llama3.2",
      prompt: options.systemPrompt
        ? `${options.systemPrompt}\n\n${options.prompt}`
        : options.prompt,
      stream: false,
    }),
  });
  const data = await response.json();
  return data.response;
}

// ---- Streaming (for chat UI) ----
export async function streamText(options: AIStreamOptions): Promise<void> {
  const provider = (process.env.AI_PROVIDER as AIProvider) || "gemini";

  if (provider === "gemini") {
    // Try each Gemini model in the cascade for streaming
    let lastErr: Error = new Error("No Gemini models available");
    for (const model of GEMINI_FALLBACK_MODELS) {
      try {
        await streamWithGemini(options, model);
        return; // success
      } catch (err) {
        lastErr = err as Error;
        const msg = (err as Error).message || "";
        if (msg.includes("503") || msg.includes("429") || msg.includes("overload") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("404") || msg.includes("not found")) {
          console.warn(`[AI Stream] Gemini ${model} unavailable, trying next...`);
          continue;
        }
        break; // auth error or unknown — skip to OpenRouter
      }
    }
    // Try OpenRouter as final fallback
    try {
      await streamWithOpenRouter(options);
    } catch (orErr) {
      options.onError(lastErr); // surface the Gemini error as primary
    }
  } else if (provider === "openrouter") {
    try {
      await streamWithOpenRouter(options);
    } catch (err) {
      options.onError(err as Error);
    }
  } else {
    options.onError(new Error(`Unknown provider: ${provider}`));
  }
}

async function streamWithGemini(options: AIStreamOptions, modelOverride?: string): Promise<void> {
  const model = getGeminiClient(false, modelOverride);
  const fullPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\n${options.prompt}`
    : options.prompt;
  const result = await model.generateContentStream(fullPrompt);
  let fullText = "";
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    options.onChunk(chunkText);
  }
  options.onDone(fullText);
}

async function streamWithOpenRouter(options: AIStreamOptions): Promise<void> {
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const model = OPENROUTER_FREE_MODELS[0]; // Use first available model for streaming
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://dentora.ai",
      "X-Title": "Dentora AI",
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
        { role: "user", content: options.prompt },
      ],
      stream: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter stream ${response.status}: ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const data = line.replace("data: ", "");
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices[0]?.delta?.content || "";
        fullText += text;
        options.onChunk(text);
      } catch {}
    }
  }
  options.onDone(fullText);
}

// ---- Embeddings (for pgvector) ----
export async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}
