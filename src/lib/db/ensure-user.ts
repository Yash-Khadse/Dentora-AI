import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the users/profiles/user_settings rows exist for a given auth user.
 * Safe to call on every request — uses upsert so it's idempotent.
 * Needed for accounts created before the DB migrations were applied.
 */
export async function ensureUserRows(
  supabase: SupabaseClient,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const email = user.email ?? "";
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? "New Student";

  await Promise.all([
    supabase.from("users").upsert({ id: user.id, email }, { onConflict: "id" }),
    supabase
      .from("profiles")
      .upsert({ user_id: user.id, full_name: fullName }, { onConflict: "user_id" }),
    supabase
      .from("user_settings")
      .upsert({ user_id: user.id }, { onConflict: "user_id" }),
  ]);
}
