import { Metadata } from "next";
import { AiTutorChat } from "@/components/ai-tutor/chat";

export const metadata: Metadata = { title: "AI Tutor" };

export default function AiTutorPage() {
  return (
    <div className="p-4 md:p-6 h-[calc(100dvh-10rem)] md:h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)] flex flex-col">
      <div className="mb-3 md:mb-4 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold">AI Dental Tutor</h1>
        <p className="text-muted-foreground text-sm hidden sm:block">
          Ask anything — get exam-optimized answers, mnemonics, viva questions, and more.
        </p>
      </div>
      <AiTutorChat />
    </div>
  );
}
