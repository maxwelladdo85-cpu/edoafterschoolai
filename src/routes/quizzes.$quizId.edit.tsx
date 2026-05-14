import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quizzes/$quizId/edit")({
  component: QuizEditor,
});

type QType = "mcq" | "true_false" | "short_answer";

interface Choice { id?: string; tempId: string; label: string; is_correct: boolean; }
interface Question {
  id?: string; tempId: string; type: QType; prompt: string; points: number;
  correct_short_answer: string; feedback: string; choices: Choice[];
}

const tid = () => Math.random().toString(36).slice(2);

function QuizEditor() {
  const { quizId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<{ title: string; description: string; time_limit_minutes: number; course_id: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
      if (!q) { setLoading(false); return; }
      setQuiz({ title: q.title, description: q.description ?? "", time_limit_minutes: q.time_limit_minutes, course_id: q.course_id });
      const { data: qs } = await supabase.from("questions").select("*").eq("quiz_id", quizId).order("position");
      const qIds = (qs ?? []).map((x: any) => x.id);
      const { data: cs } = qIds.length
        ? await supabase.from("question_choices").select("*").in("question_id", qIds).order("position")
        : { data: [] as any[] };
      setQuestions((qs ?? []).map((row: any): Question => ({
        id: row.id, tempId: tid(), type: row.type, prompt: row.prompt, points: row.points,
        correct_short_answer: row.correct_short_answer ?? "", feedback: row.feedback ?? "",
        choices: (cs ?? []).filter((c: any) => c.question_id === row.id).map((c: any) => ({
          id: c.id, tempId: tid(), label: c.label, is_correct: c.is_correct,
        })),
      })));
      setLoading(false);
    })();
  }, [quizId]);

  const addQuestion = (type: QType) => {
    const base: Question = { tempId: tid(), type, prompt: "", points: 1, correct_short_answer: "", feedback: "", choices: [] };
    if (type === "mcq") base.choices = [
      { tempId: tid(), label: "", is_correct: true },
      { tempId: tid(), label: "", is_correct: false },
    ];
    if (type === "true_false") base.choices = [
      { tempId: tid(), label: "True", is_correct: true },
      { tempId: tid(), label: "False", is_correct: false },
    ];
    setQuestions((qs) => [...qs, base]);
  };

  const updateQ = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const removeQ = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const updateC = (qi: number, ci: number, patch: Partial<Choice>) =>
    setQuestions((qs) => qs.map((q, idx) => idx !== qi ? q : {
      ...q, choices: q.choices.map((c, j) => j === ci ? { ...c, ...patch } : c),
    }));
  const addChoice = (qi: number) => updateQ(qi, { choices: [...questions[qi].choices, { tempId: tid(), label: "", is_correct: false }] });
  const removeChoice = (qi: number, ci: number) =>
    setQuestions((qs) => qs.map((q, idx) => idx !== qi ? q : { ...q, choices: q.choices.filter((_, j) => j !== ci) }));

  const save = async () => {
    if (!quiz) return;
    setSaving(true);
    try {
      const { error: qErr } = await supabase.from("quizzes").update({
        title: quiz.title, description: quiz.description || null, time_limit_minutes: quiz.time_limit_minutes,
      }).eq("id", quizId);
      if (qErr) throw qErr;

      // Replace questions: simple approach — delete existing then re-insert
      const { error: delErr } = await supabase.from("questions").delete().eq("quiz_id", quizId);
      if (delErr) throw delErr;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.prompt.trim()) continue;
        const { data: ins, error: insErr } = await supabase.from("questions").insert({
          quiz_id: quizId, type: q.type, prompt: q.prompt, points: q.points, position: i,
          correct_short_answer: q.type === "short_answer" ? (q.correct_short_answer || null) : null,
          feedback: q.feedback || null,
        }).select("id").single();
        if (insErr) throw insErr;
        if (q.choices.length) {
          const rows = q.choices.map((c, j) => ({
            question_id: ins.id, label: c.label, is_correct: c.is_correct, position: j,
          }));
          const { error: cErr } = await supabase.from("question_choices").insert(rows);
          if (cErr) throw cErr;
        }
      }
      toast.success("Quiz saved");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardShell title="Quiz editor"><div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div></DashboardShell>;
  if (!quiz) return <DashboardShell title="Quiz"><Card><CardContent className="py-16 text-center">Quiz not found.</CardContent></Card></DashboardShell>;

  return (
    <DashboardShell title="Quiz editor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit quiz</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/quizzes/$courseId" params={{ courseId: quiz.course_id }}>Back</Link></Button>
            <Button onClick={save} disabled={saving}><Save className="mr-1 h-4 w-4" />{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Quiz details</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_140px]">
            <div><Label>Title</Label><Input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} /></div>
            <div><Label>Time limit (min)</Label><Input type="number" min={1} value={quiz.time_limit_minutes} onChange={(e) => setQuiz({ ...quiz, time_limit_minutes: parseInt(e.target.value || "10", 10) })} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea value={quiz.description} onChange={(e) => setQuiz({ ...quiz, description: e.target.value })} /></div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q, qi) => (
            <Card key={q.tempId}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Question {qi + 1} · <span className="text-xs uppercase text-muted-foreground">{q.type.replace("_", " ")}</span></CardTitle>
                  <Button size="icon" variant="ghost" onClick={() => removeQ(qi)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Prompt</Label><Textarea value={q.prompt} onChange={(e) => updateQ(qi, { prompt: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Points</Label><Input type="number" min={1} value={q.points} onChange={(e) => updateQ(qi, { points: parseInt(e.target.value || "1", 10) })} /></div>
                  <div><Label>Feedback (shown after grading)</Label><Input value={q.feedback} onChange={(e) => updateQ(qi, { feedback: e.target.value })} /></div>
                </div>

                {q.type === "short_answer" && (
                  <div>
                    <Label>Correct answer (case-insensitive match)</Label>
                    <Input value={q.correct_short_answer} onChange={(e) => updateQ(qi, { correct_short_answer: e.target.value })} />
                  </div>
                )}

                {(q.type === "mcq" || q.type === "true_false") && (
                  <div className="space-y-2">
                    <Label>Choices (check the correct one{q.type === "mcq" ? "s" : ""})</Label>
                    {q.choices.map((c, ci) => (
                      <div key={c.tempId} className="flex items-center gap-2">
                        <Checkbox checked={c.is_correct} onCheckedChange={(v) => {
                          if (q.type === "true_false") {
                            // single-correct: uncheck others
                            setQuestions((qs) => qs.map((qq, idx) => idx !== qi ? qq : {
                              ...qq, choices: qq.choices.map((cc, j) => ({ ...cc, is_correct: j === ci ? !!v : false })),
                            }));
                          } else {
                            updateC(qi, ci, { is_correct: !!v });
                          }
                        }} />
                        <Input value={c.label} disabled={q.type === "true_false"} onChange={(e) => updateC(qi, ci, { label: e.target.value })} placeholder={`Choice ${ci + 1}`} />
                        {q.type === "mcq" && (
                          <Button size="icon" variant="ghost" onClick={() => removeChoice(qi, ci)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    ))}
                    {q.type === "mcq" && <Button size="sm" variant="outline" onClick={() => addChoice(qi)}><Plus className="mr-1 h-4 w-4" />Add choice</Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-wrap gap-2 py-4">
            <Button variant="outline" onClick={() => addQuestion("mcq")}><Plus className="mr-1 h-4 w-4" />Multiple choice</Button>
            <Button variant="outline" onClick={() => addQuestion("true_false")}><Plus className="mr-1 h-4 w-4" />True / False</Button>
            <Button variant="outline" onClick={() => addQuestion("short_answer")}><Plus className="mr-1 h-4 w-4" />Short answer</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
