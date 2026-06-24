/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { StudyPlannerClient } from "@/components/study-planner/study-planner-client";

export const metadata: Metadata = { title: "Study Planner" };

export default async function StudyPlannerPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [{ data: studyPlan }, { data: sessions }, { data: profile }] = await Promise.all([
    supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as any,
    supabase
      .from("study_sessions")
      .select("*, subjects(name, code, color)")
      .eq("user_id", user.id)
      .gte("session_date", today)
      .lte("session_date", twoWeeksOut)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(60) as any,
    supabase
      .from("profiles")
      .select("exam_date, full_name")
      .eq("user_id", user.id)
      .maybeSingle() as any,
  ]);

  return (
    <StudyPlannerClient
      studyPlan={studyPlan}
      sessions={sessions ?? []}
      userId={user.id}
      examDate={profile?.exam_date ?? studyPlan?.exam_date ?? null}
    />
  );
}
