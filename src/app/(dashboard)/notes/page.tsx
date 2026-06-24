/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { NotesClient } from "@/components/notes/notes-client";

export const metadata: Metadata = { title: "Notes & Documents" };

export default async function NotesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: pdfs }, { data: notes }] = await Promise.all([
    supabase
      .from("uploaded_pdfs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any,
    supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }) as any,
  ]);

  return <NotesClient pdfs={pdfs ?? []} notes={notes ?? []} userId={user.id} />;
}
