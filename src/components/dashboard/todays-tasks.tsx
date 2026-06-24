"use client";

import { CheckCircle2, Clock, BookOpen, Mic, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  session_type: string;
  status: string;
  start_time: string;
  end_time: string;
  planned_duration_mins: number;
  subjects?: { name: string; color: string } | null;
  topics?: { name: string } | null;
}

const SESSION_ICONS: Record<string, React.ElementType> = {
  study: BookOpen,
  revision: RefreshCw,
  practice: Zap,
  viva: Mic,
  break: Clock,
};

const SESSION_COLORS: Record<string, string> = {
  study: "text-blue-500 bg-blue-500/10",
  revision: "text-green-500 bg-green-500/10",
  practice: "text-amber-500 bg-amber-500/10",
  viva: "text-red-500 bg-red-500/10",
  break: "text-gray-500 bg-gray-500/10",
};

export function TodaysTasks({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold mb-3">Today&apos;s Schedule</h3>
        <p className="text-sm text-muted-foreground text-center py-6">
          No sessions scheduled for today. Complete onboarding to generate your plan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Today&apos;s Schedule</h3>
        <span className="text-xs text-muted-foreground">
          {sessions.filter((s) => s.status === "completed").length}/{sessions.length} done
        </span>
      </div>
      <div className="space-y-2">
        {sessions.map((session) => {
          const Icon = SESSION_ICONS[session.session_type] || BookOpen;
          const colorClass = SESSION_COLORS[session.session_type] || SESSION_COLORS.study;
          const isDone = session.status === "completed";
          return (
            <div
              key={session.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                isDone ? "opacity-60 bg-muted/30" : "bg-background hover:bg-muted/30"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>
                  {session.topics?.name || session.subjects?.name || `${session.session_type} session`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)} · {session.planned_duration_mins}min
                </p>
              </div>
              {isDone && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
