import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { generateEmbedding } from "@/lib/ai/client";

export const maxDuration = 60;

// Minimal PDF text extractor (pulls ASCII text from PDF binary)
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(buffer);
    const str = new TextDecoder("latin1").decode(bytes);
    // Extract text between BT/ET markers (basic PDF text extraction)
    const texts: string[] = [];
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(str)) !== null) {
      // Extract string literals from Tj/TJ operators
      const block = match[1];
      const strRegex = /\(([^)]*)\)\s*Tj|(\[.*?\])\s*TJ/g;
      let sm;
      while ((sm = strRegex.exec(block)) !== null) {
        const raw = sm[1] ?? "";
        if (raw.trim().length > 0) texts.push(raw.trim());
      }
    }
    const extracted = texts.join(" ").replace(/\s+/g, " ").trim();
    // Fallback: return first 4000 printable chars from raw text
    if (extracted.length < 50) {
      return str
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);
    }
    return extracted.slice(0, 8000);
  } catch {
    return "";
  }
}

// Split text into chunks for embedding
function splitIntoChunks(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim().length > 20) chunks.push(chunk.trim());
    if (i + chunkSize >= words.length) break;
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check via server client (user JWT)
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use admin client for storage + DB writes (bypasses storage RLS)
    const admin = createAdminClient();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const pdfType = formData.get("type") as string || "notes";
    const subjectId = formData.get("subjectId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      return NextResponse.json({ error: "Only PDF and image files are supported" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 });
    }

    // Upload to Supabase Storage using admin client (bypasses storage RLS)
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const bucket = pdfType === "paper" ? "dentora-papers" : "dentora-notes";

    const { data: storageData, error: storageError } = await admin.storage
      .from(bucket)
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(fileName);

    // Save record
    const { data: record, error: dbError } = await admin
      .from("uploaded_pdfs")
      .insert({
        user_id: user.id,
        filename: storageData.path,
        original_name: file.name,
        file_url: publicUrl,
        file_size_bytes: file.size,
        subject_id: subjectId || null,
        pdf_type: pdfType,
        processed: false,
        embedding_status: "processing",
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // ── Process embeddings inline for notes ──
    if (pdfType === "notes" && file.type.includes("pdf")) {
      void (async () => {
        try {
          const buffer = await file.arrayBuffer();
          const text = await extractTextFromPDF(buffer);

          if (text.length > 50) {
            const chunks = splitIntoChunks(text);
            const chunkRows = [];

            for (let ci = 0; ci < Math.min(chunks.length, 20); ci++) {
              const chunk = chunks[ci];
              try {
                const embedding = await generateEmbedding(chunk);
                chunkRows.push({
                  pdf_id: record.id,
                  user_id: user.id,
                  content: chunk,
                  chunk_index: ci,
                  embedding,
                });
              } catch { /* skip individual chunk on embedding error */ }
            }

            if (chunkRows.length > 0) {
              await admin.from("document_chunks").insert(chunkRows);
            }
          }

          await admin
            .from("uploaded_pdfs")
            .update({ processed: true, embedding_status: "done" })
            .eq("id", record.id);
        } catch {
          await admin
            .from("uploaded_pdfs")
            .update({ embedding_status: "failed" })
            .eq("id", record.id);
        }
      })();
    } else {
      await admin
        .from("uploaded_pdfs")
        .update({ processed: true, embedding_status: "done" })
        .eq("id", record.id);
    }

    return NextResponse.json({ file: record, url: publicUrl });
  } catch (error) {
    console.error("[Upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
