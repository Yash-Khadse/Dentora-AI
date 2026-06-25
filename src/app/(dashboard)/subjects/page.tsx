/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { BDS_FINAL_YEAR_SUBJECTS } from "@/lib/constants/subjects";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: progress } = await supabase
    .from("user_subject_progress")
    .select("*")
    .eq("user_id", user.id) as any;

  const progressMap: Record<string, any> = {};
  (progress ?? []).forEach((p: any) => {
    progressMap[p.subject_id] = p;
  });

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, color") as any;

  const subjectIdMap: Record<string, string> = {};
  (subjects ?? []).forEach((s: any) => {
    subjectIdMap[s.code] = s.id;
  });

  const totalCompletion = BDS_FINAL_YEAR_SUBJECTS.reduce((sum, s) => {
    const id = subjectIdMap[s.code];
    const prog = id ? progressMap[id] : null;
    return sum + (prog?.completion_pct ?? 0);
  }, 0) / BDS_FINAL_YEAR_SUBJECTS.length;

  const weakCount = BDS_FINAL_YEAR_SUBJECTS.filter((s) => {
    const id = subjectIdMap[s.code];
    return id ? progressMap[id]?.is_weak : false;
  }).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dentora-gradient px-4 md:px-6 py-6 md:py-8">
        <h1 className="text-xl font-bold text-white">Subjects</h1>
        <p className="text-white/75 text-sm mt-0.5">Track your progress across all 6 BDS final year subjects</p>

        {/* Overall stats */}
        <div className="mt-4 md:mt-5 grid grid-cols-3 gap-2 md:gap-3">
          {[
            { label: "Overall Progress", value: `${Math.round(totalCompletion)}%`, icon: "📊" },
            { label: "Subjects", value: "6", icon: "📚" },
            { label: "Need Attention", value: weakCount.toString(), icon: "⚠️" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-lg">{icon}</div>
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-[11px] text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {BDS_FINAL_YEAR_SUBJECTS.map((subject) => {
            const subjectId = subjectIdMap[subject.code];
            const prog = subjectId ? progressMap[subjectId] : null;
            const completion = prog?.completion_pct ?? 0;
            const isWeak = prog?.is_weak ?? false;
            const confidenceScore: number | undefined = prog?.confidence_score;
            const confidenceLabel = confidenceScore == null ? null
              : confidenceScore >= 70 ? "strong"
              : confidenceScore >= 40 ? "moderate"
              : "weak";

            const confidenceConfig: Record<string, { label: string; cls: string }> = {
              strong: { label: "Strong", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
              moderate: { label: "Moderate", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
              weak: { label: "Weak", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
            };
            const confCfg = confidenceLabel ? confidenceConfig[confidenceLabel] : null;

            return (
              <Link key={subject.code} href={`/subjects/${subjectId ?? subject.code}`}>
                <div className={cn(
                  "group relative rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
                  isWeak ? "border-red-200/60 dark:border-red-800/30" : "border-border"
                )}>
                  {/* Subject color top band */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: subject.color }} />

                  <div className="p-5 bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.code.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">{subject.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{subject.total_topics} topics</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isWeak && (
                          <span className="badge-danger text-[10px]">Weak</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-semibold" style={{ color: subject.color }}>{completion}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${completion}%`, backgroundColor: subject.color }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Exam weightage</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{subject.exam_weightage}%</span>
                        </div>
                      </div>

                      {confCfg && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", confCfg.cls)}>
                            {confCfg.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
