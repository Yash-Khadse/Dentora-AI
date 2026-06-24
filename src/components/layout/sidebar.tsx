"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, BookOpen, FileText,
  Bot, Mic, Stethoscope, Zap, FileSearch, RefreshCw,
  BarChart3, User, Settings, ChevronLeft, ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/study-planner", icon: CalendarDays, label: "Study Planner" },
  { href: "/subjects", icon: BookOpen, label: "Subjects" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/ai-tutor", icon: Bot, label: "AI Tutor" },
  { href: "/viva-simulator", icon: Mic, label: "Viva Simulator" },
  { href: "/case-simulator", icon: Stethoscope, label: "Case Simulator" },
  { href: "/flashcards", icon: Zap, label: "Flashcards" },
  { href: "/previous-papers", icon: FileSearch, label: "Previous Papers" },
  { href: "/revision-center", icon: RefreshCw, label: "Revision Center" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

const BOTTOM_ITEMS = [
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-card border-r border-border overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <div className="w-9 h-9 dentora-gradient rounded-xl flex items-center justify-center text-white text-lg shrink-0">
          🦷
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="ml-3 font-bold text-base dentora-gradient-text whitespace-nowrap"
            >
              Dentora AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "nav-link",
              isActive(item.href) && "nav-link-active",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              {!collapsed && (
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              )}
            </div>
            <Link
              href="/admin"
              className={cn("nav-link", pathname.startsWith("/admin") && "nav-link-active", collapsed && "justify-center px-0")}
            >
              <ShieldCheck size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm">Admin Panel</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "nav-link",
              isActive(item.href) && "nav-link-active",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center
                   text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
