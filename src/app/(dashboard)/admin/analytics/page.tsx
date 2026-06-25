/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Admin - Analytics" };

const MEDAL = ["ðŸ¥‡", "ðŸ¥ˆ", "ðŸ¥‰"];

export default async function AdminAnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: topUsers }, { data: subjectStats }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, total_xp, current_streak, readiness_score")
      .order("total_xp", { ascending: false })
      .limit(10) as any,
    supabase
      .from("user_subject_progress")
      .select("subject_id, completion_pct, subjects(name, code, color)")
      .limit(200) as any,
  ]);

  const subjectAverages: Record<string, { name: string; code: string; color: string; total: number; count: number }> = {};
  (subjectStats ?? []).forEach((row: any) => {
    const key = row.subject_id;
    if (!subjectAverages[key]) {
      subjectAverages[key] = {
        name: row.subjects?.name ?? "",
        code: row.subjects?.code ?? "",
        color: row.subjects?.color ?? "#6366f1",
        total: 0,
        count: 0,
      };
    }
    subjectAverages[key].total += row.completion_pct ?? 0;
    subjectAverages[key].count += 1;
  });

  return (
    <div className="animate-fade-in">
      <div className="dentora-gradient px-6 py-8">
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-white/75 text-sm mt-0.5">Platform-wide performance insights</p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Top Students (by XP)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Readiness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(topUsers ?? []).map((u: any, i: number) => {
                    const initials = (u.full_name ?? "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                    const readiness = u.readiness_score ?? 0;
                    return (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg w-6 text-center">{MEDAL[i] ?? `#${i + 1}`}</span>
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{u.full_name ?? "â€”"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-blue-500">{(u.total_xp ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">ðŸ”¥ {u.current_streak ?? 0}d</TableCell>
                        <TableCell>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            readiness >= 70 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            readiness >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {readiness}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(topUsers?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">No data yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Subject averages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Subject Completion (avg)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(subjectAverages).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No subject progress data yet</p>
              ) : (
                <div className="space-y-4">
                  {Object.values(subjectAverages)
                    .sort((a, b) => (b.count > 0 ? b.total / b.count : 0) - (a.count > 0 ? a.total / a.count : 0))
                    .map((s) => {
                      const avg = s.count > 0 ? Math.round(s.total / s.count) : 0;
                      return (
                        <div key={s.code}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="font-medium">{s.code}</span>
                              <span className="text-muted-foreground text-xs hidden sm:inline truncate max-w-[120px]">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold" style={{ color: s.color }}>{avg}%</span>
                              <Badge variant="outline" className="text-[10px]">{s.count}</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{ width: `${avg}%`, backgroundColor: s.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
