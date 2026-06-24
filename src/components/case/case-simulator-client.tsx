"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, FlaskConical, ChevronRight, Trophy, RotateCcw,
  CheckCircle2, AlertCircle, Lightbulb, TrendingUp, BookOpen, Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────
interface Subject { id: string; name: string; code: string }

interface CaseStudy {
  id: string;
  title: string;
  chief_complaint: string;
  history: string | null;
  examination_findings: string | null;
  investigation_results: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  difficulty: string;
  subject_id?: string;
  created_at?: string;
  subjects?: { name: string } | null;
  case_submissions?: { id: string; ai_score?: number; created_at?: string }[];
}

interface ModelAnswer {
  history: string;
  examination: string;
  investigation: string;
  diagnosis: string;
  treatment: string;
}

interface Evaluation {
  score: number;
  breakdown: { history: number; examination: number; investigation: number; diagnosis: number; treatment: number };
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  clinical_pearl?: string;
  modelAnswer?: ModelAnswer | null;
}

interface Props { subjects: Subject[]; pastCases: CaseStudy[]; userId: string }

// ── Constants ───────────────────────────────────────────────────
const STEPS = [
  { step: "history",      label: "History",        question: "What additional history would you take from this patient?", icon: "📋" },
  { step: "examination",  label: "Examination",     question: "What examination would you perform and what findings do you expect?", icon: "🔍" },
  { step: "investigation",label: "Investigations",  question: "What investigations would you order and why? Interpret the results.", icon: "🧪" },
  { step: "diagnosis",    label: "Diagnosis",       question: "What is your primary diagnosis? List differential diagnoses with justification.", icon: "🎯" },
  { step: "treatment",    label: "Treatment Plan",  question: "Write a complete, phased treatment plan for this patient.", icon: "💊" },
];

const UI_DIFFICULTIES = [
  { value: "beginner",     label: "Beginner",     icon: "🟢", desc: "Straightforward presentation, common conditions" },
  { value: "intermediate", label: "Intermediate", icon: "🟡", desc: "Moderate complexity, some clinical reasoning needed" },
  { value: "advanced",     label: "Advanced",     icon: "🔴", desc: "Complex case, multiple differentials, critical thinking" },
];

