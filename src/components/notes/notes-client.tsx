"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Upload, Loader2, Trash2, Eye, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { formatFileSize } from "@/lib/utils";

interface PDF { id: string; original_name: string; file_size_bytes?: number; processed: boolean; created_at: string; }
interface Note { id: string; title: string; content: string; subject_id?: string; updated_at: string; }
interface Props { pdfs: PDF[]; notes: Note[]; userId: string; }

export function NotesClient({ pdfs, notes }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPdfs, setLocalPdfs] = useState(pdfs);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are supported"); return; }
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Upload failed"); }
      const data = await res.json();
      setLocalPdfs((prev) => [data, ...prev]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dentora-gradient px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Notes & Documents</h1>
            <p className="text-white/75 text-sm mt-0.5">Upload PDFs · AI processes them for RAG-powered tutoring</p>
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="gap-2 bg-white text-blue-600 hover:bg-white/90 border-0 font-semibold">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {uploadError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2">
            ⚠️ {uploadError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total PDFs", value: localPdfs.length, icon: "📄", color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5" },
            { label: "Processed", value: localPdfs.filter((p) => p.processed).length, icon: "✅", color: "text-green-500", bg: "from-green-500/10 to-green-600/5" },
            { label: "Processing", value: localPdfs.filter((p) => !p.processed).length, icon: "⏳", color: "text-amber-500", bg: "from-amber-500/10 to-orange-500/5" },
            { label: "Notes", value: notes.length, icon: "📝", color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/5" },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className={`stat-card bg-gradient-to-br ${bg} text-center`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="pdfs">
          <TabsList>
            <TabsTrigger value="pdfs">PDFs ({localPdfs.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pdfs" className="mt-4">
            {localPdfs.length === 0 ? (
              <div className="stat-card">
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <p className="font-semibold text-lg">No PDFs uploaded yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Upload lecture notes, previous papers, or reference books. Our AI will read them and use them in your tutor sessions.
                  </p>
                  <Button onClick={() => fileRef.current?.click()} className="gap-2 mt-2">
                    <Upload className="h-4 w-4" /> Upload your first PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {localPdfs.map((pdf, i) => (
                  <motion.div
                    key={pdf.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card className="hover:shadow-card-hover transition-all duration-200 group">
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-950/20 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{pdf.original_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {pdf.file_size_bytes ? formatFileSize(pdf.file_size_bytes) : "—"} · {format(new Date(pdf.created_at), "dd MMM yyyy")}
                            </p>
                            <div className="mt-2">
                              {pdf.processed ? (
                                <span className="badge-success"><CheckCircle className="h-3 w-3" /> Ready for AI</span>
                              ) : (
                                <span className="badge-warning"><Clock className="h-3 w-3 animate-spin" /> Processing…</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            {notes.length === 0 ? (
              <div className="stat-card">
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <p className="font-semibold text-lg">No notes yet</p>
                  <p className="text-sm text-muted-foreground">Notes generated from your AI tutor sessions will appear here</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-3 pr-4">
                  {notes.map((note, i) => (
                    <motion.div key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <Card className="hover:shadow-card-hover transition-all duration-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{note.title}</CardTitle>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100"><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">Updated {format(new Date(note.updated_at), "dd MMM yyyy")}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
