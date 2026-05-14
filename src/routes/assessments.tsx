import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { PageHero } from "@/components/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Timer, ClipboardCheck, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assessments")({
  component: AssessmentsPage,
});

interface Course { id: string; title: string; }
interface Quiz {
  id: string; title: string; description: string | null;
  time_limit_minutes: number; course_id: string;
  questionCount: number;
}

function AssessmentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [form, setForm] = useState({ course_id: "", title: "", description: "", time_limit_minutes: 10 });

  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  const isTeacher = role === "teacher" || role === "admin";

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const courseQuery = supabase.from("courses").select("id, title").order("created_at", { ascending: false });
    const { data: cs } = role === "admin" ? await courseQuery : await courseQuery.eq("teacher_id", user.id);
    const courseList = (cs as Course[]) ?? [];
    setCourses(courseList);

    if (courseList.length === 0) { setQuizzes([]); setLoading(false); return; }
    const ids = courseList.map((c) => c.id);
    const { data: qs } = await supabase
      .from("quizzes")
      .select("id, title, description, time_limit_minutes, course_id")
      .in("course_id", ids)
      .order("created_at", { ascending: false });
    const quizList = (qs as any[]) ?? [];

    let countMap: Record<string, number> = {};
    if (quizList.length) {
      const { data: questions } = await supabase
        .from("questions")
        .select("quiz_id")
        .in("quiz_id", quizList.map((q) => q.id));
      (questions ?? []).forEach((row: any) => {
        countMap[row.quiz_id] = (countMap[row.quiz_id] ?? 0) + 1;
      });
    }
    setQuizzes(quizList.map((q) => ({ ...q, questionCount: countMap[q.id] ?? 0 })));
    if (!form.course_id && courseList.length) setForm((f) => ({ ...f, course_id: courseList[0].id }));
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user, role]);

  const create = async () => {
    if (!form.course_id) { toast.error("Select a course"); return; }
    if (!form.title.trim()) { toast.error("Title required"); return; }
    if (!form.time_limit_minutes || form.time_limit_minutes < 1) { toast.error("Time limit must be at least 1 minute"); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        course_id: form.course_id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        time_limit_minutes: form.time_limit_minutes,
      })
      .select("id").single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Assessment created — add your questions");
    nav({ to: "/quizzes/$quizId/edit", params: { quizId: data.id } });
  };

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? "";

  if (loading) {
    return (
      <DashboardShell title="Assessments">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Assessments">
      <div className="space-y-6">
        <PageHero
          eyebrow="Quizzes & evaluations"
          EyebrowIcon={ClipboardCheck}
          title="Assessments"
          description={isTeacher
            ? "Create quizzes attached to your courses with multiple choice, true/false, and short answer questions."
            : "Browse and take assessments from your enrolled courses."}
        />

        {isTeacher && (
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Create new assessment</CardTitle></CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You don't have any courses yet. <Link to="/my-courses" className="text-primary underline">Create a course</Link> first.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_140px_auto]">
                  <div>
                    <Label>Course</Label>
                    <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Midterm quiz" maxLength={120} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" maxLength={300} />
                  </div>
                  <div>
                    <Label>Time limit (min)</Label>
                    <Input type="number" min={1} max={600} value={form.time_limit_minutes}
                      onChange={(e) => setForm({ ...form, time_limit_minutes: parseInt(e.target.value || "10", 10) })} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={create} disabled={creating} className="w-full">
                      <Plus className="mr-1 h-4 w-4" />Create
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {quizzes.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="py-16 text-center text-muted-foreground">
              No assessments yet{isTeacher ? " — create your first one above" : ""}.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {quizzes.map((q) => (
              <Card key={q.id} className="border-border/60 transition hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{q.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{courseTitle(q.course_id)}</p>
                    </div>
                    <Badge variant="secondary"><Timer className="mr-1 h-3 w-3" />{q.time_limit_minutes}m</Badge>
                  </div>
                  {q.description && <p className="text-sm text-muted-foreground">{q.description}</p>}
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {q.questionCount} question{q.questionCount === 1 ? "" : "s"}
                  </div>
                  <div className="flex gap-2">
                    {isTeacher && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/quizzes/$quizId/edit" params={{ quizId: q.id }}>
                          <Pencil className="mr-1 h-4 w-4" />Edit
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/quizzes/$courseId" params={{ courseId: q.course_id }}>
                        <PlayCircle className="mr-1 h-4 w-4" />Open
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
