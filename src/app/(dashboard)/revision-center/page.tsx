/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, BookOpen, RefreshCw, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Revision Center" };

export default async function RevisionCenterPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString();

  const [{ data: overdue }, { data: upcoming }, { data: weakTopics }] = await Promise.all([
    supabase
      .from("revision_schedule")
      .select("*, topics(name, subjects(name))")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .lt("due_date", today.split("T")[0])
      .order("due_date", { ascending: true }) as any,
    supabase
      .from("revision_schedule")
      .select("*, topics(name, subjects(name))")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .gte("due_date", today.split("T")[0])
      .order("due_date", { ascending: true })
      .limit(20) as any,
    supabase
      .from("user_topic_progress")
      .select("*, topics(name, subjects(name))")
      .eq("user_id", user.id)
      .lte("confidence", 40)
      .limit(20) as any,
  ]);

  const overdueCount = overdue?.length ?? 0;
  const upcomingCount = upcoming?.length ?? 0;
  const weakCount = weakTopics?.length ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dentora-gradient px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Revision Center</h1>
            <p className="text-white/75 text-sm mt-0.5">Stay on top of your spaced repetition schedule</p>
          </div>
          <Link href="/ai-tutor">
            <Button className="gap-2 bg-white text-blue-600 hover:bg-white/90 border-0 font-semibold">
              <BookOpen className="h-4 w-4" />
              Start Revision
            </Button>
          </Link>
        </div>

        {/* Urgency banner if overdue */}
        {overdueCount > 0 && (
          <div className="mt-4 bg-red-500/20 border border-red-300/30 rounded-xl p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-200 shrink-0" />
            <p className="text-sm text-white">
              You have <strong>{overdueCount}</strong> overdue revision{overdueCount !== 1 ? "s" : ""} â€” tackle them first!
            </p>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`stat-card text-center ${overdueCount > 0 ? "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200/50 dark:border-red-800/30" : ""}`}>
            <div className={`text-3xl font-bold mb-0.5 ${overdueCount > 0 ? "text-red-500" : "text-foreground"}`}>{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
            {overdueCount > 0 && <AlertCircle className="h-4 w-4 text-red-400 mx-auto mt-1" />}
          </div>
          <div className="stat-card text-center bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <div className="text-3xl font-bold mb-0.5 text-blue-500">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
            <Clock className="h-4 w-4 text-blue-400 mx-auto mt-1" />
          </div>
          <div className="stat-card text-center bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <div className="text-3xl font-bold mb-0.5 text-amber-500">{weakCount}</div>
            <p className="text-xs text-muted-foreground">Weak Topics</p>
            <AlertCircle className="h-4 w-4 text-amber-400 mx-auto mt-1" />
          </div>
        </div>

        <Tabs defaultValue={overdueCount > 0 ? "overdue" : "upcoming"}>
          <TabsList>
            <TabsTrigger value="overdue" className="gap-2">
              Overdue
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs h-4 px-1.5">{overdueCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5 ml-1">{upcomingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="weak">Weak Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="overdue" className="mt-4 space-y-2">
            {overdueCount === 0 ? (
              <div className="stat-card">
                <div className="empty-state">
                  <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="font-semibold text-lg">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No overdue revisions â€” great work staying on track</p>
                </div>
              </div>
            ) : (
              (overdue ?? []).map((item: any) => (
                <RevisionItem key={item.id} item={item} isOverdue />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4 space-y-2">
            {upcomingCount === 0 ? (
              <div className="stat-card">
                <div className="empty-state">
                  <div className="empty-state-icon">ðŸ“…</div>
                  <p className="font-semibold">No upcoming revisions</p>
                  <p className="text-sm text-muted-foreground">Review flashcards to build your revision schedule</p>
                </div>
              </div>
            ) : (
              (upcoming ?? []).map((item: any) => <RevisionItem key={item.id} item={item} />)
            )}
          </TabsContent>

          <TabsContent value="weak" className="mt-4 space-y-2">
            {weakCount === 0 ? (
              <div className="stat-card">
                <div className="empty-state">
                  <div className="empty-state-icon">ðŸ’ª</div>
                  <p className="font-semibold">No weak topics identified</p>
                  <p className="text-sm text-muted-foreground">Keep studying â€” weak areas will be flagged automatically</p>
                </div>
              </div>
            ) : (
              (weakTopics ?? []).map((item: any) => (
                <Card key={item.id} className="hover:shadow-card-hover transition-all duration-200 border-amber-200/50 dark:border-amber-800/30">
                  <CardContent className="py-3.5 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.topics?.name ?? "Unknown Topic"}</p>
                        <p className="text-xs text-muted-foreground">{item.topics?.subjects?.name}</p>
                      </div>
                    </div>
                    <Link href={`/ai-tutor?topic=${item.topic_id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                        <BookOpen className="h-3 w-3" /> Study Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RevisionItem({ item, isOverdue }: { item: any; isOverdue?: boolean }) {
  const date = new Date(item.due_date);
  const daysOverdue = isOverdue ? Math.round((Date.now() - date.getTime()) / 86400000) : 0;

  return (
    <Card className={`hover:shadow-card-hover transition-all duration-200 ${isOverdue ? "border-red-200/60 dark:border-red-800/30 bg-red-50/30 dark:bg-red-950/10" : ""}`}>
      <CardContent className="py-3.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isOverdue ? "bg-red-500/10" : "bg-blue-500/10"}`}>
            <RefreshCw className={`h-4 w-4 ${isOverdue ? "text-red-500" : "text-blue-500"}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{item.topics?.name ?? "Unknown Topic"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">{item.topics?.subjects?.name}</p>
              <span className="text-muted-foreground text-xs">Â·</span>
              <p className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                {isOverdue ? `${daysOverdue}d overdue` : `Due ${format(new Date(item.due_date), "dd MMM")}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs border-0 ${(item.repetition_no ?? 0) >= 4 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
          >
            L{item.repetition_no ?? 1}
          </Badge>
          <Link href={`/ai-tutor?topic=${item.topic_id}`}>
            <Button size="sm" variant={isOverdue ? "default" : "outline"} className={`h-8 text-xs gap-1.5 ${isOverdue ? "dentora-gradient text-white border-0" : ""}`}>
              <RefreshCw className="h-3 w-3" /> Revise
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
