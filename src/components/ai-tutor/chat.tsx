"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Bot, User, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { TUTOR_MODES, type TutorMode } from "@/lib/constants/textbooks";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Explain the classification of vesiculobullous lesions",
  "What are the steps in complete denture fabrication?",
  "Give me a mnemonic for local anesthesia complications",
  "Describe the treatment of impacted third molar",
  "List 5 most important viva questions on periodontitis",
  "Explain TMJ disorders with clinical features",
];

export function AiTutorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<TutorMode>("standard");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMode = TUTOR_MODES.find((m) => m.value === mode)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          mode,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullContent } : m))
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "notes");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        setUploadedFileName(file.name);
        setInput((prev) => prev ? `${prev}\n[Uploaded: ${file.name}]` : `I've uploaded "${file.name}" — please help me study from it.`);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl border bg-card overflow-hidden">
      {/* Mode selector bar */}
      <div className="border-b px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TUTOR_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                mode === m.value
                  ? "bg-primary text-primary-foreground border-primary font-medium"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              )}
              title={m.description}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground hidden sm:block shrink-0">
          {activeMode.description}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center py-8">
            <div className="w-16 h-16 dentora-gradient rounded-2xl flex items-center justify-center">
              <Bot size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your AI Dental Tutor</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                Ask any BDS question and get exam-optimized explanations, mnemonics, and viva prep.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs bg-muted/50 hover:bg-muted px-3 py-2.5 rounded-lg border border-border transition-colors"
                >
                  <Sparkles size={10} className="inline mr-1 text-primary" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === "assistant" ? "dentora-gradient" : "bg-muted"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot size={16} className="text-white" />
                ) : (
                  <User size={16} className="text-muted-foreground" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "assistant"
                    ? "bg-muted rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="ai-response prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || "..."}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && messages[messages.length - 1]?.role === "user" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 dentora-gradient rounded-full flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        {uploadedFileName && (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Paperclip size={10} />
            <span className="truncate max-w-[200px]">{uploadedFileName}</span>
            <button onClick={() => setUploadedFileName(null)} className="text-destructive hover:underline ml-auto">Remove</button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div className="flex gap-2 items-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload PDF or image"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any dental topic, request mnemonics, viva questions..."
            className="min-h-[40px] max-h-32 resize-none text-sm"
            rows={1}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="h-10 w-10 shrink-0 p-0"
          >
            <Send size={16} />
          </Button>
        </div>
        {messages.length > 0 && (
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setMessages([])}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RotateCcw size={10} /> New conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
