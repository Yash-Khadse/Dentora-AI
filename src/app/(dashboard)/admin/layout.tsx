/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import Link from "next/link";
import { LayoutDashboard, Users, BookOpen, BarChart3, HelpCircle } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single() as any;

  if (userRecord?.role !== "admin" && userRecord?.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex">
      <aside className="w-56 border-r min-h-screen p-4 space-y-1 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-3">Admin Panel</p>
        {adminLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
