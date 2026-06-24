"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { createClient } from "@/lib/db/supabase";
import { BDS_FINAL_YEAR_SUBJECTS } from "@/lib/constants/subjects";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingData } from "@/types";

const STEPS = [
  { id: 1, title: "Welcome!", subtitle: "Let's personalize your exam preparation" },
  { id: 2, title: "Exam Details", subtitle: "Tell us about your upcoming exam" },
  { id: 3, title: "Daily Schedule", subtitle: "We'll fit your plan around your life" },
  { id: 4, title: "Your Subjects", subtitle: "Help us prioritize what matters most" },
  { id: 5, title: "Study Style", subtitle: "How do you learn best?" },
  { id: 6, title: "All Set!", subtitle: "Generating your personalized plan..." },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LEARNING_STYLES = [
  { value: "visual", icon: "👁️", label: "Visual", desc: "Diagrams, charts, mind maps" },
  { value: "auditory", icon: "🎧", label: "Auditory", desc: "Lectures, discussions, recordings" },
  { value: "reading", icon: "📖", label: "Reading/Writing", desc: "Notes, textbooks, lists" },
  { value: "kinesthetic", icon: "✋", label: "Hands-on", desc: "Practice, cases, simulations" },
];

const initialData: OnboardingData = {
  step: 1,
  examDate: "",
  dailyHours: 4,
  wakeTime: "06:00",
  sleepTime: "23:00",
  collegeStartTime: "09:00",
  collegeEndTime: "17:00",
  weeklyHolidays: ["sunday"],
  strongSubjects: [],
  weakSubjects: [],
  targetPercentage: 75,
  preferredDuration: 45,
  revisionFrequency: 7,
  learningStyle: "visual",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const update = (field: keyof OnboardingData, value: unknown) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const toggleArrayItem = (field: "strongSubjects" | "weakSubjects" | "weeklyHolidays", val: string) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter((v) => v !== val)
        : [...prev[field], val],
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Update profile
      await supabase.from("profiles").update({
        exam_date: data.examDate,
        daily_study_hours: data.dailyHours,
        wake_time: data.wakeTime,
        sleep_time: data.sleepTime,
        college_start_time: data.collegeStartTime,
        college_end_time: data.collegeEndTime,
        weekly_holidays: data.weeklyHolidays,
        target_percentage: data.targetPercentage,
        preferred_session_mins: data.preferredDuration,
        revision_frequency: data.revisionFrequency,
        learning_style: data.learningStyle,
        onboarding_completed: true,
      }).eq("user_id", user.id);

      // Generate AI study plan
      await fetch("/api/ai/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      toast.success("Your personalized plan is ready!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <motion.div
            className="h-1.5 dentora-gradient rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-8 shadow-card">
        {/* Step header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">{STEPS[currentStep - 1].title}</h2>
          <p className="text-muted-foreground text-sm mt-1">{STEPS[currentStep - 1].subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1 – Welcome */}
            {currentStep === 1 && (
              <div className="text-center space-y-4">
                <div className="text-6xl">🦷</div>
                <p className="text-muted-foreground">
                  Welcome to <strong className="dentora-gradient-text">Dentora AI</strong> — your personalized
                  BDS exam preparation companion. We&apos;ll create a custom study plan in just 2 minutes.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {["AI Study Plan", "Viva Practice", "Smart Flashcards", "Exam Predictor"].map((f) => (
                    <div key={f} className="bg-primary/5 border border-primary/20 rounded-lg py-3 px-4">
                      <Check size={14} className="text-primary inline mr-1.5" />{f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 – Exam Details */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Exam Date</Label>
                  <Input type="date" value={data.examDate} onChange={(e) => update("examDate", e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Target Percentage: <span className="text-primary font-bold">{data.targetPercentage}%</span></Label>
                  <Slider value={[data.targetPercentage]} onValueChange={([v]) => update("targetPercentage", v)} min={50} max={100} step={5} />
                </div>
              </div>
            )}

            {/* Step 3 – Schedule */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Wake up time</Label>
                    <Input type="time" value={data.wakeTime} onChange={(e) => update("wakeTime", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sleep time</Label>
                    <Input type="time" value={data.sleepTime} onChange={(e) => update("sleepTime", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>College starts</Label>
                    <Input type="time" value={data.collegeStartTime} onChange={(e) => update("collegeStartTime", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>College ends</Label>
                    <Input type="time" value={data.collegeEndTime} onChange={(e) => update("collegeEndTime", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Daily study hours: <span className="text-primary font-bold">{data.dailyHours}h</span></Label>
                  <Slider value={[data.dailyHours]} onValueChange={([v]) => update("dailyHours", v)} min={1} max={12} step={0.5} />
                </div>
                <div className="space-y-2">
                  <Label>Weekly off days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleArrayItem("weeklyHolidays", d.toLowerCase())}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs border transition-colors",
                          data.weeklyHolidays.includes(d.toLowerCase())
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 – Subjects */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select subjects you feel strong or weak in:</p>
                <div className="space-y-2">
                  {BDS_FINAL_YEAR_SUBJECTS.map((sub) => {
                    const isStrong = data.strongSubjects.includes(sub.code);
                    const isWeak = data.weakSubjects.includes(sub.code);
                    return (
                      <div key={sub.code} className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm font-medium">{sub.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (isStrong) toggleArrayItem("strongSubjects", sub.code);
                              else { toggleArrayItem("strongSubjects", sub.code); if (isWeak) toggleArrayItem("weakSubjects", sub.code); }
                            }}
                            className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                              isStrong ? "bg-green-500 text-white border-green-500" : "border-border hover:bg-green-500/10"
                            )}
                          >Strong</button>
                          <button
                            onClick={() => {
                              if (isWeak) toggleArrayItem("weakSubjects", sub.code);
                              else { toggleArrayItem("weakSubjects", sub.code); if (isStrong) toggleArrayItem("strongSubjects", sub.code); }
                            }}
                            className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                              isWeak ? "bg-red-500 text-white border-red-500" : "border-border hover:bg-red-500/10"
                            )}
                          >Weak</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5 – Learning Style */}
            {currentStep === 5 && (
              <div className="grid grid-cols-2 gap-3">
                {LEARNING_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => update("learningStyle", style.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      data.learningStyle === style.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="text-2xl mb-2">{style.icon}</div>
                    <div className="font-semibold text-sm">{style.label}</div>
                    <div className="text-xs text-muted-foreground">{style.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 6 – Generating */}
            {currentStep === 6 && (
              <div className="text-center space-y-4 py-4">
                {loading ? (
                  <>
                    <Loader2 size={48} className="animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Generating your personalized study plan...</p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl">🚀</div>
                    <p>Everything looks great! Click below to generate your AI-powered study plan.</p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft size={16} className="mr-1" /> Back
          </Button>
          <Button onClick={handleNext} disabled={loading || (currentStep === 2 && !data.examDate)}>
            {loading ? (
              <><Loader2 size={16} className="mr-2 animate-spin" /> Generating...</>
            ) : currentStep === STEPS.length ? (
              <><Check size={16} className="mr-1.5" /> Launch Dashboard</>
            ) : (
              <>Continue <ChevronRight size={16} className="ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
