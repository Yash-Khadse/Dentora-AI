"use client";

import { RefreshCw, AlertCircle } from "lucide-react";

interface RevisionItem {
  id: string;
  due_date: string;
  interval_days: number;
  topics: {
    name: string;
    subjects: { name: string; color: string } | null;
  } | null;
}

export function RevisionQueue({ items }: { items: RevisionItem[] }) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Revision Due</h3>
        {items.length > 0 && (
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
            {items.length} overdue
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6">
          <RefreshCw size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const topic = item.topics;
            const sub = topic?.subjects;
            return (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                <AlertCircle size={14} className="text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{topic?.name || "Unknown topic"}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: sub?.color || "#6b7280" }}
                    />
                    <span className="text-[10px] text-muted-foreground">{sub?.name || "—"}</span>
                  </div>
                </div>
                <span className="text-[10px] text-destructive font-medium shrink-0">Due</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
