"use client";

import { TrendingDown } from "lucide-react";

interface WeakSubject {
  id: string;
  completion_pct: number;
  confidence_score: number;
  subjects: { name: string; color: string; code: string } | null;
}

export function WeakSubjects({ subjects }: { subjects: WeakSubject[] }) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown size={15} className="text-destructive" />
        <h3 className="text-sm font-semibold">Weak Areas</h3>
      </div>

      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No weak subjects flagged.</p>
      ) : (
        <div className="space-y-3">
          {subjects.map((item) => {
            const sub = item.subjects;
            const pct = Math.round(item.completion_pct ?? 0);
            const conf = item.confidence_score ?? 0;
            return (
              <div key={item.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sub?.color || "#ef4444" }}
                    />
                    <span className="text-sm font-medium">{sub?.code || "—"}</span>
                  </div>
                  <span className="text-xs text-destructive font-semibold">{pct}% done</span>
                </div>
                <p className="text-xs text-muted-foreground">{sub?.name}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Confidence:</span>
                  <div className="flex-1 bg-muted rounded-full h-1">
                    <div
                      className="h-1 rounded-full bg-destructive"
                      style={{ width: `${conf}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-destructive font-medium">{conf}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
