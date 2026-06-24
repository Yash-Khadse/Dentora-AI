/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { ensureUserRows } from "@/lib/db/ensure-user";
import { generateJSON } from "@/lib/ai/client";

export const maxDuration = 60;

// Map UI difficulty labels → DB CHECK constraint values ('easy','medium','hard')
const DIFFICULTY_MAP: Record<string, string> = {
  beginner:     "easy",
  intermediate: "medium",
  advanced:     "hard",
  easy:         "easy",
  medium:       "medium",
  hard:         "hard",
};

// POST — generate a new AI clinical case
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await ensureUserRows(supabase, user);

    const { subjectId, difficulty = "intermediate" } = await req.json();
    if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

    const dbDifficulty = DIFFICULTY_MAP[difficulty] ?? "medium";

    // Subjects table is publicly readable — user client is fine
    const { data: subject } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", subjectId)
      .single() as any;

    const subjectName = subject?.name ?? "General Dentistry";

    const prompt = `You are a dental examiner generating a realistic BDS final year clinical case study.

Subject: ${subjectName}
Difficulty: ${difficulty} (mapped to: ${dbDifficulty})

Return ONLY a JSON object with exactly this structure:
{
  "title": "Brief descriptive case title, e.g. '45-year-old with painful swelling in lower jaw for 3 days'",
  "chief_complaint": "Patient's presenting complaint in their own words (1-2 sentences)",
  "history": "Detailed history — onset, duration, associated symptoms, past medical/dental history, medications, allergies, social history (5-7 sentences)",
  "examination_findings": "Extraoral: [findings]. Intraoral: [findings]. Include vitals and relevant clinical signs (5-7 sentences)",
  "investigation_results": "Radiograph findings, blood investigations, biopsy results if indicated — with values (3-5 sentences)",
  "diagnosis": "Primary diagnosis. Differentials: 1. [differential] 2. [differential]",
  "treatment_plan": "Phase 1 (Emergency/Immediate): ... Phase 2 (Definitive): ... Phase 3 (Maintenance): ...",
  "model_answer": {
    "history": "Ideal history-taking: specific questions the student should ask, with clinical reasoning",
    "examination": "Systematic examination approach: extraoral, intraoral, special tests, expected findings and their significance",
    "investigation": "Appropriate investigations with rationale, and how to interpret the results in this case",
    "diagnosis": "Correct primary diagnosis with supporting evidence, differential diagnoses with justification and how to rule them out",
    "treatment": "Complete phased treatment plan: emergency care, definitive treatment, materials/techniques, recall schedule"
  }
}

Make it clinically realistic and appropriate for ${subjectName}. Include subject-specific findings typical of this specialty.`;

    const caseData = await generateJSON<any>({ prompt });

    if (!caseData?.title || !caseData?.chief_complaint) {
      return NextResponse.json({ error: "AI returned an invalid case — please try again." }, { status: 500 });
    }

    // Use admin client to bypass RLS on case_studies
    // (case_studies has no INSERT policy for authenticated users in current schema)
    const admin = createAdminClient();

    // Try with model_answer column first (present after migration 006 is applied)
    let savedCase: any = null;
    const baseRow = {
      created_by: user.id,
      subject_id: subjectId,
      title: caseData.title,
      chief_complaint: caseData.chief_complaint,
      history: caseData.history ?? null,
      examination_findings: caseData.examination_findings ?? null,
      investigation_results: caseData.investigation_results ?? null,
      diagnosis: caseData.diagnosis ?? null,
      treatment_plan: caseData.treatment_plan ?? null,
      difficulty: dbDifficulty,
      is_ai_generated: true,
      is_public: false,
    };

    // Try with model_answer first
    const { data: withMA, error: maErr } = await admin
      .from("case_studies")
      .insert({ ...baseRow, model_answer: caseData.model_answer ?? null })
      .select()
      .single() as any;

    if (maErr) {
      if (maErr.message?.includes("model_answer")) {
        // Column not yet added — insert without it
        const { data: withoutMA, error: noMAErr } = await admin
          .from("case_studies")
          .insert(baseRow)
          .select()
          .single() as any;
        if (noMAErr) throw noMAErr;
        savedCase = withoutMA;
      } else {
        throw maErr;
      }
    } else {
      savedCase = withMA;
    }

    // Always return modelAnswer in response so client can store it locally
    return NextResponse.json({ case: savedCase, modelAnswer: caseData.model_answer ?? null });
  } catch (error) {
    console.error("[case POST]", error);
    return NextResponse.json({ error: "Failed to generate case. Please try again." }, { status: 500 });
  }
}

