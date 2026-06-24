/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { Users, BookOpen, FileText, Activity, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { count: userCount },
    { count: subjectCount },
    { count: questionCount },
    { count: sessionCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }) as any,
    supabase.from("subjects").select("*", { count: "exact", head: true }) as any,
    supabase.from("questions").select("*", { count: "exact", head: true }) as any,
    supabase.from("viva_sessions").select("*", { count: "exact", head: true }) as any,
  ]);

  const stats = [
    { label: "Total Users", value: userCount ?? 0, icon: Users, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5", iconBg: "bg-blue-500/10" },
    { label: "Subjects", value: subjectCount ?? 0, icon: BookOpen, color: "text-green-500", bg: "from-green-500/10 to-green-600/5", iconBg: "bg-green-500/10" },
    { label: "Questions", value: questionCount ?? 0, icon: FileText, color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/5", iconBg: "bg-purple-500/10" },
    { label: "Viva Sessions", value: sessionCount ?? 0, icon: Activity, color: "text-amber-500", bg: "from-amber-500/10 to-amber-600/5", iconBg: "bg-amber-500/10" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="dentora-gradient px-6 py-8">
        <h1 className="text-xl font-bold text-white">Admin Overview</h1>
        <p className="text-white/75 text-sm mt-0.5">Dentora AI platform statistics and management</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, iconBg }) => (
            <div key={label} className={`stat-card bg-gradient-to-br ${bg}`}>
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Platform Health</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {(userCount ?? 0) > 0
              ? `${userCount} students enrolled. Avg ${Math.round((sessionCount ?? 0) / Math.max(userCount ?? 1, 1))} viva sessions per user.`
              : "No users registered yet. Share the platform invite link to get started."}
          </p>
        </div>
      </div>
    </div>
  );
}
