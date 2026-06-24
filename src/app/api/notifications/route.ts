import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) as any;

    return NextResponse.json(notifications ?? []);
  } catch (error) {
    console.error("[notifications GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single() as any;

    if (userRecord?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, message, type, targetUserId, targetAll } = await req.json();
    if (!title || !message) {
      return NextResponse.json({ error: "title and message required" }, { status: 400 });
    }

    if (targetAll) {
      const { data: allUsers } = await supabase.from("users").select("id") as any;
      const notifications = (allUsers ?? []).map((u: { id: string }) => ({
        user_id: u.id, title, message, type: type ?? "reminder",
      }));
      await supabase.from("notifications").insert(notifications);
      return NextResponse.json({ sent: notifications.length });
    }

    const targetId = targetUserId ?? user.id;
    const VALID_TYPES = ["reminder", "achievement", "plan_update", "streak", "ai_insight", "exam_alert"];
    const notifType = VALID_TYPES.includes(type) ? type : "reminder";
    const { data: notification } = await supabase
      .from("notifications")
      .insert({ user_id: targetId, title, message, type: notifType })
      .select()
      .single() as any;

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("[notifications POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { notificationId, markAllRead } = await req.json();

    if (markAllRead) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id) as any;
      return NextResponse.json({ success: true });
    }

    if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });

    const { data } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .select()
      .single() as any;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[notifications PATCH]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
