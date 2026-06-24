"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubjectProgress {
  id: string;
  completion_pct: number;
  confidence_score: number;
  revision_status: string;
  is_weak: boolean;
  is_strong: boolean;
  subjects: { name: string; color: string; code: string } | null;
}

export function SubjectProgress({ subjects }: { subjects: SubjectProgress[] }) {
  if (subjects.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold mb-3">Subject Progress</h3>
        <p className="text-sm text-muted-foreground text-center py-4">No progress data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-5">
      <h3 className="text-sm font-semibold mb-4">Subject Progress</h3>
      <div className="space-y-3">
        {subjects.map((item, i) => {
          const sub = item.subjects;
          const pct = Math.round(item.completion_pct ?? 0);
          return (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub?.color || "#6b7280" }}
                  />
                  <span className="text-sm font-medium">{sub?.code || "—"}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{sub?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.is_weak && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">Weak</span>
                  )}
                  {item.is_strong && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">Strong</span>
                  )}
                  <span className={cn("text-sm font-bold", pct >= 70 ? "text-green-500" : pct >= 40 ? "text-amber-500" : "text-red-500")}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.07 }}
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: sub?.color || "#6b7280" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
