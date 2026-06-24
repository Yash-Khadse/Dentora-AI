"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, Loader2, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Paper {
  id: string; subject_id?: string; year: number; exam_type: string;
  university: string; file_url?: string; analysis_json?: Record<string, unknown>; created_at: string;
  title: string;
}
interface Subject { id: string; name: string; code: string; }
interface Props { papers: Paper[]; subjects: Subject[]; userId: string; }

const EXAM_TYPE_COLORS: Record<string, string> = {
  university: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  internal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  model: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function PreviousPapersClient({ papers, subjects }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const localPapers = papers;
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const subjectMap: Record<string, Subject> = {};
  subjects.forEach((s) => { subjectMap[s.id] = s; });

  const filteredPapers = selectedSubject === "all"
    ? localPapers
    : localPapers.filter((p) => p.subject_id === selectedSubject);

  const groupedByYear: Record<number, Paper[]> = {};
  filteredPapers.forEach((p) => {
    if (!groupedByYear[p.year]) groupedByYear[p.year] = [];
    groupedByYear[p.year].push(p);
  });

  const analyzedCount = localPapers.filter((p) => p.analysis_json).length;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject || selectedSubject === "all") {
      setUploadError("Select a subject filter before uploading");
      return;
    }
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectId", selectedSubject);
    formData.append("type", "paper");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      window.location.reload();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const analyzeWithAI = async (paperId: string) => {
    setAnalyzingId(paperId);
    try {
      await fetch("/api/ai/predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });
      window.location.reload();
    } catch { /* silent */ }
    finally { setAnalyzingId(null); }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dentora-gradient px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Previous Papers</h1>
            <p className="text-white/75 text-sm mt-0.5">Upload past exams · AI analyzes patterns and predicts likely questions</p>
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading || selectedSubject === "all"}
              className="gap-2 bg-white text-blue-600 hover:bg-white/90 border-0 font-semibold"
              title={selectedSubject === "all" ? "Select a subject filter first" : ""}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload Paper"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {uploadError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">⚠️ {uploadError}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Papers", value: localPapers.length, icon: "📄", color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5" },
            { label: "AI Analyzed", value: analyzedCount, icon: "🤖", color: "text-green-500", bg: "from-green-500/10 to-green-600/5" },
            { label: "Years Covered", value: [...new Set(localPapers.map((p) => p.year))].length, icon: "📅", color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/5" },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className={`stat-card bg-gradient-to-br ${bg} text-center`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filteredPapers.length} paper{filteredPapers.length !== 1 ? "s" : ""}</span>
        </div>

        <Tabs defaultValue="papers">
          <TabsList>
            <TabsTrigger value="papers">Papers</TabsTrigger>
            <TabsTrigger value="trends">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="papers" className="mt-4 space-y-6">
            {filteredPapers.length === 0 ? (
              <div className="stat-card">
                <div className="empty-state">
                  <div className="empty-state-icon">📚</div>
                  <p className="font-semibold text-lg">No papers yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Select a subject filter, then upload previous year question papers. Our AI will analyze them to predict likely questions.
                  </p>
                </div>
              </div>
            ) : (
              Object.entries(groupedByYear)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, yearPapers]) => (
                  <div key={year}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-6 dentora-gradient rounded-md flex items-center justify-center text-xs font-bold text-white">{year}</div>
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">{yearPapers.length} paper{yearPapers.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {yearPapers.map((paper, i) => (
                        <motion.div
                          key={paper.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="hover:shadow-card-hover transition-all duration-200">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-950/20 rounded-xl flex items-center justify-center shrink-0">
                                  <FileText className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{paper.university}</p>
                                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full capitalize font-medium", EXAM_TYPE_COLORS[paper.exam_type] ?? "bg-muted text-muted-foreground")}>
                                      {paper.exam_type}
                                    </span>
                                    {paper.subject_id && subjectMap[paper.subject_id] && (
                                      <Badge variant="outline" className="text-[11px]">{subjectMap[paper.subject_id].code}</Badge>
                                    )}
                                  </div>
                                </div>
                                {paper.analysis_json ? (
                                  <span className="badge-success shrink-0"><TrendingUp className="h-3 w-3" />Analyzed</span>
                                ) : (
                                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1 shrink-0"
                                    onClick={() => analyzeWithAI(paper.id)} disabled={analyzingId === paper.id}>
                                    {analyzingId === paper.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    Analyze
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            {analyzedCount === 0 ? (
              <div className="stat-card">
                <div className="empty-state">
                  <div className="empty-state-icon">🔮</div>
                  <p className="font-semibold">No insights yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Analyze at least one paper to see AI-predicted high-yield topics and question trends.
                  </p>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader><CardTitle className="text-sm">High-Yield Topics (AI Predicted)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">AI analysis insights will appear here after papers are processed.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