// PUT — evaluate student answers
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { caseId, answers, modelAnswer: clientModelAnswer } = await req.json();
    if (!caseId || !answers) {
      return NextResponse.json({ error: "caseId and answers required" }, { status: 400 });
    }

    // Fetch case with admin client (bypasses the SELECT RLS that blocks private cases)
    const admin = createAdminClient();
    const { data: caseData, error: fetchErr } = await admin
      .from("case_studies")
      .select("*")
      .eq("id", caseId)
      .single() as any;

    if (fetchErr || !caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Use model_answer from DB (if column exists) or client-provided fallback
    const modelAnswer = caseData.model_answer ?? clientModelAnswer ?? null;

    const prompt = `You are a senior dental examiner evaluating a BDS final year student's clinical case analysis.

Case: ${caseData.title}
Subject area: ${subjectName(caseData)}

${modelAnswer
  ? `IDEAL MODEL ANSWERS:
History:       ${modelAnswer.history}
Examination:   ${modelAnswer.examination}
Investigation: ${modelAnswer.investigation}
Diagnosis:     ${modelAnswer.diagnosis}
Treatment:     ${modelAnswer.treatment}`
  : `Correct diagnosis: ${caseData.diagnosis ?? "Not specified"}
Correct treatment: ${caseData.treatment_plan ?? "Not specified"}`
}

STUDENT'S ANSWERS:
History:       ${answers.history || "(not answered)"}
Examination:   ${answers.examination || "(not answered)"}
Investigation: ${answers.investigation || "(not answered)"}
Diagnosis:     ${answers.diagnosis || "(not answered)"}
Treatment:     ${answers.treatment || "(not answered)"}

Evaluate rigorously and return ONLY this JSON:
{
  "score": <overall 0-100>,
  "breakdown": {
    "history": <0-20>,
    "examination": <0-20>,
    "investigation": <0-20>,
    "diagnosis": <0-20>,
    "treatment": <0-20>
  },
  "feedback": "3-4 paragraph comprehensive feedback: what was correct, what was missed, clinical reasoning gaps, and how to improve",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific area to improve 1", "specific area to improve 2"],
  "clinical_pearl": "One key clinical teaching point from this case that the student should remember"
}`;

    const evaluation = await generateJSON<any>({ prompt });

    if (typeof evaluation?.score !== "number") {
      return NextResponse.json({ error: "Evaluation failed — please try again." }, { status: 500 });
    }

    // case_submissions has proper RLS (case_sub_own_data policy) — user client works
    await supabase.from("case_submissions").insert({
      case_id: caseId,
      user_id: user.id,
      submitted_diagnosis: answers.diagnosis || null,
      submitted_treatment: answers.treatment || null,
      submitted_reasoning: answers.history || null,
      ai_score: evaluation.score,
      ai_feedback: evaluation.feedback,
      ai_evaluation: {
        ...evaluation,
        student_answers: answers,
        model_answer: modelAnswer,
      },
    });

    return NextResponse.json({ ...evaluation, modelAnswer });
  } catch (error) {
    console.error("[case PUT]", error);
    return NextResponse.json({ error: "Failed to evaluate. Please try again." }, { status: 500 });
  }
}

function subjectName(c: any): string {
  return c.subjects?.name ?? c.subject_id ?? "Dentistry";
}
