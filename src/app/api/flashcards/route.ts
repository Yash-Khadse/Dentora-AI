import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { calculateNextReview } from "@/lib/utils";
import { generateJSON } from "@/lib/ai/client";
import { buildFlashcardGeneratorPrompt } from "@/lib/ai/prompts";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const dueOnly = searchParams.get("due") === "true";
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true }) as any;

    if (subjectId) query = query.eq("subject_id", subjectId);
    if (dueOnly) query = query.lte("due_date", today);

    const { data: flashcards, error } = await query;
    if (error) throw error;

    return NextResponse.json(flashcards ?? []);
  } catch (error) {
    console.error("[flashcards GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Generate AI flashcards for a subject/topic
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subjectId, topic, count = 15 } = await req.json();
    if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

    // Resolve subject name
    const { data: subject } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", subjectId)
      .single() as any;

    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    // Generate via AI
    const prompt = buildFlashcardGeneratorPrompt(
      topic ? `Topic: ${topic}` : `High-yield exam topics for ${subject.name}`,
      subject.name,
      Math.min(count, 25)
    );

    const generated = await generateJSON<{ flashcards: { front: string; back: string; hint?: string; difficulty?: string; tags?: string[]; mnemonic?: string }[] }>(
      { prompt }
    );

    if (!generated?.flashcards?.length) {
      return NextResponse.json({ error: "AI returned no flashcards" }, { status: 500 });
    }

    // Save to DB
    const rows = generated.flashcards.map((card) => ({
      user_id: user.id,
      subject_id: subjectId,
      front: card.front,
      back: card.back,
      hint: card.hint || null,
      difficulty: ["easy", "medium", "hard"].includes(card.difficulty ?? "") ? card.difficulty : "medium",
      tags: card.tags ?? [],
      source: "ai_generated",
      due_date: new Date().toISOString().split("T")[0],
    }));

    const { data: saved, error: insertErr } = await supabase
      .from("flashcards")
      .insert(rows)
      .select() as any;

    if (insertErr) throw insertErr;

    return NextResponse.json({ cards: saved, count: saved?.length ?? 0 }, { status: 201 });
  } catch (error) {
    console.error("[flashcards POST]", error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}

// SM-2 update after a review session
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cardId, rating } = await req.json();
    if (!cardId || !rating) {
      return NextResponse.json({ error: "cardId and rating required" }, { status: 400 });
    }

    // Fetch current card state
    const { data: card, error: fetchErr } = await supabase
      .from("flashcards")
      .select("ease_factor, interval_days, review_count")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single() as any;

    if (fetchErr || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Map rating string to SM-2 quality score (0-5)
    const qualityMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5> = {
      again: 0,
      hard: 2,
      good: 4,
      easy: 5,
    };
    const quality = qualityMap[rating] ?? 4;

    // Apply SM-2 algorithm
    const { newInterval, newEaseFactor } = calculateNextReview(
      card.ease_factor ?? 2.5,
      card.interval_days ?? 0,
      quality
    );

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + newInterval);

    const { data: updated, error: updateErr } = await supabase
      .from("flashcards")
      .update({
        ease_factor: newEaseFactor,
        interval_days: newInterval,
        due_date: dueDate.toISOString().split("T")[0],
        review_count: (card.review_count ?? 0) + 1,
        last_reviewed: new Date().toISOString(),
      })
      .eq("id", cardId)
      .eq("user_id", user.id)
      .select()
      .single() as any;

    if (updateErr) throw updateErr;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[flashcards PATCH]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("id");
    if (!cardId) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", cardId)
      .eq("user_id", user.id) as any;

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[flashcards DELETE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
