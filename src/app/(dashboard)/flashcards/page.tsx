/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { FlashcardsClient } from "@/components/flashcards/flashcards-client";
import { BDS_FINAL_YEAR_SUBJECTS } from "@/lib/constants/subjects";

export const metadata: Metadata = { title: "Flashcards" };

// Ensure all 8 BDS subjects exist in the DB, insert missing ones via admin client
async function ensureSubjectsSeeded() {
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin.from("subjects").select("code") as any;
    const existingCodes = new Set((existing ?? []).map((s: any) => s.code));

    const missing = BDS_FINAL_YEAR_SUBJECTS.filter((s) => !existingCodes.has(s.code));
    if (missing.length === 0) return;

    await admin.from("subjects").insert(
      missing.map((s) => ({
        code: s.code,
        name: s.name,
        total_topics: s.total_topics,
        exam_weightage: s.exam_weightage,
        color: s.color,
      }))
    );
  } catch { /* non-fatal — subjects may already exist or RLS may block */ }
}

export default async function FlashcardsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Seed missing subjects before fetching
  await ensureSubjectsSeeded();

  const [{ data: dueCards }, { data: allCards }, { data: subjects }] = await Promise.all([
    supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .lte("due_date", today)
      .order("due_date", { ascending: true }) as any,
    supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100) as any,
    supabase
      .from("subjects")
      .select("id, name, code")
      .order("name") as any,
  ]);

  return (
    <FlashcardsClient
      dueCards={dueCards ?? []}
      allCards={allCards ?? []}
      userId={user.id}
      subjects={subjects ?? []}
    />
  );
}
