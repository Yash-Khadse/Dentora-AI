"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mic, RefreshCw, Bot, FileSearch, Stethoscope } from "lucide-react";

interface QuickActionsProps {
  flashcardsDue?: number;
  revisionDue?: number;
}

export function QuickActions({ flashcardsDue = 0, revisionDue = 0 }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      icon: Zap,
      label: "Review Flashcards",
      sub: flashcardsDue > 0 ? `${flashcardsDue} due today` : "Stay sharp",
      color: "text-amber-500",
      bg: "bg-amber-500/10 hover:bg-amber-500/20",
      href: "/flashcards",
      badge: flashcardsDue,
    },
    {
      icon: Mic,
      label: "Viva Practice",
      sub: "Test your knowledge",
      color: "text-red-500",
      bg: "bg-red-500/10 hover:bg-red-500/20",
      href: "/viva-simulator",
    },
    {
      icon: RefreshCw,
      label: "Revision Center",
      sub: revisionDue > 0 ? `${revisionDue} topics overdue` : "Review topics",
      color: "text-green-500",
      bg: "bg-green-500/10 hover:bg-green-500/20",
      href: "/revision-center",
      badge: revisionDue,
    },
    {
      icon: Bot,
      label: "Ask AI Tutor",
      sub: "Get instant answers",
      color: "text-blue-500",
      bg: "bg-blue-500/10 hover:bg-blue-500/20",
      href: "/ai-tutor",
    },
    {
      icon: FileSearch,
      label: "Previous Papers",
      sub: "Analyze past exams",
      color: "text-purple-500",
      bg: "bg-purple-500/10 hover:bg-purple-500/20",
      href: "/previous-papers",
    },
    {
      icon: Stethoscope,
      label: "Case Simulator",
      sub: "Clinical reasoning",
      color: "text-teal-500",
      bg: "bg-teal-500/10 hover:bg-teal-500/20",
      href: "/case-simulator",
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(action.href)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl ${action.bg} transition-colors cursor-pointer`}
          >
            {action.badge ? (
              <span className="absolute top-2 right-2 w-4 h-4 bg-destructive text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {action.badge > 9 ? "9+" : action.badge}
              </span>
            ) : null}
            <action.icon size={22} className={action.color} />
            <div className="text-center">
              <p className="text-xs font-semibold leading-tight">{action.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{action.sub}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
