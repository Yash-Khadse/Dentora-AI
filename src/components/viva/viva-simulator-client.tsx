"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Send, Loader2, RotateCcw, Trophy, Bot, User, Sparkles, StopCircle } from "lucide-react";
import { EXAM_MODES } from "@/lib/constants/subjects";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Subject { id: string; name: string; code: string; }
interface VivaSession { id: string; subject_id: string; mode: string; overall_score?: number; created_at: string; }

interface QAItem {
  question: string;
  idealAnswer?: string;
  studentAnswer?: string;
  evaluation?: {
    overall_score: number;
    grade: string;
    feedback: string;
    follow_up_questions?: string[];
  };
}

interface Message {
  role: "examiner" | "student" | "feedback";
  content: string;
}

interface Props { subjects: Subject[]; pastSessions: VivaSession[]; userId: string; }

export function VivaSimulatorClient({ subjects, pastSessions }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("intermediate");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [qaHistory, setQaHistory] = useState<QAItem[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const startSession = async () => {
    if (!selectedSubject || !selectedMode) return;
    setLoading(true);
    try {
      // Step 1: create session
      const sessionRes = await fetch("/api/ai/viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_session", subject: selectedSubject, mode: selectedMode }),
      });
      const sessionData = await sessionRes.json();
      const newSessionId = sessionData.session?.id;
      setSessionId(newSessionId);

      // Step 2: generate first question
      const questionRes = await fetch("/api/ai/viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_question",
          sessionId: newSessionId,
          subject: selectedSubject,
          mode: selectedMode,
          previousQA: [],
        }),
      });
      const questionData = await questionRes.json();
      const q = questionData.question?.question ?? "Please describe the anatomy of the oral cavity.";
      setCurrentQuestion(q);
      setCurrentQuestionId(questionData.questionId ?? null);
      setMessages([{ role: "examiner", content: q }]);
      setQuestionCount(1);
      setSessionStarted(true);
      setQaHistory([]);
    } catch {
      setMessages([{ role: "examiner", content: "Session could not start. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (!input.trim() || loading) return;
    const answer = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "student", content: answer }]);
    setLoading(true);

    try {
      // Evaluate the answer
      const evalRes = await fetch("/api/ai/viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_answer",
          sessionId,
          subject: selectedSubject,
          question: currentQuestion,
          questionId: currentQuestionId,
          studentAnswer: answer,
        }),
      });
      const evalData = await evalRes.json();
      const evaluation = evalData.evaluation ?? {};
      const score = evaluation.overall_score ?? 0;
      const feedback = evaluation.feedback ?? "Answer received.";

      // Record this Q&A
      const updatedQA: QAItem[] = [
        ...qaHistory,
        {
          question: currentQuestion,
          studentAnswer: answer,
          evaluation,
        },
      ];
      setQaHistory(updatedQA);

      // Show inline feedback
      setMessages((prev) => [
        ...prev,
        { role: "feedback", content: `Score: ${score}/100 â€” ${feedback}` },
      ]);

      // Generate next question
      const nextRes = await fetch("/api/ai/viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_question",
          sessionId,
          subject: selectedSubject,
          mode: selectedMode,
          previousQA: updatedQA.map((qa) => ({
            question: qa.question,
            answer: qa.studentAnswer,
          })),
        }),
      });
      const nextData = await nextRes.json();
      const nextQ = nextData.question?.question ?? "Tell me more about this topic.";
      setCurrentQuestion(nextQ);
      setCurrentQuestionId(nextData.questionId ?? null);
      setQuestionCount((n) => n + 1);
      setMessages((prev) => [...prev, { role: "examiner", content: nextQ }]);
    } catch {
      setMessages((prev) => [...prev, { role: "examiner", content: "Please repeat your answer." }]);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    setLoading(true);
    try {
      await fetch("/api/ai/viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end_session", sessionId }),
      });
      const avgScore = qaHistory.length > 0
        ? Math.round(qaHistory.reduce((sum, qa) => sum + (qa.evaluation?.overall_score ?? 0), 0) / qaHistory.length)
        : 0;
      setFinalScore(avgScore);
      setSessionEnded(true);
    } catch {
      setSessionEnded(true);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setSessionStarted(false);
    setSessionEnded(false);
    setMessages([]);
    setInput("");
    setSessionId(null);
    setQuestionCount(0);
    setCurrentQuestion("");
    setCurrentQuestionId(null);
    setQaHistory([]);
    setFinalScore(null);
  };

  const modeInfo = EXAM_MODES.find((m) => m.value === selectedMode);
  const subjectName = subjects.find((s) => s.id === selectedSubject)?.name;

  // â”€â”€ Session ended â€” show results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (sessionEnded) {
    const scoreColor = finalScore !== null && finalScore >= 75
      ? "text-green-500"
      : finalScore !== null && finalScore >= 50
        ? "text-amber-500"
        : "text-red-500";
    return (
      <div className="p-4 md:p-6 animate-fade-in space-y-5 max-w-3xl">
        <div>
          <h1 className="page-title">Viva Complete</h1>
          <p className="page-subtitle">{subjectName} Â· {modeInfo?.label} Mode</p>
        </div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="stat-card text-center py-10">
          <div className="text-6xl mb-3">
            {finalScore !== null && finalScore >= 75 ? "ðŸ†" : finalScore !== null && finalScore >= 50 ? "ðŸ“" : "ðŸ“š"}
          </div>
          <div className={cn("text-5xl font-bold mb-2", scoreColor)}>
            {finalScore ?? "â€”"}%
          </div>
          <p className="text-muted-foreground">
            {questionCount} question{questionCount !== 1 ? "s" : ""} answered
          </p>
          <Button onClick={resetSession} className="mt-6 gap-2">
            <RotateCcw className="h-4 w-4" /> Start New Session
          </Button>
        </motion.div>

        {qaHistory.length > 0 && (
          <div className="stat-card space-y-4">
            <h3 className="font-semibold text-sm">Session Review</h3>
            {qaHistory.map((qa, i) => (
              <div key={i} className="border-b pb-4 last:border-0 last:pb-0 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Q{i + 1}</p>
                <p className="text-sm font-medium">{qa.question}</p>
                {qa.studentAnswer && (
                  <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2">{qa.studentAnswer}</p>
                )}
                {qa.evaluation && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {qa.evaluation.overall_score}/100
                    </Badge>
                    <span className="text-xs text-muted-foreground">{qa.evaluation.grade}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // â”€â”€ Setup screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!sessionStarted) {
    return (
      <div className="p-4 md:p-6 animate-fade-in space-y-6 max-w-3xl">
        <div>
          <h1 className="page-title">Viva Simulator</h1>
          <p className="page-subtitle">Practice oral examinations with an AI-powered examiner</p>
        </div>

        <div className="stat-card space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="w-10 h-10 dentora-gradient rounded-xl flex items-center justify-center">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Configure Your Session</h2>
              <p className="text-xs text-muted-foreground">Choose your subject and difficulty level</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a subject to practice" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Exam Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {EXAM_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setSelectedMode(mode.value)}
                  className={cn(
                    "text-left p-4 rounded-xl border-2 transition-all duration-150",
                    selectedMode === mode.value
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  <p className="font-semibold text-sm">{mode.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={startSession}
            disabled={!selectedSubject || loading}
            className="w-full h-11 gap-2 dentora-gradient text-white border-0 hover:opacity-90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
            {loading ? "Starting sessionâ€¦" : "Start Viva Session"}
          </Button>
        </div>

        {pastSessions.length > 0 && (
          <div className="stat-card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Recent Sessions
            </h3>
            <div className="space-y-2">
              {pastSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium capitalize">{session.mode.replace("_", " ")} Mode</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(session.created_at), "dd MMM yyyy, h:mm a")}</p>
                  </div>
                  {session.overall_score !== undefined && session.overall_score > 0 && (
                    <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                      <Trophy className="h-3 w-3" />
                      {session.overall_score}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // â”€â”€ Active session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="p-4 md:p-6 animate-fade-in space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 dentora-gradient rounded-xl flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{subjectName}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">{modeInfo?.label ?? selectedMode} Mode</Badge>
              <span className="text-xs text-muted-foreground">{questionCount} question{questionCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={endSession}
          disabled={loading}
          size="sm"
          className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <StopCircle className="h-3.5 w-3.5" />
          End Session
        </Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <ScrollArea className="h-[420px]" ref={scrollRef as React.RefObject<HTMLDivElement>}>
          <div className="p-5 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === "student" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {msg.role !== "feedback" && (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "examiner" ? "dentora-gradient text-white" : "bg-muted"
                    )}>
                      {msg.role === "examiner" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                  )}

                  <div className={cn(
                    "rounded-2xl px-4 py-3",
                    msg.role === "examiner"
                      ? "max-w-[78%] bg-muted rounded-tl-sm"
                      : msg.role === "student"
                        ? "max-w-[78%] bg-primary text-primary-foreground rounded-tr-sm"
                        : "w-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl"
                  )}>
                    {msg.role === "examiner" && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> AI Examiner
                      </p>
                    )}
                    {msg.role === "feedback" && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-1">
                        Feedback
                      </p>
                    )}
                    <p className={cn(
                      "text-sm leading-relaxed",
                      msg.role === "feedback" && "text-green-800 dark:text-green-300"
                    )}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full dentora-gradient flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4 bg-muted/20">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answerâ€¦ (Enter to send, Shift+Enter for new line)"
              className="resize-none bg-background text-sm"
              rows={3}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); }
              }}
            />
            <Button
              onClick={sendAnswer}
              disabled={!input.trim() || loading}
              className="self-end h-11 w-11 p-0 dentora-gradient text-white border-0 hover:opacity-90 shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
