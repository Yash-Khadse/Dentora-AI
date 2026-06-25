"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Clock, RefreshCw, Zap, Mic, Loader2, CalendarDays,
  CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, Target,
  AlertTriangle, TrendingUp, BookMarked, Brain,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Subject { name: string; code: string; color: string }

interface StudySession {
  id: string;
  subject_id: string | null;
  subjects: Subject | null;
  session_type: "study" | "revision" | "practice" | "viva" | "break";
  session_date: string;
  start_time: string;
  end_time: string;
  planned_duration_mins: number;
  status: "scheduled" | "completed" | "missed" | "skipped";
  notes: string | null;
}

interface StudyPlan {
  id: string;
  exam_date: string;
  ai_summary: string | null;
  ai_strategy: PlanData | null;
  total_sessions: number;
  completed_sessions: number;
  is_active: boolean;
}

interface PlanData {
  summary?: string;
  strategy?: string[];
  weekly_focus?: { week: number; theme: string; subjects: string[]; goal: string }[];
  subject_priority?: { subject: string; priority: string; hours_per_week: number; reason: string }[];
  textbook_plan?: { subject: string; recommended_book: string; chapters_this_week?: string[]; exam_guide?: string; study_tip?: string }[];
  exam_week_plan?: string;
  warnings?: string[];
  motivational_message?: string;
}

interface Props {
  studyPlan: StudyPlan | null;
  sessions: StudySession[];
  userId: string;
  examDate: string | null;
}

// â”€â”€ Session type config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SESSION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  study:    { icon: BookOpen, color: "text-blue-500",   bg: "bg-blue-500/10",   label: "Study" },
  revision: { icon: RefreshCw, color: "text-green-500", bg: "bg-green-500/10",  label: "Revision" },
  practice: { icon: Zap,       color: "text-amber-500", bg: "bg-amber-500/10",  label: "Practice" },
  viva:     { icon: Mic,       color: "text-red-500",   bg: "bg-red-500/10",    label: "Viva" },
  break:    { icon: Clock,     color: "text-gray-400",  bg: "bg-gray-400/10",   label: "Break" },
};

