/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";

export const metadata: Metadata = { title: "Admin - Questions" };

const DIFFICULTY_STYLE: Record<string, string> = {
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default async function AdminQuestionsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*, subjects(name, code, color)")
    .order("created_at", { ascending: false })
    .limit(100) as any;

  const total = questions?.length ?? 0;
  const hardCount = (questions ?? []).filter((q: any) => q.difficulty === "hard").length;
  const medCount = (questions ?? []).filter((q: any) => q.difficulty === "medium").length;

  return (
    <div className="animate-fade-in">
      <div className="dentora-gradient px-6 py-8">
        <h1 className="text-xl font-bold text-white">Question Bank</h1>
        <p className="text-white/75 text-sm mt-0.5">{total} questions in database</p>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: total, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5" },
            { label: "Hard", value: hardCount, color: "text-red-500", bg: "from-red-500/10 to-red-600/5" },
            { label: "Medium", value: medCount, color: "text-amber-500", bg: "from-amber-500/10 to-amber-600/5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`stat-card text-center bg-gradient-to-br ${bg}`}>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> All Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {total === 0 ? (
              <div className="empty-state py-12">
                <div className="empty-state-icon">📋</div>
                <p className="font-semibold">No questions yet</p>
                <p className="text-sm text-muted-foreground max-w-xs text-center">
                  Questions are generated as students use the viva and quiz features.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Freq</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(questions ?? []).map((q: any) => (
                    <TableRow key={q.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{q.question_text}</p>
                      </TableCell>
                      <TableCell>
                        {q.subjects && (
                          <div className="flex items-center gap-1.5">
                            {q.subjects.color && (
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: q.subjects.color }} />
                            )}
                            <Badge variant="outline" className="text-[11px] font-mono">{q.subjects.code}</Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[11px] capitalize">{q.question_type ?? "mcq"}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-medium ${DIFFICULTY_STYLE[q.difficulty] ?? DIFFICULTY_STYLE.medium}`}>
                          {q.difficulty ?? "medium"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{q.frequency_count ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
