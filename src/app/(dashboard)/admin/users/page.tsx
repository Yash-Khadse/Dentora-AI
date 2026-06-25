/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Admin - Users" };

const ROLE_STYLE: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient();

  // Join profiles with users table to get role info
  const { data: users } = await supabase
    .from("profiles")
    .select("*, colleges(name), users!profiles_user_id_fkey(role)")
    .order("created_at", { ascending: false })
    .limit(100) as any;

  const total = users?.length ?? 0;
  const admins = (users ?? []).filter((u: any) => {
    const role = u.users?.role ?? "student";
    return role === "admin" || role === "super_admin";
  }).length;

  return (
    <div className="animate-fade-in">
      <div className="dentora-gradient px-6 py-8">
        <h1 className="text-xl font-bold text-white">Users</h1>
        <p className="text-white/75 text-sm mt-0.5">{total} registered users Â· {admins} admins</p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: total, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5" },
            { label: "Admins", value: admins, color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/5" },
            { label: "Students", value: total - admins, color: "text-green-500", bg: "from-green-500/10 to-green-600/5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`stat-card text-center bg-gradient-to-br ${bg}`}>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users ?? []).map((user: any) => {
                  const initials = (user.full_name ?? "U")
                    .split(" ")
                    .map((w: string) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const role = user.users?.role ?? "student";
                  return (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.full_name ?? "â€”"}</p>
                            {user.roll_number && (
                              <p className="text-xs text-muted-foreground">{user.roll_number}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.colleges?.name ?? "â€”"}</TableCell>
                      <TableCell>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-medium ${ROLE_STYLE[role] ?? ROLE_STYLE.student}`}>
                          {role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{(user.total_xp ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1">
                          ðŸ”¥ {user.current_streak ?? 0}d
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? format(new Date(user.created_at), "dd MMM yy") : "â€”"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {total === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      No users yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
