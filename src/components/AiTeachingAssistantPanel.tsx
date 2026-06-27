import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, ListChecks, CalendarRange, FileText, GraduationCap, Copy, Upload, BookPlus, ClipboardList, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ACCEPTED_DOC_TYPES, extractDocumentText } from "@/lib/extract-document-text";
import { SendToCourseDialog } from "@/components/SendToCourseDialog";

type TeacherCourse = { id: string; title: string };

function useTeacherCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      setCourses((data ?? []) as TeacherCourse[]);
    })();
  }, [user]);
  return courses;
}

async function fetchCourseContent(courseId: string): Promise<string> {
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, position")
    .eq("course_id", courseId)
    .order("position", { ascending: true });
  if (!modules || modules.length === 0) return "";
  const modIds = modules.map((m: any) => m.id);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("module_id, title, content_text, position")
    .in("module_id", modIds)
    .order("position", { ascending: true });
  const parts: string[] = [];
  for (const m of modules as any[]) {
    parts.push(`# ${m.title}`);
    const mls = (lessons ?? []).filter((l: any) => l.module_id === m.id);
    for (const l of mls) {
      parts.push(`## ${l.title}`);
      if (l.content_text) parts.push(l.content_text);
    }
  }
  return parts.join("\n\n");
}

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

async function callTeacherAi(payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");
  const res = await fetch("/api/teacher-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Failed (${res.status})`);
  }
  return res.json();
}

function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
    >
      <Copy className="mr-2 h-3.5 w-3.5" /> Copy
    </Button>
  );
}

function UploadDocButton({ onText, disabled }: { onText: (text: string) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await extractDocumentText(file);
      if (!text.trim()) {
        toast.error("Couldn't extract any text from that file.");
        return;
      }
      onText(text);
      toast.success(`Loaded ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to read file");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_DOC_TYPES}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
        Upload document
      </Button>
    </>
  );
}

function QuizGenerator() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

  const generate = async () => {
    if (text.trim().length < 50) {
      toast.error("Paste at least a paragraph of lesson text.");
      return;
    }
    setLoading(true);
    setQuestions(null);
    try {
      const res = await callTeacherAi({ tool: "quiz", text });
      const qs = res?.data?.questions;
      if (Array.isArray(qs)) setQuestions(qs);
      else throw new Error("AI returned invalid format");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Lesson text</Label>
          <UploadDocButton disabled={loading} onText={(t) => setText((prev) => (prev ? prev + "\n\n" + t : t))} />
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste the lesson content here, or upload a PDF, DOCX or TXT file…"
        />
        <p className="text-xs text-muted-foreground">Supported uploads: PDF, DOCX, TXT (max 15 MB).</p>
      </div>
      <Button onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
        Generate 10 MCQs
      </Button>

      {questions && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{questions.length} questions generated</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={JSON.stringify(questions, null, 2)} />
              <Button size="sm" onClick={() => setSendOpen(true)}>
                <ClipboardList className="mr-2 h-3.5 w-3.5" /> Create Assessment
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="space-y-2 p-4">
                  <p className="font-medium">{i + 1}. {q.question}</p>
                  <ul className="space-y-1 text-sm">
                    {q.options.map((o, j) => {
                      const letter = String.fromCharCode(65 + j);
                      const correct = q.answer?.toString().toUpperCase().startsWith(letter);
                      return (
                        <li key={j} className={correct ? "font-semibold text-primary" : ""}>
                          {letter}. {o}{correct ? "  ✓" : ""}
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium">Why:</span> {q.explanation}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      <SendToCourseDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        payload={
          questions
            ? { mode: "quiz", defaultTitle: "AI-generated quiz", questions }
            : null
        }
      />
    </div>
  );
}

function MarkdownResult({ content, saveTitle }: { content: string; saveTitle?: string }) {
  const [sendOpen, setSendOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <CopyButton text={content} />
        {saveTitle && (
          <Button size="sm" onClick={() => setSendOpen(true)}>
            <BookPlus className="mr-2 h-3.5 w-3.5" /> Add to Course Builder
          </Button>
        )}
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
      {saveTitle && (
        <SendToCourseDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          payload={{ mode: "lesson", defaultTitle: saveTitle, content }}
        />
      )}
    </div>
  );
}

function LessonPlanner() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("45");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const generate = async () => {
    if (!topic.trim()) { toast.error("Enter a topic."); return; }
    setLoading(true);
    setContent(null);
    try {
      const res = await callTeacherAi({ tool: "lesson_plan", topic, duration });
      setContent(res.content || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate plan");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2">
          <Label>Topic</Label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis for JSS2" />
        </div>
        <div className="space-y-2">
          <Label>Duration (min)</Label>
          <Input type="number" min={10} max={240} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      <Button onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarRange className="mr-2 h-4 w-4" />}
        Generate Lesson Plan
      </Button>
      {content && <MarkdownResult content={content} saveTitle={topic ? `Lesson plan: ${topic}` : "AI lesson plan"} />}
    </div>
  );
}

function ContentSummariser() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const generate = async () => {
    if (text.trim().length < 100) { toast.error("Paste a longer document."); return; }
    setLoading(true);
    setContent(null);
    try {
      const res = await callTeacherAi({ tool: "summary", text });
      setContent(res.content || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to summarise");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Document</Label>
          <UploadDocButton disabled={loading} onText={(t) => setText((prev) => (prev ? prev + "\n\n" + t : t))} />
        </div>
        <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the document text, or upload a PDF, DOCX or TXT file…" />
        <p className="text-xs text-muted-foreground">Supported uploads: PDF, DOCX, TXT (max 15 MB).</p>
      </div>
      <Button onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        Summarise for Students
      </Button>
      {content && <MarkdownResult content={content} saveTitle="AI student summary" />}
    </div>
  );
}

function GradingAssist() {
  const [criteria, setCriteria] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const generate = async () => {
    if (!criteria.trim() || !answer.trim()) { toast.error("Provide both criteria and the student's answer."); return; }
    setLoading(true);
    setContent(null);
    try {
      const res = await callTeacherAi({ tool: "grading", criteria, answer });
      setContent(res.content || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to grade");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Marking criteria</Label>
          <Textarea rows={6} value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="e.g. Out of 10. Award marks for clear thesis, evidence, structure, grammar…" />
        </div>
        <div className="space-y-2">
          <Label>Student answer</Label>
          <Textarea rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Paste the student's essay answer…" />
        </div>
      </div>
      <Button onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
        Suggest mark & feedback
      </Button>
      {content && <MarkdownResult content={content} />}
    </div>
  );
}

export function AiTeachingAssistantPanel() {
  return (
    <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          AI Teaching Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Four AI-powered helpers to speed up planning, assessment and grading.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quiz" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="quiz"><ListChecks className="mr-2 h-4 w-4" />Quiz</TabsTrigger>
            <TabsTrigger value="plan"><CalendarRange className="mr-2 h-4 w-4" />Lesson Plan</TabsTrigger>
            <TabsTrigger value="summary"><FileText className="mr-2 h-4 w-4" />Summariser</TabsTrigger>
            <TabsTrigger value="grading"><GraduationCap className="mr-2 h-4 w-4" />Grading</TabsTrigger>
          </TabsList>
          <TabsContent value="quiz" className="mt-4"><QuizGenerator /></TabsContent>
          <TabsContent value="plan" className="mt-4"><LessonPlanner /></TabsContent>
          <TabsContent value="summary" className="mt-4"><ContentSummariser /></TabsContent>
          <TabsContent value="grading" className="mt-4"><GradingAssist /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
