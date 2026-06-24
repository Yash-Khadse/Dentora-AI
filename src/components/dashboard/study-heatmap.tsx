"use client";

import { motion } from "framer-motion";
import { cn, minutesToHoursLabel } from "@/lib/utils";
import { subDays, format, startOfDay, isSameDay } from "date-fns";

interface Metric {
  metric_date: string;
  study_minutes: number;
}

function getIntensity(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 90) return 2;
  if (minutes < 180) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  "bg-muted",
  "bg-blue-200 dark:bg-blue-900",
  "bg-blue-400 dark:bg-blue-700",
  "bg-blue-500 dark:bg-blue-600",
  "bg-blue-600 dark:bg-blue-500",
];

export function StudyHeatmap({ metrics }: { metrics: Metric[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));

  const minutesByDate = new Map<string, number>();
  for (const m of metrics) {
    minutesByDate.set(m.metric_date, m.study_minutes);
  }

  const totalMinutes = metrics.reduce((sum, m) => sum + (m.study_minutes || 0), 0);

  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">30-Day Study Activity</h3>
        <span className="text-xs text-muted-foreground">
          Total: {minutesToHoursLabel(totalMinutes)}
        </span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const minutes = minutesByDate.get(key) || 0;
          const intensity = getIntensity(minutes);
          const isToday = isSameDay(day, today);
          return (
            <motion.div
              key={key}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: days.indexOf(day) * 0.01 }}
              title={`${format(day, "MMM d")}: ${minutesToHoursLabel(minutes)}`}
              className={cn(
                "w-6 h-6 rounded-sm cursor-default transition-colors",
                INTENSITY_CLASSES[intensity],
                isToday && "ring-2 ring-primary ring-offset-1"
              )}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={i} className={cn("w-3 h-3 rounded-sm", cls)} />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
