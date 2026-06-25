"use client";

import { motion } from "framer-motion";
import { Flame, Clock, Target, Brain } from "lucide-react";
import { getExamCountdownLabel, getReadinessColor } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface HeroProps {
  userName: string;
  examDate?: string | null;
  stats: {
    examDaysLeft: number;
    readinessScore: number;
    studyStreak: number;
    flashcardsDue: number;
    todaySessionsTotal: number;
    todaySessionsDone: number;
  };
}

export function DashboardHero({ userName, examDate, stats }: HeroProps) {
  const countdown = getExamCountdownLabel(stats.examDaysLeft);
  const readinessColor = getReadinessColor(stats.readinessScore);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const cards = [
    {
      label: "Exam Countdown",
      value: countdown.label,
      sub: examDate ? `on ${formatDate(examDate)}` : "Set your exam date",
      icon: Clock,
      color: countdown.color,
      bg: "from-blue-500/10 to-blue-600/5",
    },
    {
      label: "Readiness Score",
      value: `${stats.readinessScore}%`,
      sub: stats.readinessScore >= 60 ? "On track!" : "Need more study",
      icon: Target,
      color: readinessColor,
      bg: "from-teal-500/10 to-teal-600/5",
    },
    {
      label: "Study Streak",
      value: `${stats.studyStreak} days`,
      sub: stats.studyStreak > 0 ? "Keep it going!" : "Start today",
      icon: Flame,
      color: stats.studyStreak > 6 ? "text-amber-500" : "text-orange-400",
      bg: "from-amber-500/10 to-orange-500/5",
    },
    {
      label: "Today's Progress",
      value: `${stats.todaySessionsDone}/${stats.todaySessionsTotal}`,
      sub: "sessions completed",
      icon: Brain,
      color: "text-purple-500",
      bg: "from-purple-500/10 to-purple-600/5",
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-bold">
          {greeting}, {userName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5 hidden sm:block">
          Here&apos;s your exam preparation overview for today.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`stat-card bg-gradient-to-br ${card.bg} !p-3 md:!p-5`}
          >
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <p className="text-[11px] md:text-xs text-muted-foreground font-medium leading-tight">{card.label}</p>
              <card.icon size={14} className={`${card.color} shrink-0 ml-1`} />
            </div>
            <p className={`text-xl md:text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Readiness progress bar */}
      <div className="bg-card rounded-xl border p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Exam Readiness</span>
          <span className={`text-sm font-bold ${readinessColor}`}>{stats.readinessScore}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.readinessScore}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-2.5 rounded-full dentora-gradient"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>Start</span>
          <span>Target: {stats.readinessScore >= 75 ? "✓ Reached" : "75%"}</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
