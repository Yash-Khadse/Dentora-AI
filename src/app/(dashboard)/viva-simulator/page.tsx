/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { VivaSimulatorClient } from "@/components/viva/viva-simulator-client";

export const metadata: Metadata = { title: "Viva Simulator" };

export default async function VivaSimulatorPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: subjects }, { data: sessions }] = await Promise.all([
    supabase.from("subjects").select("id, name, code") as any,
    supabase
      .from("viva_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10) as any,
  ]);

  return <VivaSimulatorClient subjects={subjects ?? []} pastSessions={sessions ?? []} userId={user.id} />;
}