// â”€â”€ Plan Overview Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PlanOverview({ plan }: { plan: StudyPlan }) {
  const pd = plan.ai_strategy;
  const [showAll, setShowAll] = useState(false);
  if (!pd) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {pd.summary && (
        <div className="stat-card space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">AI Plan Summary</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{pd.summary}</p>
          {pd.motivational_message && (
            <p className="text-xs text-primary italic border-l-2 border-primary/30 pl-3 mt-2">{pd.motivational_message}</p>
          )}
        </div>
      )}

      {/* Strategy bullets */}
      {pd.strategy && pd.strategy.length > 0 && (
        <div className="stat-card space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Study Strategy</p>
          </div>
          <ul className="space-y-1.5">
            {pd.strategy.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 shrink-0">â€¢</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Subject Priority */}
      {pd.subject_priority && pd.subject_priority.length > 0 && (
        <div className="stat-card space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Subject Priority</p>
          </div>
          {pd.subject_priority.map((sp, i) => (
            <div key={i} className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={cn("text-[10px] shrink-0 px-2", {
                  "border-red-400 text-red-600 dark:text-red-400":    sp.priority === "high",
                  "border-amber-400 text-amber-600 dark:text-amber-400": sp.priority === "medium",
                  "border-green-400 text-green-600 dark:text-green-400": sp.priority === "low",
                })}
              >
                {sp.priority?.toUpperCase()}
              </Badge>
              <div>
                <p className="text-sm font-medium">{sp.subject}</p>
                <p className="text-xs text-muted-foreground">{sp.hours_per_week}h/week Â· {sp.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Textbook Plan */}
      {pd.textbook_plan && pd.textbook_plan.length > 0 && (
        <div className="stat-card space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Textbook Recommendations</p>
          </div>
          {(showAll ? pd.textbook_plan : pd.textbook_plan.slice(0, 4)).map((tb, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-1.5 bg-muted/20">
              <p className="text-xs font-semibold text-primary">{tb.subject}</p>
              <p className="text-xs font-medium">{tb.recommended_book}</p>
              {tb.exam_guide && (
                <p className="text-xs text-muted-foreground">Exam guide: {tb.exam_guide}</p>
              )}
              {tb.study_tip && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                  <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />{tb.study_tip}
                </p>
              )}
            </div>
          ))}
          {pd.textbook_plan.length > 4 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              {showAll ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Show {pd.textbook_plan.length - 4} more</>}
            </button>
          )}
        </div>
      )}

      {/* Warnings */}
      {pd.warnings && pd.warnings.length > 0 && (
        <div className="stat-card border-amber-200 dark:border-amber-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-semibold">Things to Watch</p>
          </div>
          {pd.warnings.map((w, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-amber-500 mt-0.5 shrink-0">âš </span>{w}
            </p>
          ))}
        </div>
      )}

      {/* Exam week plan */}
      {pd.exam_week_plan && (
        <div className="stat-card bg-primary/5 border-primary/20 space-y-2">
          <p className="text-sm font-semibold text-primary">Final Week Strategy</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{pd.exam_week_plan}</p>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Session Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SessionCard({
  session,
  index,
  onToggle,
}: {
  session: StudySession;
  index: number;
  onToggle: (id: string, done: boolean) => void;
}) {
  const cfg = SESSION_CONFIG[session.session_type] ?? SESSION_CONFIG.study;
  const Icon = cfg.icon;
  const done = session.status === "completed";
  const subjectName = session.subjects?.name ?? session.notes?.split("â€”")[1]?.trim() ?? null;
  const subjectColor = session.subjects?.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "border rounded-xl p-3.5 flex items-center gap-3 transition-all duration-200",
        done
          ? "opacity-50 bg-muted/30"
          : "bg-card hover:shadow-sm hover:border-primary/30"
      )}
    >
      {/* Type icon */}
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", done && "line-through text-muted-foreground")}>
            {cfg.label}
          </span>
          {subjectColor && !done && (
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: subjectColor }}
            />
          )}
        </div>
        {subjectName && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{subjectName}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {session.start_time?.slice(0, 5)} â€“ {session.end_time?.slice(0, 5)}
          </span>
          <span className="text-[10px] text-muted-foreground">Â·</span>
          <span className="text-[10px] text-muted-foreground">{session.planned_duration_mins}m</span>
        </div>
      </div>

      {/* Complete toggle */}
      <button
        onClick={() => onToggle(session.id, !done)}
        className={cn(
          "shrink-0 transition-colors",
          done ? "text-green-500" : "text-muted-foreground/40 hover:text-primary"
        )}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>
    </motion.div>
  );
}

// â”€â”€ Day Group â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DayGroup({
  date,
  daySessions,
  onToggle,
}: {
  date: string;
  daySessions: StudySession[];
  onToggle: (id: string, done: boolean) => void;
}) {
  const done = daySessions.filter((s) => s.status === "completed").length;
  const total = daySessions.length;
  const totalMins = daySessions.reduce((sum, s) => sum + (s.planned_duration_mins ?? 0), 0);
  const isToday = date === new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className={cn("text-sm font-semibold", isToday && "text-primary")}>
            {isToday ? "Today Â· " : ""}{format(parseISO(date), "EEEE, dd MMM")}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
            {Math.floor(totalMins / 60)}h {totalMins % 60 > 0 ? `${totalMins % 60}m` : ""}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{done}/{total} done</span>
      </div>
      <div className="space-y-2 pl-6 border-l-2 border-muted ml-2">
        {daySessions.map((s, i) => (
          <SessionCard key={s.id} session={s} index={i} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function StudyPlannerClient({ studyPlan, sessions: initialSessions, examDate }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>(initialSessions);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(studyPlan);

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.session_date === today);
  const upcomingSessions = sessions.filter((s) => s.session_date > today);
  const todayDone = todaySessions.filter((s) => s.status === "completed").length;
  const todayProgress = todaySessions.length > 0 ? (todayDone / todaySessions.length) * 100 : 0;

  // Group upcoming by date
  const grouped: Record<string, StudySession[]> = {};
  upcomingSessions.forEach((s) => {
    if (!grouped[s.session_date]) grouped[s.session_date] = [];
    grouped[s.session_date].push(s);
  });

  // Days until exam
  const daysLeft = examDate
    ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const toggleSession = useCallback(async (sessionId: string, done: boolean) => {
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => s.id === sessionId ? { ...s, status: done ? "completed" : "scheduled" } : s)
    );
    try {
      await fetch("/api/study-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, isCompleted: done }),
      });
    } catch {
      // Revert on failure
      setSessions((prev) =>
        prev.map((s) => s.id === sessionId ? { ...s, status: done ? "scheduled" : "completed" } : s)
      );
    }
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/planner", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      // Reload the page to fetch fresh sessions from DB
      window.location.reload();
    } catch (err) {
      setError((err as Error).message || "Could not generate plan. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  // â”€â”€ Empty state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!currentPlan && sessions.length === 0) {
    return (
      <div className="p-4 md:p-6 animate-fade-in max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="page-title">Study Planner</h1>
          <p className="page-subtitle">AI-powered personalized study schedule</p>
        </div>
        <div className="stat-card text-center space-y-5 py-10">
          <div className="w-20 h-20 dentora-gradient rounded-2xl flex items-center justify-center text-4xl mx-auto">ðŸ“…</div>
          <div>
            <h2 className="text-xl font-bold">No Study Plan Yet</h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
              Let our AI build a personalized schedule using your exam date, subjects, and weak areas from your profile.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="bg-muted/50 rounded-lg p-3">ðŸ“Š Smart scheduling</div>
            <div className="bg-muted/50 rounded-lg p-3">ðŸŽ¯ Weak-area focus</div>
            <div className="bg-muted/50 rounded-lg p-3">ðŸ” Spaced revision</div>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}
          <Button
            onClick={generatePlan}
            disabled={generating}
            className="gap-2 dentora-gradient text-white border-0 hover:opacity-90 px-8"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {generating ? "Generating your planâ€¦" : "Generate My Study Plan"}
          </Button>
          {generating && (
            <p className="text-xs text-muted-foreground animate-pulse">
              AI is building your personalised scheduleâ€¦ this takes ~15 seconds
            </p>
          )}
        </div>
      </div>
    );
  }

  // â”€â”€ Main planner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dentora-gradient px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Study Planner</h1>
            {examDate && (
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-white/75 text-xs">
                  Exam: {format(parseISO(examDate), "dd MMM yyyy")}
                </p>
                {daysLeft !== null && (
                  <Badge className="bg-white/20 text-white border-0 text-[10px]">
                    {daysLeft > 0 ? `${daysLeft} days left` : "Exam today!"}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={generatePlan}
            disabled={generating}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Regenerate
          </Button>
        </div>

        {/* Today's progress */}
        {todaySessions.length > 0 && (
          <div className="mt-4 bg-white/10 rounded-xl p-3">
            <div className="flex justify-between text-xs text-white/80 mb-1.5">
              <span>Today&apos;s progress</span>
              <span className="font-medium">{todayDone}/{todaySessions.length} sessions</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${todayProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-2 rounded-full bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4">
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}

      <div className="p-4 md:p-6">
        <Tabs defaultValue="today">
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1 gap-1.5">
              Today
              {todaySessions.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4.5 px-1.5">{todaySessions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming
              {Object.keys(grouped).length > 0 && (
                <Badge variant="secondary" className="text-xs h-4.5 px-1.5 ml-1.5">{Object.keys(grouped).length}d</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex-1">Plan</TabsTrigger>
          </TabsList>

          {/* â”€â”€ Today tab â”€â”€ */}
          <TabsContent value="today" className="mt-4 space-y-2">
            <AnimatePresence mode="wait">
              {todaySessions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="stat-card"
                >
                  <div className="empty-state py-10">
                    <div className="empty-state-icon">âœ…</div>
                    <p className="font-medium">All clear today!</p>
                    <p className="text-sm text-muted-foreground">No sessions scheduled for today.</p>
                  </div>
                </motion.div>
              ) : (
                todaySessions.map((s, i) => (
                  <SessionCard key={s.id} session={s} index={i} onToggle={toggleSession} />
                ))
              )}
            </AnimatePresence>

            {todayDone === todaySessions.length && todaySessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="stat-card text-center py-6 bg-green-500/5 border-green-200 dark:border-green-800"
              >
                <p className="text-2xl mb-1">ðŸŽ‰</p>
                <p className="font-semibold text-green-700 dark:text-green-400">All done for today!</p>
                <p className="text-xs text-muted-foreground mt-1">Great work â€” rest up for tomorrow.</p>
              </motion.div>
            )}
          </TabsContent>

          {/* â”€â”€ Upcoming tab â”€â”€ */}
          <TabsContent value="upcoming" className="mt-4">
            {Object.keys(grouped).length === 0 ? (
              <div className="stat-card">
                <div className="empty-state py-10">
                  <div className="empty-state-icon">ðŸ“…</div>
                  <p className="font-medium">No upcoming sessions</p>
                  <p className="text-sm text-muted-foreground">Regenerate your plan to schedule the next 2 weeks.</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[520px] pr-1">
                <div className="space-y-6 pb-4">
                  {Object.entries(grouped).map(([date, daySessions]) => (
                    <DayGroup key={date} date={date} daySessions={daySessions} onToggle={toggleSession} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* â”€â”€ Plan overview tab â”€â”€ */}
          <TabsContent value="overview" className="mt-4">
            {currentPlan ? (
              <ScrollArea className="h-[520px] pr-1">
                <PlanOverview plan={currentPlan} />
              </ScrollArea>
            ) : (
              <div className="stat-card">
                <div className="empty-state py-10">
                  <div className="empty-state-icon">ðŸ¤–</div>
                  <p className="font-medium">No plan data yet</p>
                  <p className="text-sm text-muted-foreground">Generate a plan to see your AI strategy here.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
