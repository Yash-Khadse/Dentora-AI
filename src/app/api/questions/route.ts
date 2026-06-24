import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");
    const type = searchParams.get("type");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

    let query = supabase
      .from("questions")
      .select("*, subjects(name, code), topics(name)")
      .order("frequency_count", { ascending: false })
      .limit(limit) as any;

    if (subjectId) query = query.eq("subject_id", subjectId);
    if (topicId) query = query.eq("topic_id", topicId);
    if (difficulty) query = query.eq("difficulty", difficulty);
    if (type) query = query.eq("question_type", type);

    const { data: questions } = await query;
    return NextResponse.json(questions ?? []);
  } catch (error) {
    console.error("[questions GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single() as any;

    if (userRecord?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { question_text, question_type, subject_id, topic_id, difficulty, answer } = body;

    if (!question_text || !subject_id) {
      return NextResponse.json({ error: "question_text and subject_id are required" }, { status: 400 });
    }

    const { data: question } = await supabase
      .from("questions")
      .insert({ question_text, question_type, subject_id, topic_id, difficulty, answer })
      .select()
      .single() as any;

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("[questions POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
