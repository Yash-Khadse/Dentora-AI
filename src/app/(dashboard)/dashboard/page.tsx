/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { redirect } from "next/navigation";
import { DashboardHero } from "@/components/dashboard/hero";
import { TodaysTasks } from "@/components/dashboard/todays-tasks";
import { SubjectProgress } from "@/components/dashboard/subject-progress";
import { RevisionQueue } from "@/components/dashboard/revision-queue";
import { WeakSubjects } from "@/components/dashboard/weak-subjects";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StudyHeatmap } from "@/components/dashboard/study-heatmap";
import { daysUntil } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch dashboard data in parallel
  // Types use 'any' here — run `npm run db:types` after connecting Supabase CLI to get full type safety
  const [profileRes, subjectsRes, sessionsRes, revisionRes, metricsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
    supabase.from("user_subject_progress")
      .select("*, subjects(name, color, code)")
      .eq("user_id", user!.id)
      .order("completion_pct"),
    supabase.from("study_sessions")
      .select("*")
      .eq("user_id", user!.id)
      .eq("session_date", new Date().toISOString().split("T")[0])
      .order("start_time"),
    supabase.from("revision_schedule")
      .select("*, topics(name, subjects(name, color))")
      .eq("user_id", user!.id)
      .eq("is_completed", false)
      .lte("due_date", new Date().toISOString().split("T")[0])
      .limit(5),
    supabase.from("performance_metrics")
      .select("*")
      .eq("user_id", user!.id)
      .order("metric_date", { ascending: false })
      .limit(30),
  ]) as any[];

  const profile = profileRes?.data as any;
  const subjects = subjectsRes?.data as any[] ?? [];
  const sessions = sessionsRes?.data as any[] ?? [];
  const revisions = revisionRes?.data as any[] ?? [];
  const metrics = metricsRes?.data as any[] ?? [];

  const daysLeft = profile?.exam_date ? daysUntil(profile.exam_date) : null;

  // Calculate readiness score from active plan
  const { data: activePlan } = await supabase
    .from("study_plans")
    .select("readiness_score, completed_sessions, total_sessions")
    .eq("user_id", user!.id)
    .eq("is_active", true)
    .single() as any;

  // Flashcards due today
  const { count: flashcardsDue } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .lte("due_date", new Date().toISOString().split("T")[0]) as any;

  const stats = {
    examDaysLeft: daysLeft ?? 0,
    readinessScore: activePlan?.readiness_score ?? 0,
    studyStreak: profile?.study_streak ?? 0,
    flashcardsDue: flashcardsDue ?? 0,
    todaySessionsTotal: sessions.length,
    todaySessionsDone: sessions.filter((s: any) => s.status === "completed").length,
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <DashboardHero
        userName={profile?.full_name?.split(" ")[0] || "Student"}
        stats={stats}
        examDate={profile?.exam_date}
      />

      <QuickActions flashcardsDue={stats.flashcardsDue} revisionDue={revisions.length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodaysTasks sessions={sessions} />
          <SubjectProgress subjects={subjects} />
          <StudyHeatmap metrics={metrics} />
        </div>
        <div className="space-y-6">
          <RevisionQueue items={revisions} />
          <WeakSubjects subjects={subjects.filter((s: any) => s.is_weak)} />
        </div>
      </div>
    </div>
  );
}
