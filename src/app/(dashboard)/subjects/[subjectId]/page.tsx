/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, Mic } from "lucide-react";

export const metadata: Metadata = { title: "Subject Detail" };

export default async function SubjectDetailPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: subject }, { data: topics }, { data: progress }] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", subjectId).single() as any,
    supabase.from("topics").select("*").eq("subject_id", subjectId).order("order_index") as any,
    supabase.from("user_topic_progress").select("*").eq("user_id", user.id) as any,
  ]);

  if (!subject) redirect("/subjects");

  const progressMap: Record<string, any> = {};
  (progress ?? []).forEach((p: any) => { progressMap[p.topic_id] = p; });

  const completedTopics = (topics ?? []).filter((t: any) => progressMap[t.id]?.status === "completed").length;
  const totalTopics = (topics ?? []).length;
  const completion = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/subjects">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          <p className="text-muted-foreground text-sm">{totalTopics} topics · {completion}% complete</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{completion}%</div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <Progress value={completion} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{completedTopics}</div>
            <p className="text-sm text-muted-foreground">Topics completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalTopics - completedTopics}</div>
            <p className="text-sm text-muted-foreground">Topics remaining</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href={`/ai-tutor?subject=${subjectId}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Study with AI Tutor
          </Button>
        </Link>
        <Link href={`/viva-simulator?subject=${subjectId}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Mic className="h-4 w-4" />
            Viva Practice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(topics ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Topics will appear after your study plan is generated.</p>
          ) : (
            (topics ?? []).map((topic: any, idx: number) => {
              const tp = progressMap[topic.id];
              const isCompleted = tp?.status === "completed";
              const confidenceScore: number | undefined = tp?.confidence;
              const confidence = confidenceScore == null ? null
                : confidenceScore >= 70 ? "strong"
                : confidenceScore >= 40 ? "average"
                : "weak";

              return (
                <div key={topic.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6 text-right">{idx + 1}</span>
                    <div>
                      <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        {topic.name}
                      </p>
                      {topic.estimated_hours && (
                        <p className="text-xs text-muted-foreground">{topic.estimated_hours}h estimated</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {confidence && (
                      <Badge variant={confidence === "strong" ? "default" : confidence === "average" ? "secondary" : "destructive"} className="text-xs">
                        {confidence}
                      </Badge>
                    )}
                    {isCompleted && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Done</Badge>}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
