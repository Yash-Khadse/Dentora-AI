import { Metadata } from "next";
import { AiTutorChat } from "@/components/ai-tutor/chat";

export const metadata: Metadata = { title: "AI Tutor" };

export default function AiTutorPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Dental Tutor</h1>
        <p className="text-muted-foreground text-sm">
          Ask anything — get exam-optimized answers, mnemonics, viva questions, and more.
        </p>
      </div>
      <AiTutorChat />
    </div>
  );
}
