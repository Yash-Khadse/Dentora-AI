/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Admin - Subjects" };

export default async function AdminSubjectsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*, topics(count)")
    .order("code") as any;

  const total = subjects?.length ?? 0;
  const totalTopics = (subjects ?? []).reduce((sum: number, s: any) => sum + (s.topics?.[0]?.count ?? 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="dentora-gradient px-6 py-8">
        <h1 className="text-xl font-bold text-white">Subjects</h1>
        <p className="text-white/75 text-sm mt-0.5">Manage BDS subjects and topics</p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card text-center bg-gradient-to-br from-green-500/10 to-green-600/5">
            <div className="text-3xl font-bold text-green-500">{total}</div>
            <p className="text-xs text-muted-foreground">Subjects</p>
          </div>
          <div className="stat-card text-center bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <div className="text-3xl font-bold text-purple-500">{totalTopics}</div>
            <p className="text-xs text-muted-foreground">Total Topics</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> All Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Weightage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subjects ?? []).map((subject: any) => (
                  <TableRow key={subject.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: subject.color ?? "#888" }}
                        >
                          {(subject.code ?? "??").slice(0, 2)}
                        </div>
                        <span className="font-medium text-sm">{subject.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">{subject.code}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{subject.topics?.[0]?.count ?? 0}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{subject.exam_weightage ?? 0}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="badge-success text-[11px]">Active</span>
                    </TableCell>
                  </TableRow>
                ))}
                {total === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      No subjects found. Run the database migrations to seed subjects.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
