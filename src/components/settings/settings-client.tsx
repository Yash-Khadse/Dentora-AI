"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Bell, Brain, Target, Palette, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/db/supabase";

interface UserSettings {
  user_id: string;
  notifications_enabled: boolean;
  email_reminders: boolean;
  push_notifications: boolean;
  daily_reminder_time?: string;
  ai_difficulty_level: string;
  preferred_ai_mode: string;
  theme: string;
  study_goal_hours: number;
}

interface Props { userId: string; settings: UserSettings | null; }

const DEFAULT: Omit<UserSettings, "user_id"> = {
  notifications_enabled: true,
  email_reminders: true,
  push_notifications: false,
  daily_reminder_time: "08:00",
  ai_difficulty_level: "intermediate",
  preferred_ai_mode: "study",
  theme: "light",
  study_goal_hours: 4,
};


export function SettingsClient({ userId, settings }: Props) {
  const m = { ...DEFAULT, ...settings };

  const [notificationsEnabled, setNotificationsEnabled] = useState(m.notifications_enabled);
  const [emailReminders, setEmailReminders] = useState(m.email_reminders);
  const [aiDifficulty, setAiDifficulty] = useState(m.ai_difficulty_level);
  const [aiMode, setAiMode] = useState(m.preferred_ai_mode);
  const [studyGoalHours, setStudyGoalHours] = useState(m.study_goal_hours.toString());
  const [theme, setTheme] = useState(m.theme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        notifications_enabled: notificationsEnabled,
        email_reminders: emailReminders,
        ai_difficulty_level: aiDifficulty,
        preferred_ai_mode: aiMode,
        study_goal_hours: Number(studyGoalHours),
        theme,
      },
      { onConflict: "user_id" }
    );
    if (err) { setError(err.message); }
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="px-6 py-8 border-b bg-gradient-to-r from-muted/50 to-muted/20">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your Dentora AI preferences</p>
      </div>

      <div className="p-4 md:p-6 space-y-4 max-w-2xl">
        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Bell className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-sm">Notifications</CardTitle>
                  <CardDescription className="text-xs">Control when and how you receive reminders</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications" className="font-medium">All Notifications</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Master toggle for all alerts and reminders</p>
                </div>
                <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email" className={notificationsEnabled ? "" : "opacity-50"}>Email Reminders</Label>
                  <p className={`text-xs mt-0.5 ${notificationsEnabled ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                    Daily study schedule and revision alerts via email
                  </p>
                </div>
                <Switch id="email" checked={emailReminders} onCheckedChange={setEmailReminders} disabled={!notificationsEnabled} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Preferences */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-sm">AI Preferences</CardTitle>
                  <CardDescription className="text-xs">Customize how the AI adapts to your level</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">AI Difficulty Level</Label>
                <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner â€” simplified explanations</SelectItem>
                    <SelectItem value="intermediate">Intermediate â€” standard exam level</SelectItem>
                    <SelectItem value="advanced">Advanced â€” university external level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Default AI Mode</Label>
                <Select value={aiMode} onValueChange={setAiMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study Mode â€” detailed explanations</SelectItem>
                    <SelectItem value="quiz">Quiz Mode â€” test recall first</SelectItem>
                    <SelectItem value="viva">Viva Mode â€” oral exam simulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Study Goals */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-sm">Study Goals</CardTitle>
                  <CardDescription className="text-xs">Set your daily study targets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Daily Study Goal</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5, 6, 7, 8, 10].map((h) => (
                    <button
                      key={h}
                      onClick={() => setStudyGoalHours(h.toString())}
                      className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        studyGoalHours === h.toString()
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Your AI study plan will be adjusted to meet this goal</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Palette className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-sm">Appearance</CardTitle>
                  <CardDescription className="text-xs">Theme and display preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", label: "â˜€ï¸ Light", desc: "Clean and bright" },
                    { value: "dark", label: "ðŸŒ™ Dark", desc: "Easy on eyes" },
                    { value: "system", label: "ðŸ’» System", desc: "Auto-detect" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        theme === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full h-11 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
          {saved ? "Settings saved!" : saving ? "Savingâ€¦" : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
