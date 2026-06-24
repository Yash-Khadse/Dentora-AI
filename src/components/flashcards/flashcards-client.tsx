"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Minus, Check, Zap, RotateCcw, Trophy, BookOpen, Sparkles, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BDS_FINAL_YEAR_SUBJECTS } from "@/lib/constants/subjects";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject_id?: string;
  ease_factor: number;
  interval_days: number;
  due_date: string;
  review_count: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Props {
  dueCards: Flashcard[];
  allCards: Flashcard[];
  userId: string;
  subjects: Subject[];
}

type ReviewRating = "again" | "hard" | "good" | "easy";
type View = "review" | "generate" | "done";

const RATING_CONFIG = [
  { rating: "again" as ReviewRating, label: "Again", icon: X, color: "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-800 dark:text-red-400" },
  { rating: "hard" as ReviewRating, label: "Hard", icon: Minus, color: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400" },
  { rating: "good" as ReviewRating, label: "Good", icon: Check, color: "border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" },
  { rating: "easy" as ReviewRating, label: "Easy", icon: Zap, color: "border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 dark:border-green-800 dark:text-green-400" },
];

export function FlashcardsClient({ dueCards, allCards, subjects }: Props) {
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>(dueCards);
  const [localAll, setLocalAll] = useState<Flashcard[]>(allCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [view, setView] = useState<View>(dueCards.length > 0 ? "review" : "generate");

  // Generate form state
  const [genSubjectId, setGenSubjectId] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState("15");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [lastGenCount, setLastGenCount] = useState(0);

  const currentCard = reviewQueue[currentIndex];
  const progress = reviewQueue.length > 0 ? (reviewed / reviewQueue.length) * 100 : 0;

  const handleRate = async (rating: ReviewRating) => {
    if (!currentCard || isAnimating) return;
    setIsAnimating(true);

    try {
      await fetch("/api/flashcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: currentCard.id, rating }),
      });
    } catch { /* continue */ }

    setTimeout(() => {
      setReviewed((r) => r + 1);
      if (currentIndex + 1 >= reviewQueue.length) {
        setView("done");
      } else {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
      }
      setIsAnimating(false);
    }, 200);
  };

  const handleGenerate = async () => {
    if (!genSubjectId) { setGenError("Please select a subject"); return; }
    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: genSubjectId,
          topic: genTopic.trim() || undefined,
          count: Math.max(5, Math.min(25, parseInt(genCount) || 15)),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const newCards: Flashcard[] = data.cards ?? [];
      setLastGenCount(newCards.length);
      setLocalAll((prev) => [...newCards, ...prev]);

      // Add newly generated cards to review queue if due today
      const today = new Date().toISOString().split("T")[0];
      const dueNow = newCards.filter((c) => c.due_date <= today);
      if (dueNow.length > 0) {
        setReviewQueue((prev) => [...prev.slice(currentIndex), ...dueNow]);
      }

      setGenTopic("");
      setGenError(null);
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  // ── Done screen ──
  if (view === "done") {
    return (
      <div className="p-6 animate-fade-in">
        <h1 className="page-title mb-6">Flashcards</h1>
        <div className="max-w-md mx-auto">
          <div className="stat-card text-center py-12 space-y-4">
            <div className="w-20 h-20 dentora-gradient rounded-2xl flex items-center justify-center text-4xl mx-auto">🎉</div>
            <div>
              <h2 className="text-2xl font-bold">Session Complete!</h2>
              <p className="text-muted-foreground mt-1">You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="font-bold text-lg">{reviewed}</div>
                <div className="text-muted-foreground text-xs">Cards reviewed</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="font-bold text-lg text-primary">100%</div>
                <div className="text-muted-foreground text-xs">Completion</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView("generate")} className="flex-1 gap-2">
                <Sparkles className="h-4 w-4" /> Generate More
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1 gap-2">
                <RotateCcw className="h-4 w-4" /> Restart
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Generate view ──
  const GeneratePanel = () => (
    <div className="stat-card space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 dentora-gradient rounded-lg flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm">AI Flashcard Generator</p>
          <p className="text-xs text-muted-foreground">Generate exam-ready cards for any subject or topic</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject *</label>
          <Select value={genSubjectId} onValueChange={setGenSubjectId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a subject..." />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Topic <span className="text-muted-foreground/60">(optional — leave blank for high-yield mix)</span>
          </label>
          <Input
            placeholder="e.g. Dry Socket, Pulpotomy, Angle's Classification..."
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            className="h-9"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Number of cards</label>
          <Select value={genCount} onValueChange={setGenCount}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 25].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} cards</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {genError && (
        <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{genError}</p>
      )}

      {lastGenCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 px-3 py-2 rounded-lg">
          <Check className="h-3.5 w-3.5" />
          {lastGenCount} cards generated and added to your deck!
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={generating || !genSubjectId}
        className="w-full gap-2"
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate {genCount} Flashcards</>
        )}
      </Button>
    </div>
  );

  // ── No cards yet ──
  if (reviewQueue.length === 0 || view === "generate") {
    return (
      <div className="p-6 animate-fade-in space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Flashcards</h1>
            <p className="page-subtitle">{localAll.length} cards in your deck</p>
          </div>
          <div className="flex items-center gap-2">
            {localAll.length > 0 && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                {reviewQueue.length} due today
              </Badge>
            )}
            {reviewQueue.length > 0 && view === "generate" && (
              <Button size="sm" onClick={() => setView("review")} variant="outline" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Review ({reviewQueue.length})
              </Button>
            )}
          </div>
        </div>

        {localAll.length === 0 && (
          <div className="stat-card">
            <div className="empty-state">
              <div className="empty-state-icon">🃏</div>
              <h2 className="text-xl font-semibold">No flashcards yet</h2>
              <p className="text-muted-foreground max-w-xs text-sm">
                Generate AI-powered flashcards for any BDS subject. They&apos;ll be scheduled using spaced repetition to maximize retention.
              </p>
            </div>
          </div>
        )}

        <GeneratePanel />

        {localAll.length > 0 && (
          <div className="stat-card">
            <p className="text-sm font-medium mb-3">Your Deck ({localAll.length} cards)</p>
            <ScrollArea className="h-48">
              <div className="space-y-1.5 pr-3">
                {localAll.slice(0, 30).map((card) => (
                  <div key={card.id} className="text-xs p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between gap-3">
                    <p className="truncate">{card.front.slice(0, 70)}{card.front.length > 70 ? "…" : ""}</p>
                    <span className="text-muted-foreground shrink-0">{card.interval_days}d</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }

  // ── Review view ──
  return (
    <div className="p-6 animate-fade-in space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-subtitle">{reviewQueue.length - reviewed} cards remaining</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
            <Zap className="h-3.5 w-3.5" />
            {dueCards.length} due
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setView("generate")} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Generate
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium">{reviewed} / {reviewQueue.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flip card */}
      <div
        className="flip-card h-72 cursor-pointer select-none"
        onClick={() => !isAnimating && setFlipped((f) => !f)}
      >
        <div className={cn("flip-card-inner h-full", flipped && "flipped")}>
          <div className="flip-card-front border bg-card shadow-card flex flex-col items-center justify-center p-8 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-6 bg-muted px-3 py-1 rounded-full">
              Card {currentIndex + 1} of {reviewQueue.length} · Question
            </span>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentCard.id + "-front"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-lg font-medium leading-relaxed"
              >
                {currentCard.front}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" /> Tap to reveal answer
            </p>
          </div>

          <div className="flip-card-back border bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 shadow-card-hover flex flex-col items-center justify-center p-8 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-6 bg-primary/10 px-3 py-1 rounded-full">
              Answer
            </span>
            <p className="text-lg font-medium leading-relaxed">{currentCard.back}</p>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="space-y-3"
          >
            <p className="text-xs text-center text-muted-foreground font-medium">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-2">
              {RATING_CONFIG.map(({ rating, label, icon: Icon, color }) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  disabled={isAnimating}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all duration-150 font-medium text-sm disabled:opacity-50",
                    color
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card list preview */}
      <Tabs defaultValue="due">
        <TabsList className="w-full">
          <TabsTrigger value="due" className="flex-1">Due ({reviewQueue.length})</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">All Cards ({localAll.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="due" className="mt-3">
          <ScrollArea className="h-40">
            <div className="space-y-1.5 pr-3">
              {reviewQueue.slice(0, 10).map((card, i) => (
                <div
                  key={card.id}
                  className={cn(
                    "text-sm p-3 rounded-lg border transition-colors",
                    i === currentIndex
                      ? "border-primary bg-primary/5 font-medium"
                      : i < currentIndex
                        ? "opacity-40 bg-muted/30 line-through"
                        : "bg-muted/20"
                  )}
                >
                  <span className="text-muted-foreground text-xs mr-2">{i + 1}.</span>
                  {card.front.slice(0, 70)}{card.front.length > 70 ? "…" : ""}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="all" className="mt-3">
          <ScrollArea className="h-40">
            <div className="space-y-1.5 pr-3">
              {localAll.slice(0, 20).map((card) => (
                <div key={card.id} className="text-sm p-3 rounded-lg border bg-muted/20 flex items-center justify-between gap-3">
                  <p className="truncate text-xs">{card.front.slice(0, 60)}{card.front.length > 60 ? "…" : ""}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Trophy className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{card.interval_days}d</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
