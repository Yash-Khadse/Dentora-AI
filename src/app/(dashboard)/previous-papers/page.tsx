/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { PreviousPapersClient } from "@/components/previous-papers/previous-papers-client";

export const metadata: Metadata = { title: "Previous Papers" };

export default async function PreviousPapersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: papers }, { data: subjects }] = await Promise.all([
    supabase
      .from("previous_papers")
      .select("*")
      .eq("user_id", user.id)
      .order("year", { ascending: false }) as any,
    supabase.from("subjects").select("id, name, code") as any,
  ]);

  return <PreviousPapersClient papers={papers ?? []} subjects={subjects ?? []} userId={user.id} />;
}
