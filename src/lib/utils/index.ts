import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

// ---- Tailwind utility ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Date helpers ----
export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function daysUntil(date: string | Date): number {
  return differenceInDays(new Date(date), new Date());
}

export function getExamCountdownLabel(daysLeft: number): {
  label: string;
  color: string;
} {
  if (daysLeft <= 0) return { label: "Exam Today!", color: "text-red-500" };
  if (daysLeft <= 7) return { label: `${daysLeft} days left`, color: "text-red-500" };
  if (daysLeft <= 30) return { label: `${daysLeft} days left`, color: "text-amber-500" };
  return { label: `${daysLeft} days left`, color: "text-green-500" };
}

// ---- Score helpers ----
export function getReadinessColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-amber-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Average";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

// ---- Spaced Repetition (SM-2 algorithm) ----
export function calculateNextReview(
  easeFactor: number,
  intervalDays: number,
  quality: 0 | 1 | 2 | 3 | 4 | 5  // 0-5 (again=0, hard=2, good=4, easy=5)
): { newInterval: number; newEaseFactor: number } {
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  let newInterval: number;
  if (quality < 3) {
    newInterval = 1; // reset
  } else if (intervalDays === 0) {
    newInterval = 1;
  } else if (intervalDays === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(intervalDays * newEaseFactor);
  }

  return { newInterval, newEaseFactor };
}

// ---- XP helpers ----
export function getLevelFromXP(xp: number): { level: number; progress: number; nextLevelXP: number } {
  const levels = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];
  let level = 1;
  for (let i = 1; i < levels.length; i++) {
    if (xp >= levels[i]) level = i + 1;
    else break;
  }
  const currentLevelXP = levels[level - 1] || 0;
  const nextLevelXP = levels[level] || levels[levels.length - 1] * 2;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return { level, progress: Math.min(progress, 100), nextLevelXP };
}

// ---- File helpers ----
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

// ---- Study time helpers ----
export function minutesToHoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function generateTimeSlots(start: string, end: string, intervalMins: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let current = sh * 60 + sm;
  const endMins = eh * 60 + em;
  while (current < endMins) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += intervalMins;
  }
  return slots;
}

// ---- Truncation ----
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

// ---- Random helpers ----
export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- Color helpers ----
export const SUBJECT_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#8b5cf6",
  "#f59e0b", "#06b6d4", "#ec4899", "#14b8a6",
];
