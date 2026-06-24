import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { ensureUserRows } from "@/lib/db/ensure-user";
import { buildFlashcardGeneratorPrompt } from "@/lib/ai/prompts";
import { generateText } from "@/lib/ai/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await ensureUserRows(supabase, user);

    const { content, subjectId, topicId, subjectName, count = 20 } = await req.json();

    const prompt = buildFlashcardGeneratorPrompt(content, subjectName || "General Dentistry", count);
    const rawResponse = await generateText({ prompt });

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");

    const { flashcards } = JSON.parse(jsonMatch[0]);

    // Save all flashcards to database
    const flashcardRows = flashcards.map((fc: {
      front: string;
      back: string;
      hint?: string;
      difficulty?: string;
      tags?: string[];
    }) => ({
      user_id: user.id,
      subject_id: subjectId || null,
      topic_id: topicId || null,
      front: fc.front,
      back: fc.back,
      hint: fc.hint || null,
      difficulty: fc.difficulty || "medium",
      tags: fc.tags || [],
      source: "ai_generated" as const,
      due_date: new Date().toISOString().split("T")[0],
    }));

    const { data: saved, error } = await supabase
      .from("flashcards")
      .insert(flashcardRows)
      .select();

    if (error) throw error;

    return NextResponse.json({ flashcards: saved, count: saved?.length });
  } catch (error) {
    console.error("[Flashcards AI]", error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}
