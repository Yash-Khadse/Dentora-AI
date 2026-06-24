/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { CaseSimulatorClient } from "@/components/case/case-simulator-client";

export const metadata: Metadata = { title: "Case Simulator" };

export default async function CaseSimulatorPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: subjects }, { data: pastCases }] = await Promise.all([
    // subjects is public-read — user client is fine
    supabase
      .from("subjects")
      .select("id, name, code")
      .order("name") as any,
    // case_studies private rows need admin to bypass the is_public-only SELECT policy
    admin
      .from("case_studies")
      .select("id, title, difficulty, subject_id, created_at, subjects(name), case_submissions(id, ai_score, created_at)")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(15) as any,
  ]);

  return (
    <CaseSimulatorClient
      subjects={subjects ?? []}
      pastCases={pastCases ?? []}
      userId={user.id}
    />
  );
}
