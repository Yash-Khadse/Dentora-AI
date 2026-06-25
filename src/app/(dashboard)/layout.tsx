/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, study_streak, onboarding_completed")
    .eq("user_id", user.id)
    .single() as any;

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false) as any;

  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single() as any;

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DS";

  return (
    <DashboardShell
      isAdmin={userRecord?.role === "admin"}
      topbarProps={{
        userInitials: initials,
        avatarUrl: profile?.avatar_url || undefined,
        userName: profile?.full_name?.split(" ")[0] || "Student",
        streak: profile?.study_streak || 0,
        unreadNotifications: unreadCount || 0,
      }}
    >
      {children}
    </DashboardShell>
  );
}
