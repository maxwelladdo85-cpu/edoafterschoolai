import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Timer, CheckCircle2, XCircle, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quizzes/$quizId/take")({
  component: QuizRunner,
});

type QType = "mcq" | "true_false" | "short_answer";
interface Choice { id: string; label: string; is_correct: boolean; }
interface Question {
  id: string; type: QType; prompt: string; points: number;
  correct_short_answer: string | null; feedback: string | null;
  choices: Choice[];
}
interface Quiz {
  id: string; title: string; description: string | null;
  time_limit_minutes: number; course_id: string;
}

interface ResultItem {
  question: Question;
  selectedChoiceIds: string[];
  textAnswer: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

function QuizRunner() {
  const { quizId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);

  // answers state: questionId -> { choiceIds[], text }
  const [answers, setAnswers] = useState<Record<string, { choiceIds: string[]; text: string }>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ score: number; max: number; items: ResultItem[] } | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  // Load quiz, questions, choices, prior attempts
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
      if (!q) { setLoading(false); return; }
      setQuiz(q as Quiz);

      const { data: qs } = await supabase.from("questions").select("*").eq("quiz_id", quizId).order("position");
      const ids = (qs ?? []).map((x: any) => x.id);
      const { data: cs } = ids.length
        ? await supabase.from("question_choices").select("*").in("question_id", ids).order("position")
        : { data: [] as any[] };
      const built: Question[] = (qs ?? []).map((row: any) => ({
        id: row.id, type: row.type, prompt: row.prompt, points: row.points,
        correct_short_answer: row.correct_short_answer, feedback: row.feedback,
        choices: (cs ?? []).filter((c: any) => c.question_id === row.id).map((c: any) => ({
          id: c.id, label: c.label, is_correct: c.is_correct,
        })),
      }));
      setQuestions(built);

      // Count prior submitted attempts
      const { data: prior } = await supabase
        .from("quiz_attempts")
        .select("id, attempt_number, submitted_at")
        .eq("quiz_id", quizId).eq("learner_id", user.id);
      const submitted = (prior ?? []).filter((p: any) => p.submitted_at).length;
      const nextNum = submitted + 1;
      setAttemptNumber(nextNum);

