/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { ensureUserRows } from "@/lib/db/ensure-user";
import { buildStudyPlanPrompt } from "@/lib/ai/prompts";
import { generateJSON } from "@/lib/ai/client";
import { daysUntil } from "@/lib/utils";

export const maxDuration = 60;

// All 8 BDS final year subjects
const DEFAULT_SUBJECTS = [
  { name: "Oral Medicine and Radiology",               completion: 0, topics: 42 },
  { name: "Oral Surgery",                              completion: 0, topics: 38 },
  { name: "Pedodontics and Preventive Dentistry",      completion: 0, topics: 35 },
  { name: "Orthodontics and Dentofacial Orthopaedics", completion: 0, topics: 40 },
  { name: "Periodontics",                              completion: 0, topics: 36 },
  { name: "Prosthodontics and Crown & Bridge",         completion: 0, topics: 44 },
  { name: "Conservative Dentistry and Endodontics",    completion: 0, topics: 45 },
  { name: "Public Health Dentistry",                   completion: 0, topics: 30 },
];

// Fuzzy match an AI-returned subject name to a DB subject ID
function findSubjectId(
  dbSubjects: { id: string; name: string; code: string }[],
  aiName: string
): string | null {
  if (!aiName) return null;
  const lower = aiName.toLowerCase();
  // Exact match first
  const exact = dbSubjects.find((s) => s.name.toLowerCase() === lower);
  if (exact) return exact.id;
  // Partial contains match
  const partial = dbSubjects.find(
    (s) => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase())
  );
  if (partial) return partial.id;
  // Keyword match (e.g. "oral surgery" matches "Oral Surgery")
  for (const s of dbSubjects) {
    const words = s.name.toLowerCase().split(/\s+/);
    if (words.some((w) => w.length > 4 && lower.includes(w))) return s.id;
  }
  return null;
}

// Build concrete study_sessions rows for the next `days` days
function buildSessionRows(
  planId: string,
  userId: string,
  planData: any,
  dbSubjects: { id: string; name: string; code: string }[],
  holidays: string[],
  dailyHours: number,
  days = 14
): any[] {
  const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const holidayNums = new Set(
    holidays.map((h) => DAY_NAMES.indexOf(h.toLowerCase())).filter((n) => n !== -1)
  );

  const weeklyFocus: any[] = planData.weekly_focus ?? [];
  const rows: any[] = [];

  // Determine session slots based on available daily hours
  // Morning study + evening revision + optional night practice
  const slots = [
    { start: "07:00", end: "09:00", duration: 120, type: "study"    },
    { start: "18:30", end: "20:30", duration: 120, type: "revision" },
    { start: "21:00", end: "22:00", duration:  60, type: "practice" },
  ].slice(0, dailyHours <= 3 ? 1 : dailyHours <= 5 ? 2 : 3);

  for (let offset = 1; offset <= days; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    if (holidayNums.has(d.getDay())) continue;

    const dateStr = d.toISOString().split("T")[0];
    const weekIdx = Math.min(Math.floor((offset - 1) / 7), weeklyFocus.length - 1);
    const focus = weeklyFocus[weekIdx];
    if (!focus) continue;

    const focusSubjects: string[] = focus.subjects ?? [];
    const theme: string = focus.theme ?? `Week ${weekIdx + 1}`;

    // Cycle through focus subjects across slots
    for (let si = 0; si < slots.length; si++) {
      const subjName = focusSubjects[si % Math.max(focusSubjects.length, 1)];
      const subjId = findSubjectId(dbSubjects, subjName ?? "");

      rows.push({
        plan_id: planId,
        user_id: userId,
        subject_id: subjId,
        session_date: dateStr,
        start_time: slots[si].start,
        end_time: slots[si].end,
        planned_duration_mins: slots[si].duration,
        session_type: slots[si].type,
        status: "scheduled",
        notes: `${theme}${subjName ? ` — ${subjName}` : ""}`,
      });
    }
  }

  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let bodyOverrides: any = {};
    try { bodyOverrides = await req.json(); } catch { /* empty body is fine */ }

    await ensureUserRows(supabase, user);

    const [{ data: profile }, { data: subjectProgress }, { data: dbSubjects }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single() as any,
      supabase.from("user_subject_progress").select("*, subjects(name)").eq("user_id", user.id) as any,
      supabase.from("subjects").select("id, name, code") as any,
    ]);

    const examDate: string =
      bodyOverrides.examDate ||
      profile?.exam_date ||
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const dailyHours: number = bodyOverrides.dailyHours || profile?.daily_study_hours || 4;
    const holidays: string[] = bodyOverrides.weeklyHolidays || profile?.weekly_holidays || ["sunday"];

    // Build subject list for the prompt
    const fromProgress = ((subjectProgress as any[]) || []).map((sp: any) => ({
      name: sp.subjects?.name || "Unknown",
      completion: sp.completion_pct || 0,
      topics: 10,
    }));
    const subjectList = fromProgress.length > 0 ? fromProgress : DEFAULT_SUBJECTS;

    const prompt = buildStudyPlanPrompt({
      examDate,
      daysLeft: daysUntil(examDate),
      dailyHours,
      wakeTime: bodyOverrides.wakeTime || profile?.wake_time || "06:00",
      sleepTime: bodyOverrides.sleepTime || profile?.sleep_time || "23:00",
      collegeStart: bodyOverrides.collegeStartTime || profile?.college_start_time || "09:00",
      collegeEnd: bodyOverrides.collegeEndTime || profile?.college_end_time || "17:00",
      holidays,
      strongSubjects: bodyOverrides.strongSubjects || [],
      weakSubjects: bodyOverrides.weakSubjects || [],
      targetPercentage: bodyOverrides.targetPercentage || profile?.target_percentage || 75,
      learningStyle: bodyOverrides.learningStyle || profile?.learning_style || "visual",
      subjects: subjectList,
    });

    const planData = await generateJSON<any>({ prompt });

    // ── Deactivate old plans first ──
    await supabase
      .from("study_plans")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    // ── Save new plan ──
    const { data: plan, error: planErr } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        exam_date: examDate,
        generated_by_ai: true,
        is_active: true,
        ai_summary: planData.summary ?? null,
        ai_strategy: planData,
        readiness_score: 0,
      })
      .select()
      .single() as any;

    if (planErr || !plan) {
      console.error("[AI Planner] DB save error:", planErr);
      return NextResponse.json({ error: "Failed to save plan", details: planErr?.message }, { status: 500 });
    }

    // ── Generate and insert study sessions ──
    const allDbSubjects = (dbSubjects as any[]) ?? [];
    const sessionRows = buildSessionRows(plan.id, user.id, planData, allDbSubjects, holidays, dailyHours, 14);

    if (sessionRows.length > 0) {
      const { error: sessErr } = await supabase.from("study_sessions").insert(sessionRows) as any;
      if (sessErr) console.warn("[AI Planner] Session insert warning:", sessErr.message);
    }

    // Update total_sessions count
    await supabase
      .from("study_plans")
      .update({ total_sessions: sessionRows.length })
      .eq("id", plan.id);

    return NextResponse.json({ plan, planData, sessionCount: sessionRows.length });
  } catch (error) {
    console.error("[AI Planner]", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
