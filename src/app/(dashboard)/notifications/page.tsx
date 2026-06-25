/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string | null;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  reminder: { icon: "â°", color: "text-blue-600", bg: "bg-blue-500/10" },
  achievement: { icon: "ðŸ†", color: "text-amber-600", bg: "bg-amber-500/10" },
  plan_update: { icon: "ðŸ“…", color: "text-purple-600", bg: "bg-purple-500/10" },
  streak: { icon: "ðŸ”¥", color: "text-orange-600", bg: "bg-orange-500/10" },
  ai_insight: { icon: "ðŸ¤–", color: "text-teal-600", bg: "bg-teal-500/10" },
  exam_alert: { icon: "ðŸš¨", color: "text-red-600", bg: "bg-red-500/10" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="animate-fade-in">
      <div className="dentora-gradient px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-white/75 text-sm mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllRead}
              disabled={markingAll}
              className="gap-2 bg-white text-blue-600 hover:bg-white/90 border-0 font-semibold"
            >
              {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="stat-card">
            <div className="empty-state">
              <div className="empty-state-icon">ðŸ””</div>
              <p className="font-semibold text-lg">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                Study reminders, achievements, and plan updates will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.reminder;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className={cn(
                      "transition-all duration-200 cursor-pointer",
                      !n.is_read
                        ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/30 opacity-70"
                    )}
                    onClick={() => !n.is_read && markRead(n.id)}
                  >
                    <CardContent className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg", cfg.bg)}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold">{n.title}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(n.created_at), "dd MMM, h:mm a")}
                              </span>
                              {!n.is_read && (
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                              {n.type.replace("_", " ")}
                            </Badge>
                            {!n.is_read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                              >
                                <Check className="h-2.5 w-2.5" /> Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
