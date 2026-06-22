import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { VARK_QUESTIONS, scoreAnswers, STYLE_LABELS, STYLE_TIPS, type VarkStyle } from "@/lib/vark";

export const Route = createFileRoute("/vark-quiz")({
  head: () => ({
    meta: [
      { title: "VARK Learning Style Quiz — Edo SUBEB" },
      { name: "description", content: "Discover how you learn best with this 8-question VARK quiz." },
    ],
  }),
  component: VarkQuizPage,
});

function VarkQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [answers, setAnswers] = useState<(VarkStyle | null)[]>(Array(VARK_QUESTIONS.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ scores: Record<VarkStyle, number>; dominant: VarkStyle } | null>(null);

  const answered = answers.filter(Boolean).length;
  const allAnswered = answered === VARK_QUESTIONS.length;

  const submit = async () => {
    if (!user || !allAnswered) return;
    setSubmitting(true);
    const final = answers as VarkStyle[];
    const { scores, dominant } = scoreAnswers(final);
    const { error } = await supabase.from("vark_results").insert({
      learner_id: user.id,
      visual: scores.visual,
      aural: scores.aural,
      read_write: scores.read_write,
      kinesthetic: scores.kinesthetic,
      dominant,
      answers: final,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setResult({ scores, dominant });
    toast.success("Great work! Your learning style is ready.");
  };

  const reset = () => {
    setAnswers(Array(VARK_QUESTIONS.length).fill(null));
    setResult(null);
  };

  if (result) {
    return (
      <DashboardShell title="VARK Quiz Result">
        <div className="mx-auto max-w-3xl space-y-6">
          <Button variant="ghost" onClick={() => router.navigate({ to: "/dashboard" })} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Button>
          <Card>
            <CardHeader>
              <Badge className="w-fit gap-1"><Sparkles className="h-3 w-3" /> Your VARK result</Badge>
              <CardTitle className="text-3xl">You learn best as a <span className="text-primary">{STYLE_LABELS[result.dominant]}</span> learner</CardTitle>
              <CardDescription>Here's a breakdown of how you scored across the four learning styles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(STYLE_LABELS) as VarkStyle[]).map((s) => {
                const pct = Math.round((result.scores[s] / VARK_QUESTIONS.length) * 100);
                return (
                  <div key={s} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{STYLE_LABELS[s]}</span>
                      <span className="text-muted-foreground">{result.scores[s]} / {VARK_QUESTIONS.length}</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How you learn best</CardTitle>
              <CardDescription>Try these study tips that match your dominant style.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {STYLE_TIPS[result.dominant].map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" className="gap-2"><RotateCw className="h-4 w-4" /> Retake quiz</Button>
            <Button asChild><Link to="/dashboard">Done</Link></Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="VARK Quiz">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Badge className="mb-2 gap-1"><Sparkles className="h-3 w-3" /> 8 questions · ~3 minutes</Badge>
          <h1 className="text-3xl font-bold">VARK Learning Style Quiz</h1>
          <p className="text-muted-foreground">Pick the option that feels most like you. There are no wrong answers.</p>
        </div>

        <div className="sticky top-0 z-10 -mx-4 bg-background/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="text-muted-foreground">{answered} / {VARK_QUESTIONS.length}</span>
          </div>
          <Progress className="mt-1" value={(answered / VARK_QUESTIONS.length) * 100} />
        </div>

        <div className="space-y-4">
          {VARK_QUESTIONS.map((q, qi) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">{qi + 1}. {q.prompt}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === opt.style;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswers((a) => { const c = [...a]; c[qi] = opt.style; return c; })}
                      className={`rounded-md border p-3 text-left text-sm transition ${selected ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "hover:bg-muted/50"}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" disabled={!allAnswered || submitting} onClick={submit}>
            {submitting ? "Saving…" : allAnswered ? "See my result" : `Answer all ${VARK_QUESTIONS.length} questions`}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
