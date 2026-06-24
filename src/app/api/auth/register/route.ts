import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const admin = getAdminClient();
    let userId: string | null = null;

    // ── Strategy 1: Admin API (auto-confirms email, best option) ────────────
    try {
      const { data: authData, error: adminError } = await admin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName },
        email_confirm: true,
      });

      if (!adminError && authData?.user) {
        userId = authData.user.id;
      } else if (adminError) {
        const msg = adminError.message?.toLowerCase() ?? "";
        if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in instead." },
            { status: 400 }
          );
        }
        console.warn("[register] admin.createUser failed:", adminError.message, "→ falling back to signUp");
      }
    } catch (adminErr) {
      console.warn("[register] admin API threw:", adminErr, "→ falling back to signUp");
    }

    // ── Strategy 2: Regular signUp fallback ─────────────────────────────────
    if (!userId) {
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: signUpData, error: signUpError } = await anon.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();

        // Friendly messages for common cases
        if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in instead." },
            { status: 400 }
          );
        }
        if (msg.includes("database error") || msg.includes("trigger")) {
          return NextResponse.json(
            {
              error:
                "The database is not set up yet. Please ask your admin to run the SQL migrations in the Supabase dashboard, then try again.",
            },
            { status: 503 }
          );
        }

        console.error("[register] signUp error:", signUpError.message);
        return NextResponse.json({ error: signUpError.message }, { status: 400 });
      }

      if (!signUpData?.user) {
        return NextResponse.json({ error: "Account creation failed. Please try again." }, { status: 400 });
      }

      userId = signUpData.user.id;
    }

    // ── Ensure profile rows exist (best-effort, non-fatal) ───────────────────
    // These may already exist if the DB trigger ran successfully.
    // If the tables don't exist yet (migrations not applied), these silently fail.

    await admin.from("users").upsert({ id: userId, email }, { onConflict: "id" });
    await admin.from("profiles").upsert({ user_id: userId, full_name: fullName }, { onConflict: "user_id" });
    await admin.from("user_settings").upsert({ user_id: userId }, { onConflict: "user_id" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register] unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
