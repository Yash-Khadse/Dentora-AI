import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { generateText } from "@/lib/ai/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { paperId, subjectId } = await req.json();

    let context = "";

    if (paperId) {
      const { data: paper } = await supabase
        .from("previous_papers")
        .select("*, subjects(name)")
        .eq("id", paperId)
        .single() as any;

      if (!paper) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("content")
        .eq("source_id", paperId)
        .limit(20) as any;

      context = `Subject: ${paper.subjects?.name}\nYear: ${paper.year}\nExam Type: ${paper.exam_type}\n\nContent:\n${(chunks ?? []).map((c: any) => c.content).join("\n")}`;
    } else if (subjectId) {
      const { data: subject } = await supabase.from("subjects").select("name").eq("id", subjectId).single() as any;
      context = `Subject: ${subject?.name}`;
    }

    const prompt = `You are an expert at predicting dental examination questions for BDS final year students.

Based on the following context from previous examination papers:
${context}

Generate a list of high-yield predicted questions for the upcoming exam. Return a JSON object with:
- predictions: array of objects, each with:
  - question: string (the predicted question)
  - topic: string (the topic it belongs to)
  - probability: "high" | "medium" | "low"
  - reasoning: string (brief reason for prediction)
  - frequency: number (how many times seen in past papers, 0 if new prediction)

Return at least 10 predictions. Return ONLY the JSON object.`;

    const text = await generateText({ prompt });
    const predictions = JSON.parse(text.replace(/```json\n?|```\n?/g, "").trim());

    if (paperId) {
      await supabase
        .from("previous_papers")
        .update({ analysis_json: predictions })
        .eq("id", paperId);
    }

    return NextResponse.json(predictions);
  } catch (error) {
    console.error("[predictor POST]", error);
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    let query = supabase
      .from("exam_predictions")
      .select("*")
      .eq("user_id", user.id)
      .order("predicted_probability", { ascending: false }) as any;

    if (subjectId) query = query.eq("subject_id", subjectId);

    const { data: predictions } = await query;
    return NextResponse.json(predictions ?? []);
  } catch (error) {
    console.error("[predictor GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