const DIFF_COLOR: Record<string, string> = {
  easy:         "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard:         "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  beginner:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function diffLabel(d: string) {
  if (d === "easy") return "Beginner";
  if (d === "medium") return "Intermediate";
  if (d === "hard") return "Advanced";
  return d;
}

// Score ring component
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ── Results View ────────────────────────────────────────────────
function ResultsView({
  caseStudy,
  answers,
  evaluation,
  onRetry,
}: {
  caseStudy: CaseStudy;
  answers: Record<string, string>;
  evaluation: Evaluation;
  onRetry: () => void;
}) {
  const { score, breakdown, feedback, strengths, improvements, clinical_pearl, modelAnswer } = evaluation;
  const scoreColor = score >= 75 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const stepKeys = ["history", "examination", "investigation", "diagnosis", "treatment"] as const;

  return (
    <div className="p-6 space-y-5 max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Case Complete</h1>
          <p className="page-subtitle line-clamp-1">{caseStudy.title}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 shrink-0">
          <RotateCcw className="h-3.5 w-3.5" /> New Case
        </Button>
      </div>

      {/* Score card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="stat-card"
      >
        <div className="flex items-center gap-6">
          <ScoreRing score={score} />
          <div className="flex-1 space-y-3">
            <div>
              <p className={cn("text-2xl font-bold", scoreColor)}>
                {score >= 75 ? "Excellent!" : score >= 50 ? "Good effort" : "Keep practising"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {score >= 75 ? "You demonstrate strong clinical reasoning." :
                 score >= 50 ? "You covered the basics — review the missed areas below." :
                 "Review the model answers and attempt similar cases."}
              </p>
            </div>
            {/* Section scores */}
            <div className="grid grid-cols-5 gap-2">
              {stepKeys.map((key) => {
                const s = breakdown[key] ?? 0;
                const pct = (s / 20) * 100;
                return (
                  <div key={key} className="text-center">
                    <div className="text-xs font-bold" style={{ color: pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444" }}>{s}/20</div>
                    <div className="text-[9px] text-muted-foreground capitalize mt-0.5">{key.slice(0, 5)}</div>
                    <Progress value={pct} className="h-1 mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs: Feedback | Answers | Model Answers */}
      <Tabs defaultValue="feedback">
        <TabsList className="w-full">
          <TabsTrigger value="feedback" className="flex-1">AI Feedback</TabsTrigger>
          <TabsTrigger value="comparison" className="flex-1">Your vs Ideal</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-4 space-y-4">
          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <div className="stat-card border-green-200 dark:border-green-800 space-y-2">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Strengths
              </p>
              {strengths.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}
                </p>
              ))}
            </div>
          )}

          {/* Areas to improve */}
          {improvements && improvements.length > 0 && (
            <div className="stat-card border-amber-200 dark:border-amber-800 space-y-2">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Areas to Improve
              </p>
              {improvements.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">→</span>{s}
                </p>
              ))}
            </div>
          )}

          {/* Detailed feedback */}
          <div className="stat-card space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Detailed Feedback
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
          </div>

          {/* Clinical pearl */}
          {clinical_pearl && (
            <div className="stat-card bg-primary/5 border-primary/20 space-y-1.5">
              <p className="text-sm font-semibold text-primary flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Clinical Pearl
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{clinical_pearl}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="mt-4 space-y-4">
          {STEPS.map(({ step, label, icon }) => {
            const sKey = step as keyof typeof breakdown;
            const sScore = breakdown[sKey] ?? 0;
            const pct = (sScore / 20) * 100;
            const modelAns = modelAnswer?.[step as keyof ModelAnswer];
            const studentAns = answers[step];
            return (
              <div key={step} className="stat-card space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <span>{icon}</span> {label}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", pct >= 75 ? "border-green-400 text-green-600" : pct >= 50 ? "border-amber-400 text-amber-600" : "border-red-400 text-red-600")}
                  >
                    {sScore}/20
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Answer</p>
                    <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed min-h-[60px]">
                      {studentAns || <span className="italic opacity-50">Not answered</span>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Ideal Answer</p>
                    <div className="bg-green-500/5 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed min-h-[60px]">
                      {modelAns || <span className="italic opacity-50">Not available</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <Button onClick={onRetry} className="gap-2 w-full sm:w-auto">
        <FlaskConical className="h-4 w-4" /> Try Another Case
      </Button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function CaseSimulatorClient({ subjects, pastCases }: Props) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [activeCase, setActiveCase] = useState<CaseStudy | null>(null);
  const [modelAnswer, setModelAnswer] = useState<ModelAnswer | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const reset = () => {
    setActiveCase(null); setModelAnswer(null); setCurrentStep(0);
    setAnswers({}); setCurrentAnswer(""); setEvaluation(null); setGenError(null);
  };

  const generateCase = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubject, difficulty }),
      });
      const data = await res.json();
      if (!res.ok || !data.case) {
        throw new Error(data.error || "Case generation failed. Please try again.");
      }
      setActiveCase(data.case);
      setModelAnswer(data.modelAnswer ?? null);
      setCurrentStep(0); setAnswers({}); setCurrentAnswer(""); setEvaluation(null);
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitStep = async () => {
    if (!currentAnswer.trim() || !activeCase) return;
    const step = STEPS[currentStep];
    const newAnswers = { ...answers, [step.step]: currentAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentStep + 1 >= STEPS.length) {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/case", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId: activeCase.id, answers: newAnswers, modelAnswer }),
        });
        const data = await res.json();
        if (!res.ok || typeof data.score !== "number") {
          throw new Error(data.error || "Evaluation failed. Please try again.");
        }
        setEvaluation({ ...data, modelAnswer: data.modelAnswer ?? modelAnswer });
      } catch (err) {
        setGenError((err as Error).message);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  // ── Results view ─────────────────────────────────────────────
  if (evaluation && activeCase) {
    return (
      <ResultsView
        caseStudy={activeCase}
        answers={answers}
        evaluation={evaluation}
        onRetry={reset}
      />
    );
  }

  // ── Active case — step-by-step ───────────────────────────────
  if (activeCase) {
    const step = STEPS[currentStep];
    return (
      <div className="p-6 space-y-5 max-w-3xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight line-clamp-2">{activeCase.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("text-[11px] px-2 py-0.5 rounded-full capitalize font-medium", DIFF_COLOR[activeCase.difficulty])}>
                {diffLabel(activeCase.difficulty)}
              </span>
              {activeCase.subjects?.name && (
                <span className="text-xs text-muted-foreground">{activeCase.subjects.name}</span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 shrink-0">
            <RotateCcw className="h-3.5 w-3.5" /> New Case
          </Button>
        </div>

        {/* Step progress bar */}
        <div className="stat-card py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-xs font-medium text-primary">{step.label}</span>
          </div>
          <Progress value={((currentStep) / STEPS.length) * 100} className="h-1.5 mb-3" />
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.step} className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
                  i < currentStep  ? "dentora-gradient text-white" :
                  i === currentStep ? "border-2 border-primary bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <span>{s.icon}</span>}
                </div>
                <span className={cn("text-[9px] hidden sm:block text-center", i === currentStep ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Case presentation (progressively revealed) */}
        <div className="stat-card space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patient Presentation</p>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Chief Complaint</p>
            <p className="text-sm">{activeCase.chief_complaint}</p>
          </div>

          <AnimatePresence>
            {currentStep >= 1 && activeCase.history && (
              <motion.div key="history" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">History</p>
                <p className="text-sm">{activeCase.history}</p>
              </motion.div>
            )}
            {currentStep >= 2 && activeCase.examination_findings && (
              <motion.div key="exam" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Examination Findings</p>
                <p className="text-sm">{activeCase.examination_findings}</p>
              </motion.div>
            )}
            {currentStep >= 3 && activeCase.investigation_results && (
              <motion.div key="invest" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Investigation Results</p>
                <p className="text-sm">{activeCase.investigation_results}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Answer area */}
        <div className="stat-card space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{step.icon}</span>
            <p className="font-semibold text-sm">{step.label}</p>
          </div>
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 leading-relaxed">{step.question}</p>

          {genError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{genError}</span>
            </div>
          )}

          <Textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Write your clinical answer here…"
            rows={5}
            className="resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) submitStep(); }}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ctrl+Enter to advance</span>
            <Button onClick={submitStep} disabled={!currentAnswer.trim() || loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              {loading
                ? currentStep + 1 >= STEPS.length ? "Evaluating…" : "Processing…"
                : currentStep + 1 >= STEPS.length ? "Submit for Scoring" : "Next Step"}
            </Button>
          </div>
        </div>

        {/* Previously answered steps */}
        {Object.keys(answers).length > 0 && (
          <details className="stat-card group">
            <summary className="text-sm font-medium cursor-pointer list-none flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" /> View previous answers ({Object.keys(answers).length})
            </summary>
            <div className="mt-3 space-y-3 pt-3 border-t">
              {STEPS.slice(0, currentStep).map(({ step: s, label, icon }) => (
                answers[s] && (
                  <div key={s}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{icon} {label}</p>
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 leading-relaxed">{answers[s]}</p>
                  </div>
                )
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  // ── Setup / landing screen ────────────────────────────────────
  return (
    <div className="p-6 animate-fade-in space-y-5 max-w-3xl">
      <div>
        <h1 className="page-title">Case Simulator</h1>
        <p className="page-subtitle">Practice clinical case analysis with AI-generated patient scenarios</p>
      </div>

      {/* Configuration card */}
      <div className="stat-card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-10 h-10 dentora-gradient rounded-xl flex items-center justify-center text-xl">🏥</div>
          <div>
            <p className="font-semibold">Configure Your Case</p>
            <p className="text-xs text-muted-foreground">Choose subject and difficulty</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Subject</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a subject…" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Difficulty Level</label>
          <div className="grid grid-cols-3 gap-3">
            {UI_DIFFICULTIES.map(({ value, label, icon, desc }) => (
              <button
                key={value}
                onClick={() => setDifficulty(value)}
                className={cn(
                  "py-3.5 px-3 rounded-xl border-2 text-left transition-all space-y-1",
                  difficulty === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                <div className="text-base">{icon}</div>
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {genError && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{genError}</span>
          </div>
        )}

        <Button
          onClick={generateCase}
          disabled={!selectedSubject || loading}
          className="w-full h-11 gap-2 dentora-gradient text-white border-0 hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {loading ? "Generating clinical case…" : "Generate Clinical Case"}
        </Button>
        {loading && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">AI is building your case… ~10 seconds</p>
        )}
      </div>

      {/* Past cases */}
      {pastCases.length > 0 && (
        <div className="stat-card">
          <p className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Past Cases
          </p>
          <ScrollArea className="h-52">
            <div className="space-y-0 pr-3">
              {pastCases.map((c) => {
                const bestScore = c.case_submissions?.reduce((max, s) => Math.max(max, s.ai_score ?? 0), 0);
                return (
                  <div key={c.id} className="flex items-center justify-between py-3 border-b last:border-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium", DIFF_COLOR[c.difficulty] ?? "bg-muted")}>
                          {diffLabel(c.difficulty)}
                        </span>
                        {c.subjects?.name && (
                          <span className="text-[10px] text-muted-foreground truncate">{c.subjects.name}</span>
                        )}
                        {c.created_at && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(c.created_at), "dd MMM")}</span>
                        )}
                      </div>
                    </div>
                    {(bestScore ?? 0) > 0 && (
                      <Badge className={cn("shrink-0 gap-1 border-0", (bestScore ?? 0) >= 75 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
                        <Trophy className="h-3 w-3" />{bestScore}%
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
