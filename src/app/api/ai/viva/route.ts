import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { ensureUserRows } from "@/lib/db/ensure-user";
import { buildVivaPrompt, buildVivaEvaluatorPrompt } from "@/lib/ai/prompts";
import { generateText } from "@/lib/ai/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await ensureUserRows(supabase, user);

    const { action, sessionId, subject, topic, mode, question, studentAnswer, previousQA, questionId } = await req.json();

    // Resolve subject UUID to name for AI prompts
    let subjectName = subject;
    if (subject && subject.length === 36) {
      const { data: subjectRow } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", subject)
        .single() as any;
      if (subjectRow?.name) subjectName = subjectRow.name;
    }

    if (action === "generate_question") {
      const prompt = buildVivaPrompt(subjectName, topic || "General", mode, previousQA);
      const rawResponse = await generateText({ prompt });
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response");
      const questionData = JSON.parse(jsonMatch[0]);

      // Save question to session and return its ID so the client can reference it
      let savedQuestionId: string | null = null;
      if (sessionId) {
        const { data: savedQ } = await supabase.from("viva_questions").insert({
          session_id: sessionId,
          question_text: questionData.question,
          ai_ideal_answer: questionData.ideal_answer,
          question_order: previousQA?.length || 0,
        }).select("id").single() as any;
        savedQuestionId = savedQ?.id ?? null;
      }

      return NextResponse.json({ question: questionData, questionId: savedQuestionId });
    }

    if (action === "evaluate_answer") {
      const prompt = buildVivaEvaluatorPrompt(question, studentAnswer, "", subjectName);
      const rawResponse = await generateText({ prompt });
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response");
      const evaluation = JSON.parse(jsonMatch[0]);

      // Update the specific question by ID (avoids the ordering-in-update bug)
      if (questionId) {
        await supabase.from("viva_questions")
          .update({
            user_answer: studentAnswer,
            score: evaluation.overall_score,
            feedback: evaluation.feedback,
            follow_up_questions: evaluation.follow_up_questions || [],
          })
          .eq("id", questionId)
          .eq("session_id", sessionId);
      } else if (sessionId) {
        // Fallback: update by highest question_order if no questionId provided
        const { data: lastQ } = await supabase.from("viva_questions")
          .select("id")
          .eq("session_id", sessionId)
          .order("question_order", { ascending: false })
          .limit(1)
          .single() as any;
        if (lastQ?.id) {
          await supabase.from("viva_questions")
            .update({
              user_answer: studentAnswer,
              score: evaluation.overall_score,
              feedback: evaluation.feedback,
              follow_up_questions: evaluation.follow_up_questions || [],
            })
            .eq("id", lastQ.id);
        }
      }

      return NextResponse.json({ evaluation });
    }

    if (action === "create_session") {
      const { data: session, error } = await supabase
        .from("viva_sessions")
        .insert({ user_id: user.id, subject_id: subject, mode })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ session });
    }

    if (action === "end_session") {
      // Fetch all questions for this session
      const { data: questions } = await supabase
        .from("viva_questions")
        .select("*")
        .eq("session_id", sessionId);

      if (questions && questions.length > 0) {
        const scores = questions.map((q) => q.score || 0);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        await supabase.from("viva_sessions")
          .update({
            total_questions: questions.length,
            overall_score: Math.round(avg),
            accuracy_score: Math.round(avg),
            xp_earned: Math.round(avg / 10) * 10,
          })
          .eq("id", sessionId);

        // Award XP
        await supabase.rpc("increment_xp", {
          p_user_id: user.id,
          p_xp: Math.round(avg / 10) * 10,
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[Viva API]", error);
    return NextResponse.json({ error: "Viva request failed" }, { status: 500 });
  }
}
