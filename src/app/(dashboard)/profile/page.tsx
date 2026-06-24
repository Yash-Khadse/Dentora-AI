/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { ProfileClient } from "@/components/profile/profile-client";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single() as any;

  const { data: college } = profile?.college_id
    ? await supabase.from("colleges").select("*").eq("id", profile.college_id).single() as any
    : { data: null };

  return <ProfileClient user={user} profile={profile} college={college} />;
}
