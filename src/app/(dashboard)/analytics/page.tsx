/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: allMetricsRows }, { data: profileData }, { data: streakLog }, { data: subjectProgress }, { data: achievements }] = await Promise.all([
    supabase
      .from("performance_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("metric_date", { ascending: false }) as any,
    supabase
      .from("profiles")
      .select("study_streak, longest_streak")
      .eq("user_id", user.id)
      .single() as any,
    supabase
      .from("study_streak_log")
      .select("*")
      .eq("user_id", user.id)
      .gte("study_date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("study_date", { ascending: true }) as any,
    supabase
      .from("user_subject_progress")
      .select("*, subjects(name, code, color)")
      .eq("user_id", user.id) as any,
    supabase
      .from("user_achievements")
      .select("*, achievements(name, icon, xp_reward)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(10) as any,
  ]);

  // Aggregate performance metrics into a single summary object
  const rows = allMetricsRows ?? [];
  const totalStudyMins = rows.reduce((s: number, r: any) => s + (r.study_minutes ?? 0), 0);
  const totalTopics = rows.reduce((s: number, r: any) => s + (r.topics_completed ?? 0), 0);
  const sessionDays = rows.filter((r: any) => (r.study_minutes ?? 0) > 0).length;
  const avgSession = sessionDays > 0 ? Math.round(totalStudyMins / sessionDays) : 0;
  const latestReadiness = rows[0]?.readiness_score ?? 0;

  const metrics = rows.length > 0 ? {
    readiness_score: latestReadiness,
    total_study_hours: Math.round((totalStudyMins / 60) * 10) / 10,
    current_streak: profileData?.study_streak ?? 0,
    best_streak: profileData?.longest_streak ?? 0,
    topics_completed: totalTopics,
    avg_session_duration: avgSession,
  } : null;

  return (
    <AnalyticsClient
      metrics={metrics}
      streakLog={streakLog ?? []}
      subjectProgress={subjectProgress ?? []}
      achievements={achievements ?? []}
    />
  );
}
