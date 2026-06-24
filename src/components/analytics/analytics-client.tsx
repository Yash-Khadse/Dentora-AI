"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Zap, Clock, TrendingUp, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Metrics {
  readiness_score: number;
  total_study_hours: number;
  current_streak: number;
  best_streak: number;
  topics_completed: number;
  avg_session_duration: number;
}

interface StreakDay { study_date: string; minutes: number; }

interface SubjectProgress {
  subject_id: string;
  completion_pct: number;
  confidence_score?: number;
  is_weak: boolean;
  subjects: { name: string; code: string; color: string };
}

interface Achievement {
  earned_at: string;
  achievements: { name: string; icon: string; xp_reward: number };
}

interface Props {
  metrics: Metrics | null;
  streakLog: StreakDay[];
  subjectProgress: SubjectProgress[];
  achievements: Achievement[];
}

const INTENSITY_STEPS = [
  { min: 0, max: 0, className: "bg-muted dark:bg-muted/40" },
  { min: 1, max: 30, className: "bg-blue-200 dark:bg-blue-900/40" },
  { min: 31, max: 90, className: "bg-blue-400 dark:bg-blue-700/60" },
  { min: 91, max: 180, className: "bg-blue-600 dark:bg-blue-500/80" },
  { min: 181, max: Infinity, className: "bg-blue-700 dark:bg-blue-400" },
];

function getIntensityClass(minutes: number) {
  return INTENSITY_STEPS.find((s) => minutes >= s.min && minutes <= s.max)?.className ?? "bg-muted";
}

const STAT_CARDS = [
  { label: "Readiness", key: "readiness_score", suffix: "%", icon: Target, color: "text-primary", bg: "from-blue-500/10 to-blue-600/5" },
  { label: "Study Hours", key: "total_study_hours", suffix: "h", icon: Clock, color: "text-sky-500", bg: "from-sky-500/10 to-sky-600/5", round: true },
  { label: "Current Streak", key: "current_streak", suffix: "d", icon: Zap, color: "text-amber-500", bg: "from-amber-500/10 to-orange-500/5" },
  { label: "Best Streak", key: "best_streak", suffix: "d", icon: Trophy, color: "text-yellow-500", bg: "from-yellow-500/10 to-yellow-600/5" },
  { label: "Topics Done", key: "topics_completed", suffix: "", icon: BookOpen, color: "text-green-500", bg: "from-green-500/10 to-green-600/5" },
  { label: "Avg Session", key: "avg_session_duration", suffix: "m", icon: TrendingUp, color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/5", round: true },
];

export function AnalyticsClient({ metrics, streakLog, subjectProgress, achievements }: Props) {
  const streakMap: Record<string, number> = {};
  streakLog.forEach((d) => { streakMap[d.study_date] = d.minutes; });

  const today = new Date();
  const days: Date[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const totalMinutes = streakLog.reduce((sum, d) => sum + d.minutes, 0);
  const activeDays = streakLog.filter((d) => d.minutes > 0).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Your study performance and progress at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map(({ label, key, suffix, icon: Icon, color, bg, round }, i) => {
          const raw = metrics?.[key as keyof Metrics] ?? 0;
          const value = round ? Math.round(raw as number) : raw;
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn("stat-card bg-gradient-to-br", bg)}
            >
              <Icon className={cn("h-4 w-4 mb-3", color)} />
              <div className={cn("text-2xl font-bold", color)}>{value}{suffix}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="heatmap">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="heatmap">Study Heatmap</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Heatmap */}
        <TabsContent value="heatmap" className="mt-4">
          <div className="stat-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">30-Day Study Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeDays} active days · {Math.round(totalMinutes / 60)}h total
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Less</span>
                {[0, 20, 60, 120, 180].map((m) => (
                  <div key={m} className={cn("w-4 h-4 rounded-sm", getIntensityClass(m))} />
                ))}
                <span>More</span>
              </div>
            </div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const mins = streakMap[key] ?? 0;
                const isToday = key === format(today, "yyyy-MM-dd");
                return (
                  <div
                    key={key}
                    title={`${format(day, "dd MMM")}: ${mins > 0 ? `${mins}min` : "No study"}`}
                    className={cn(
                      "aspect-square rounded-sm transition-all cursor-default",
                      getIntensityClass(mins),
                      isToday && "ring-2 ring-primary ring-offset-1"
                    )}
                  />
                );
              })}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground border-t pt-3">
              <span>🔵 &lt;30min · light study</span>
              <span>🟦 30-90min · good session</span>
              <span>🔷 90min+ · power study</span>
            </div>
          </div>
        </TabsContent>

        {/* Subjects */}
        <TabsContent value="subjects" className="mt-4 space-y-3">
          {subjectProgress.length === 0 ? (
            <div className="stat-card">
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p className="font-medium">No subject data yet</p>
                <p className="text-sm text-muted-foreground">Start studying to track your progress here</p>
              </div>
            </div>
          ) : (
            subjectProgress.map((sp, i) => (
              <motion.div
                key={sp.subject_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="stat-card"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: sp.subjects?.color ?? "#6366f1" }}
                  >
                    {sp.subjects?.code?.slice(0, 2) ?? "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{sp.subjects?.name}</p>
                      {sp.is_weak && <span className="badge-danger">Weak</span>}
                      {!sp.is_weak && sp.completion_pct >= 70 && <span className="badge-success">Strong</span>}
                    </div>
                    {sp.confidence_score !== undefined && sp.confidence_score > 0 && (
                      <p className="text-xs text-muted-foreground">Confidence: {sp.confidence_score}%</p>
                    )}
                  </div>
                  <span className={cn(
                    "text-lg font-bold",
                    sp.completion_pct >= 70 ? "text-green-500" : sp.completion_pct >= 40 ? "text-amber-500" : "text-red-500"
                  )}>
                    {sp.completion_pct}%
                  </span>
                </div>
                <Progress value={sp.completion_pct} className="h-2" />
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="mt-4">
          {achievements.length === 0 ? (
            <div className="stat-card">
              <div className="empty-state">
                <div className="empty-state-icon">🏆</div>
                <p className="font-medium">No achievements yet</p>
                <p className="text-sm text-muted-foreground">Keep studying to unlock achievements and earn XP!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ua, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="stat-card flex items-center gap-4"
                >
                  <div className="text-3xl w-12 h-12 flex items-center justify-center bg-muted rounded-xl shrink-0">
                    {ua.achievements?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{ua.achievements?.name}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(ua.earned_at), "dd MMM yyyy")}</p>
                  </div>
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Zap className="h-3 w-3 text-amber-500" />
                    +{ua.achievements?.xp_reward}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
