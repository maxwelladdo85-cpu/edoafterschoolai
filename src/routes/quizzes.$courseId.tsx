import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, PlayCircle, Timer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quizzes/$courseId")({
  component: QuizzesPage,
});

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
}

function QuizzesPage() {
  const { courseId } = Route.useParams();
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [course, setCourse] = useState<{ id: string; title: string; teacher_id: string } | null>(null);
  const [attempts, setAttempts] = useState<Record<string, { count: number; best: number; max: number }>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", time_limit_minutes: 10 });

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  const isTeacher = !!course && !!user && (course.teacher_id === user.id || role === "admin");

  const load = async () => {
    setLoading(true);
    const { data: c } = await supabase.from("courses").select("id, title, teacher_id").eq("id", courseId).maybeSingle();
    setCourse(c as any);
    const { data: qs } = await supabase
      .from("quizzes")
      .select("id, title, description, time_limit_minutes")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });
    setQuizzes((qs as Quiz[]) ?? []);

    if (user && qs && qs.length) {
      const ids = qs.map((q: any) => q.id);
      const { data: at } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, score, max_score, submitted_at")
        .in("quiz_id", ids)
        .eq("learner_id", user.id);
      const map: Record<string, { count: number; best: number; max: number }> = {};
      (at ?? []).forEach((a: any) => {
        const key = a.quiz_id;
        if (!map[key]) map[key] = { count: 0, best: 0, max: a.max_score || 0 };
        if (a.submitted_at) {
          map[key].count += 1;
          map[key].best = Math.max(map[key].best, a.score || 0);
          map[key].max = Math.max(map[key].max, a.max_score || 0);
        }
      });
      setAttempts(map);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user, courseId]);

  const create = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("quizzes")
      .insert({ course_id: courseId, title: form.title, description: form.description || null, time_limit_minutes: form.time_limit_minutes })
      .select("id").single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Quiz created");
    nav({ to: "/quizzes/$quizId/edit", params: { quizId: data.id } });
  };

  if (loading) {
    return <DashboardShell title="Quizzes"><div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div></DashboardShell>;
  }

  return (
    <DashboardShell title={course ? `Quizzes · ${course.title}` : "Quizzes"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Assessments</h1>
            <p className="text-sm text-muted-foreground">{course?.title}</p>
          </div>
          <Button asChild variant="outline"><Link to="/courses/$courseId" params={{ courseId }}>Back to course</Link></Button>
        </div>

        {isTeacher && (
          <Card>
            <CardHeader><CardTitle className="text-base">Create new quiz</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Midterm quiz" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" /></div>
              <div><Label>Time limit (min)</Label><Input type="number" min={1} value={form.time_limit_minutes} onChange={(e) => setForm({ ...form, time_limit_minutes: parseInt(e.target.value || "10", 10) })} /></div>
              <div className="flex items-end"><Button onClick={create} disabled={creating} className="w-full"><Plus className="mr-1 h-4 w-4" />Create</Button></div>
            </CardContent>
          </Card>
        )}

        {quizzes.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No quizzes yet for this course.</CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {quizzes.map((q) => {
              const a = attempts[q.id];
              const remaining = 3 - (a?.count ?? 0);
              return (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{q.title}</CardTitle>
                      <Badge variant="secondary"><Timer className="mr-1 h-3 w-3" />{q.time_limit_minutes}m</Badge>
                    </div>
                    {q.description && <p className="text-sm text-muted-foreground">{q.description}</p>}
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2">
                    {role === "learner" || (!isTeacher) ? (
                      <>
                        <div className="text-xs text-muted-foreground">
                          {a?.count ? <>Best: <strong>{a.best}/{a.max}</strong> · {remaining} attempt{remaining === 1 ? "" : "s"} left</> : "Not attempted"}
                        </div>
                        <Button size="sm" disabled={remaining <= 0} asChild={remaining > 0} onClick={remaining <= 0 ? undefined : undefined}>
                          {remaining > 0 ? (
                            <Link to="/quizzes/$quizId/take" params={{ quizId: q.id }}><PlayCircle className="mr-1 h-4 w-4" />{a?.count ? "Retake" : "Start"}</Link>
                          ) : <span>No attempts left</span>}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" asChild><Link to="/quizzes/$quizId/edit" params={{ quizId: q.id }}><Pencil className="mr-1 h-4 w-4" />Edit</Link></Button>
                        <Button size="sm" variant="ghost" asChild><Link to="/quizzes/$quizId/take" params={{ quizId: q.id }}>Preview</Link></Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