      // Create new attempt
      const maxScore = built.reduce((s, qq) => s + qq.points, 0);
      const { data: att, error } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId, learner_id: user.id, attempt_number: nextNum, max_score: maxScore,
      }).select("id, started_at").single();
      if (error) { toast.error(error.message); setLoading(false); return; }
      setAttemptId(att.id);

      const elapsed = Math.floor((Date.now() - new Date(att.started_at).getTime()) / 1000);
      setSecondsLeft(Math.max(0, q.time_limit_minutes * 60 - elapsed));
      setLoading(false);
    })();
    // eslint-disable-next-line
  }, [user, quizId]);

  // Timer
  useEffect(() => {
    if (!attemptId || results) return;
    if (secondsLeft <= 0) { handleSubmit(true); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, attemptId, results]);

  const totalPoints = useMemo(() => questions.reduce((s, q) => s + q.points, 0), [questions]);
  const answeredCount = Object.values(answers).filter((a) => a.choiceIds.length || a.text.trim()).length;

  const setChoice = (qid: string, choiceId: string, multi: boolean) => {
    setAnswers((prev) => {
      const cur = prev[qid] ?? { choiceIds: [], text: "" };
      let next: string[];
      if (multi) next = cur.choiceIds.includes(choiceId) ? cur.choiceIds.filter((x) => x !== choiceId) : [...cur.choiceIds, choiceId];
      else next = [choiceId];
      return { ...prev, [qid]: { ...cur, choiceIds: next } };
    });
  };
  const setText = (qid: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: { ...(prev[qid] ?? { choiceIds: [], text: "" }), text } }));
  };

  const handleSubmit = async (auto = false) => {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    setSubmitting(true);

    let score = 0;
    const items: ResultItem[] = [];
    const rows: any[] = [];

    for (const q of questions) {
      const a = answers[q.id] ?? { choiceIds: [], text: "" };
      let isCorrect = false;
      let pts = 0;
      let selectedChoice: string | null = null;
      let textAns: string | null = null;

      if (q.type === "mcq" || q.type === "true_false") {
        const correctIds = q.choices.filter((c) => c.is_correct).map((c) => c.id).sort();
        const selected = [...a.choiceIds].sort();
        isCorrect = correctIds.length > 0 && selected.length === correctIds.length && selected.every((x, i) => x === correctIds[i]);
        selectedChoice = a.choiceIds[0] ?? null;
      } else {
        // short answer
        textAns = a.text;
        const expected = (q.correct_short_answer ?? "").trim().toLowerCase();
        if (expected) isCorrect = a.text.trim().toLowerCase() === expected;
      }
      if (isCorrect) { pts = q.points; score += pts; }

      items.push({ question: q, selectedChoiceIds: a.choiceIds, textAnswer: a.text, isCorrect, pointsAwarded: pts });
      rows.push({
        attempt_id: attemptId, question_id: q.id,
        selected_choice_id: selectedChoice, text_answer: textAns,
        is_correct: isCorrect, points_awarded: pts,
      });
    }

    if (rows.length) {
      const { error: aErr } = await supabase.from("attempt_answers").insert(rows);
      if (aErr) toast.error(aErr.message);
    }

    const { error: uErr } = await supabase.from("quiz_attempts")
      .update({ submitted_at: new Date().toISOString(), score, max_score: totalPoints })
      .eq("id", attemptId);
    if (uErr) toast.error(uErr.message);

    setSubmitting(false);
    setResults({ score, max: totalPoints, items });
    if (auto) toast.warning("Time's up — quiz submitted automatically");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading quiz…
      </div>
    );
  }


  if (!quiz) {
    return <div className="p-10 text-center">Quiz not found.</div>;
  }

  // RESULTS VIEW
  if (results) {
    const pct = results.max > 0 ? Math.round((results.score / results.max) * 100) : 0;
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Results · {quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold">{results.score}<span className="text-xl text-muted-foreground">/{results.max}</span></div>
                <Badge variant={pct >= 50 ? "default" : "destructive"}>{pct}%</Badge>
              </div>
              <Progress value={pct} />
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline"><Link to="/quizzes/$courseId" params={{ courseId: quiz.course_id }}>Back to quizzes</Link></Button>
                <Button asChild variant="ghost"><Link to="/courses/$courseId" params={{ courseId: quiz.course_id }}>Back to course</Link></Button>
              </div>
            </CardContent>
          </Card>

          {results.items.map((r, i) => (
            <Card key={r.question.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    Q{i + 1}. {r.question.prompt}
                  </CardTitle>
                  {r.isCorrect ? (
                    <Badge className="gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" />+{r.pointsAwarded}</Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />0/{r.question.points}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {r.question.type === "short_answer" ? (
                  <>
                    <div><span className="text-muted-foreground">Your answer:</span> <span className={r.isCorrect ? "text-green-600 font-medium" : "text-destructive font-medium"}>{r.textAnswer || <em>blank</em>}</span></div>
                    {r.question.correct_short_answer && <div><span className="text-muted-foreground">Expected:</span> <span className="font-medium">{r.question.correct_short_answer}</span></div>}
                  </>
                ) : (
                  <ul className="space-y-1">
                    {r.question.choices.map((c) => {
                      const picked = r.selectedChoiceIds.includes(c.id);
                      const cls = c.is_correct ? "text-green-600 font-medium" : picked ? "text-destructive" : "text-muted-foreground";
                      return (
                        <li key={c.id} className={`flex items-center gap-2 ${cls}`}>
                          {c.is_correct ? <CheckCircle2 className="h-4 w-4" /> : picked ? <XCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
                          {c.label} {picked && <span className="text-xs">(your pick)</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {r.question.feedback && (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm"><strong>Feedback:</strong> {r.question.feedback}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // FOCUSED FULL-SCREEN QUIZ VIEW
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const lowTime = secondsLeft <= 30;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold md:text-lg">{quiz.title}</h1>
            <p className="text-xs text-muted-foreground">Attempt {attemptNumber} · {answeredCount}/{questions.length} answered</p>
          </div>
          <div className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-mono font-bold ${lowTime ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"}`}>
            <Timer className="h-4 w-4" />
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        {questions.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">This quiz has no questions yet.</CardContent></Card>
        ) : questions.map((q, i) => {
          const a = answers[q.id] ?? { choiceIds: [], text: "" };
          const correctCount = q.choices.filter((c) => c.is_correct).length;
          const multi = q.type === "mcq" && correctCount > 1;
          return (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">Q{i + 1}. {q.prompt}</CardTitle>
                  <Badge variant="outline">{q.points} pt{q.points > 1 ? "s" : ""}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.type === "short_answer" ? (
                  <Textarea value={a.text} onChange={(e) => setText(q.id, e.target.value)} placeholder="Your answer…" />
                ) : (
                  <div className="space-y-2">
                    {q.choices.map((c) => {
                      const picked = a.choiceIds.includes(c.id);
                      return (
                        <button
                          key={c.id} type="button"
                          onClick={() => setChoice(q.id, c.id, multi)}
                          className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                            picked ? "border-primary bg-primary/10" : "hover:bg-muted"
                          }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${picked ? "border-primary bg-primary text-primary-foreground" : ""}`}>
                            {picked && "✓"}
                          </span>
                          {c.label}
                        </button>
                      );
                    })}
                    {multi && <p className="text-xs text-muted-foreground">Select all that apply.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={() => handleSubmit(false)} disabled={submitting || questions.length === 0}>
            <Send className="mr-2 h-4 w-4" /> {submitting ? "Submitting…" : "Submit quiz"}
          </Button>
        </div>
      </main>
    </div>
  );
}
