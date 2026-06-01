import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

type LessonPayload = {
  mode: "lesson";
  defaultTitle: string;
  content: string;
};
type QuizPayload = {
  mode: "quiz";
  defaultTitle: string;
  questions: QuizQuestion[];
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: LessonPayload | QuizPayload | null;
}

interface CourseRow { id: string; title: string }
interface ModuleRow { id: string; title: string; position: number }

const NEW_MODULE = "__new__";

export function SendToCourseDialog({ open, onOpenChange, payload }: Props) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [moduleId, setModuleId] = useState<string>(NEW_MODULE);
  const [newModuleTitle, setNewModuleTitle] = useState("Module 1");
  const [title, setTitle] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLesson = payload?.mode === "lesson";

  // Reset/seed when reopened
  useEffect(() => {
    if (!open || !payload) return;
    setTitle(payload.defaultTitle.slice(0, 120));
    setModuleId(NEW_MODULE);
    setNewModuleTitle("Module 1");
  }, [open, payload]);

  // Load teacher's courses
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      setLoadingCourses(true);
      const { data } = await supabase
        .from("courses")
        .select("id,title")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      const rows = data ?? [];
      setCourses(rows);
      if (rows.length && !courseId) setCourseId(rows[0].id);
      setLoadingCourses(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  // Load modules for lesson mode
  useEffect(() => {
    if (!isLesson || !courseId) { setModules([]); return; }
    (async () => {
      const { data } = await supabase
        .from("modules")
        .select("id,title,position")
        .eq("course_id", courseId)
        .order("position");
      setModules(data ?? []);
    })();
  }, [isLesson, courseId]);

  const canSubmit = useMemo(() => {
    if (!payload || !courseId || !title.trim() || saving) return false;
    if (isLesson && moduleId === NEW_MODULE && !newModuleTitle.trim()) return false;
    return true;
  }, [payload, courseId, title, saving, isLesson, moduleId, newModuleTitle]);

  const handleSubmit = async () => {
    if (!payload || !user) return;
    setSaving(true);
    try {
      if (payload.mode === "lesson") {
        // Resolve module
        let targetModuleId = moduleId;
        if (moduleId === NEW_MODULE) {
          const nextPos = modules.length;
          const { data: m, error: me } = await supabase
            .from("modules")
            .insert({ course_id: courseId, title: newModuleTitle.trim(), position: nextPos })
            .select("id")
            .single();
          if (me || !m) throw new Error(me?.message || "Could not create module");
          targetModuleId = m.id;
        }
        // Next lesson position
        const { count } = await supabase
          .from("lessons")
          .select("id", { count: "exact", head: true })
          .eq("module_id", targetModuleId);
        const { error: le } = await supabase.from("lessons").insert({
          module_id: targetModuleId,
          title: title.trim(),
          content_type: "text",
          content_text: payload.content,
          position: count ?? 0,
        });
        if (le) throw new Error(le.message);
        toast.success("Added to Course Builder");
        onOpenChange(false);
        nav({ to: "/courses/builder/edit", search: { id: courseId } });
      } else {
        // Create quiz
        const { data: quiz, error: qe } = await supabase
          .from("quizzes")
          .insert({ course_id: courseId, title: title.trim(), time_limit_minutes: 10 })
          .select("id")
          .single();
        if (qe || !quiz) throw new Error(qe?.message || "Could not create quiz");

        // Insert questions sequentially so we can attach choices
        for (let i = 0; i < payload.questions.length; i++) {
          const q = payload.questions[i];
          const { data: qrow, error: qre } = await supabase
            .from("questions")
            .insert({
              quiz_id: quiz.id,
              type: "mcq",
              prompt: q.question,
              points: 1,
              position: i,
              feedback: q.explanation ?? null,
            })
            .select("id")
            .single();
          if (qre || !qrow) throw new Error(qre?.message || "Failed to save question");
          const answerLetter = (q.answer || "").trim().toUpperCase().charAt(0);
          const rows = q.options.map((opt, j) => ({
            question_id: qrow.id,
            label: opt,
            position: j,
            is_correct: String.fromCharCode(65 + j) === answerLetter,
          }));
          if (rows.length) {
            const { error: ce } = await supabase.from("question_choices").insert(rows);
            if (ce) throw new Error(ce.message);
          }
        }
        toast.success("Assessment created");
        onOpenChange(false);
        nav({ to: "/quizzes/$quizId/edit", params: { quizId: quiz.id } });
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isLesson ? "Add to Course Builder" : "Create Assessment"}</DialogTitle>
          <DialogDescription>
            {isLesson
              ? "Save this generated content as a lesson inside one of your courses."
              : "Save these generated questions as a quiz under one of your courses."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Course</Label>
            {loadingCourses ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your courses…
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no courses yet. Create one in the Course Builder first.
              </p>
            ) : (
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Pick a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isLesson && courseId && (
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={moduleId} onValueChange={setModuleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                  <SelectItem value={NEW_MODULE}>+ Create new module</SelectItem>
                </SelectContent>
              </Select>
              {moduleId === NEW_MODULE && (
                <Input
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="New module title"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{isLesson ? "Lesson title" : "Quiz title"}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLesson ? "Save lesson" : "Create assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
