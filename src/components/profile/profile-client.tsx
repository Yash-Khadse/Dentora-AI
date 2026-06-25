"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, Building, GraduationCap, Mail, Hash, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/db/supabase";
import { getLevelFromXP } from "@/lib/utils";

interface Profile {
  id: string;
  full_name?: string;
  roll_number?: string;
  batch_year?: number;
  avatar_url?: string;
  total_xp?: number;
  current_streak?: number;
  readiness_score?: number;
}

interface College { id: string; name: string; university?: string; city?: string; }
interface Props { user: User; profile: Profile | null; college: College | null; }

export function ProfileClient({ user, profile, college }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [rollNumber, setRollNumber] = useState(profile?.roll_number ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const xp = profile?.total_xp ?? 0;
  const { level, progress: levelProgress, nextLevelXP } = getLevelFromXP(xp);

  const initials = (profile?.full_name ?? user.email ?? "U")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: fullName, roll_number: rollNumber })
      .eq("user_id", user.id);
    if (err) { setError(err.message); }
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Gradient hero header */}
      <div className="dentora-gradient px-6 py-10">
        <div className="flex items-end gap-5 max-w-3xl">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-white/30 shadow-xl">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold backdrop-blur-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm">
              ðŸŽ“
            </div>
          </div>
          <div className="text-white pb-1">
            <h1 className="text-2xl font-bold">{profile?.full_name ?? "Student"}</h1>
            <p className="text-white/75 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-xs gap-1">
                âš¡ Level {level}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-xs gap-1">
                ðŸ”¥ {profile?.current_streak ?? 0} day streak
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-5 max-w-3xl">
        {/* XP / Level */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-sm">Level {level} Student</p>
              <p className="text-xs text-muted-foreground">{xp} XP Â· {nextLevelXP - xp} XP to next level</p>
            </div>
            <Badge variant="secondary" className="text-sm font-bold px-3">{xp} XP</Badge>
          </div>
          <Progress value={levelProgress} className="h-2.5" />
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Readiness", value: `${profile?.readiness_score ?? 0}%`, color: "text-primary", bg: "from-blue-500/10 to-blue-600/5" },
            { label: "Day Streak", value: `${profile?.current_streak ?? 0}d`, color: "text-amber-500", bg: "from-amber-500/10 to-orange-500/5" },
            { label: "Total XP", value: xp.toLocaleString(), color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`stat-card bg-gradient-to-br ${bg} text-center`}>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Personal info form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1.5 text-xs font-medium">
                  Full Name
                </Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Ramesh Kumar" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber" className="text-xs font-medium">Roll Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="rollNumber" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="MIDS2024001" className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={user.email ?? ""} disabled className="pl-9 opacity-60" />
                </div>
                <p className="text-[11px] text-muted-foreground">Email cannot be changed</p>
              </div>
              {profile?.batch_year && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Batch Year</Label>
                  <Input value={profile.batch_year} disabled className="opacity-60" />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
            )}

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved!" : saving ? "Savingâ€¦" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* College info */}
        {college && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                College Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">College</span>
                <span className="font-medium">{college.name}</span>
              </div>
              {college.university && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">University</span>
                    <span className="font-medium">{college.university}</span>
                  </div>
                </>
              )}
              {college.city && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium">{college.city}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
