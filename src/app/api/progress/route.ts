import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [subjectProgress, topicProgress, metrics] = await Promise.all([
      supabase
        .from("user_subject_progress")
        .select("*, subjects(name, code, color)")
        .eq("user_id", user.id) as any,
      supabase
        .from("user_topic_progress")
        .select("*, topics(name, subject_id)")
        .eq("user_id", user.id) as any,
      supabase
        .from("performance_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("metric_date", { ascending: false })
        .limit(1) as any,
    ]);

    return NextResponse.json({
      subjectProgress: subjectProgress.data ?? [],
      topicProgress: topicProgress.data ?? [],
      metrics: metrics.data?.[0] ?? null,
    });
  } catch (error) {
    console.error("[progress GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topicId, subjectId, isCompleted, confidenceLevel, minutesStudied } = await req.json();
    if (!topicId && !subjectId) {
      return NextResponse.json({ error: "topicId or subjectId required" }, { status: 400 });
    }

    if (topicId) {
      await supabase
        .from("user_topic_progress")
        .upsert(
          {
            user_id: user.id,
            topic_id: topicId,
            status: isCompleted ? "completed" : "in_progress",
            confidence: confidenceLevel ?? 0,
          },
          { onConflict: "user_id,topic_id" }
        ) as any;
    }

    if (subjectId) {
      await supabase
        .from("user_subject_progress")
        .upsert(
          { user_id: user.id, subject_id: subjectId, confidence_score: confidenceLevel ?? 0 },
          { onConflict: "user_id,subject_id" }
        ) as any;
    }

    if (minutesStudied && minutesStudied > 0) {
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("study_streak_log")
        .upsert(
          { user_id: user.id, study_date: today, minutes: minutesStudied },
          { onConflict: "user_id,study_date" }
        ) as any;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[progress POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
