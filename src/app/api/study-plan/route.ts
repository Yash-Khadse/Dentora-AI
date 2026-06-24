import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [studyPlan, sessions] = await Promise.all([
      supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single() as any,
      supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("session_date", { ascending: true })
        .limit(50) as any,
    ]);

    return NextResponse.json({
      plan: studyPlan.data,
      sessions: sessions.data ?? [],
    });
  } catch (error) {
    console.error("[study-plan GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { examDate } = body;

    if (!examDate) return NextResponse.json({ error: "examDate is required" }, { status: 400 });

    // Check for existing active plan to update, otherwise insert
    const { data: existing } = await supabase
      .from("study_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single() as any;

    let plan;
    if (existing?.id) {
      const { data } = await supabase
        .from("study_plans")
        .update({ exam_date: examDate, is_active: true })
        .eq("id", existing.id)
        .select()
        .single() as any;
      plan = data;
    } else {
      const { data } = await supabase
        .from("study_plans")
        .insert({ user_id: user.id, exam_date: examDate, generated_by_ai: false, is_active: true })
        .select()
        .single() as any;
      plan = data;
    }

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("[study-plan POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, isCompleted } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const { data: session } = await supabase
      .from("study_sessions")
      .update({ status: isCompleted ? "completed" : "scheduled" })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single() as any;

    return NextResponse.json(session);
  } catch (error) {
    console.error("[study-plan PATCH]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
