import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { d as Route, u as useAuth, h as useNavigate, t as toast, L as Link } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { T as Textarea } from "./textarea-BvkbP7fP.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { P as Progress } from "./progress-B3TAVT7s.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { C as CircleCheck } from "./circle-check-CLUGLzcT.js";
import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
import { T as Timer } from "./timer-Bc8vhSuJ.js";
import { S as Send } from "./send-DUaj7YoT.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
];
const CircleX = createLucideIcon("circle-x", __iconNode);
function QuizRunner() {
  const {
    quizId
  } = Route.useParams();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [quiz, setQuiz] = reactExports.useState(null);
  const [questions, setQuestions] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [attemptId, setAttemptId] = reactExports.useState(null);
  const [attemptNumber, setAttemptNumber] = reactExports.useState(1);
  const [answers, setAnswers] = reactExports.useState({});
  const [secondsLeft, setSecondsLeft] = reactExports.useState(0);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [results, setResults] = reactExports.useState(null);
  const submittedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
  }, [authLoading, user, nav]);
  reactExports.useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const {
        data: q
      } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
      if (!q) {
        setLoading(false);
        return;
      }
      setQuiz(q);
      const {
        data: qs
      } = await supabase.from("questions").select("*").eq("quiz_id", quizId).order("position");
      const ids = (qs ?? []).map((x) => x.id);
      const {
        data: cs
      } = ids.length ? await supabase.from("question_choices").select("*").in("question_id", ids).order("position") : {
        data: []
      };
      const built = (qs ?? []).map((row) => ({
        id: row.id,
        type: row.type,
        prompt: row.prompt,
        points: row.points,
        correct_short_answer: row.correct_short_answer,
        feedback: row.feedback,
        choices: (cs ?? []).filter((c) => c.question_id === row.id).map((c) => ({
          id: c.id,
          label: c.label,
          is_correct: c.is_correct
        }))
      }));
      setQuestions(built);
      const {
        data: prior
      } = await supabase.from("quiz_attempts").select("id, attempt_number, submitted_at").eq("quiz_id", quizId).eq("learner_id", user.id);
      const submitted = (prior ?? []).filter((p) => p.submitted_at).length;
      const nextNum = submitted + 1;
      setAttemptNumber(nextNum);
      const maxScore = built.reduce((s, qq) => s + qq.points, 0);
      const {
        data: att,
        error
      } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        learner_id: user.id,
        attempt_number: nextNum,
        max_score: maxScore
      }).select("id, started_at").single();
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      setAttemptId(att.id);
      const elapsed = Math.floor((Date.now() - new Date(att.started_at).getTime()) / 1e3);
      setSecondsLeft(Math.max(0, q.time_limit_minutes * 60 - elapsed));
      setLoading(false);
    })();
  }, [user, quizId]);
  reactExports.useEffect(() => {
    if (!attemptId || results) return;
    if (secondsLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1e3);
    return () => clearTimeout(t);
  }, [secondsLeft, attemptId, results]);
  const totalPoints = reactExports.useMemo(() => questions.reduce((s, q) => s + q.points, 0), [questions]);
  const answeredCount = Object.values(answers).filter((a) => a.choiceIds.length || a.text.trim()).length;
  const setChoice = (qid, choiceId, multi) => {
    setAnswers((prev) => {
      const cur = prev[qid] ?? {
        choiceIds: [],
        text: ""
      };
      let next;
      if (multi) next = cur.choiceIds.includes(choiceId) ? cur.choiceIds.filter((x) => x !== choiceId) : [...cur.choiceIds, choiceId];
      else next = [choiceId];
      return {
        ...prev,
        [qid]: {
          ...cur,
          choiceIds: next
        }
      };
    });
  };
  const setText = (qid, text) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: {
        ...prev[qid] ?? {
          choiceIds: [],
          text: ""
        },
        text
      }
    }));
  };
  const handleSubmit = async (auto = false) => {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    setSubmitting(true);
    let score = 0;
    const items = [];
    const rows = [];
    for (const q of questions) {
      const a = answers[q.id] ?? {
        choiceIds: [],
        text: ""
      };
      let isCorrect = false;
      let pts = 0;
      let selectedChoice = null;
      let textAns = null;
      if (q.type === "mcq" || q.type === "true_false") {
        const correctIds = q.choices.filter((c) => c.is_correct).map((c) => c.id).sort();
        const selected = [...a.choiceIds].sort();
        isCorrect = correctIds.length > 0 && selected.length === correctIds.length && selected.every((x, i) => x === correctIds[i]);
        selectedChoice = a.choiceIds[0] ?? null;
      } else {
        textAns = a.text;
        const expected = (q.correct_short_answer ?? "").trim().toLowerCase();
        if (expected) isCorrect = a.text.trim().toLowerCase() === expected;
      }
      if (isCorrect) {
        pts = q.points;
        score += pts;
      }
      items.push({
        question: q,
        selectedChoiceIds: a.choiceIds,
        textAnswer: a.text,
        isCorrect,
        pointsAwarded: pts
      });
      rows.push({
        attempt_id: attemptId,
        question_id: q.id,
        selected_choice_id: selectedChoice,
        text_answer: textAns,
        is_correct: isCorrect,
        points_awarded: pts
      });
    }
    if (rows.length) {
      const {
        error: aErr
      } = await supabase.from("attempt_answers").insert(rows);
      if (aErr) toast.error(aErr.message);
    }
    const {
      error: uErr
    } = await supabase.from("quiz_attempts").update({
      submitted_at: (/* @__PURE__ */ new Date()).toISOString(),
      score,
      max_score: totalPoints
    }).eq("id", attemptId);
    if (uErr) toast.error(uErr.message);
    setSubmitting(false);
    setResults({
      score,
      max: totalPoints,
      items
    });
    if (auto) toast.warning("Time's up — quiz submitted automatically");
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen items-center justify-center bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin" }),
      " Loading quiz…"
    ] });
  }
  if (!quiz) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center", children: "Quiz not found." });
  }
  if (results) {
    const pct = results.max > 0 ? Math.round(results.score / results.max * 100) : 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background p-4 md:p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-2xl", children: [
          "Results · ",
          quiz.title
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-4xl font-bold", children: [
              results.score,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xl text-muted-foreground", children: [
                "/",
                results.max
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: pct >= 50 ? "default" : "destructive", children: [
              pct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: pct }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/quizzes/$courseId", params: {
              courseId: quiz.course_id
            }, children: "Back to quizzes" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses/$courseId", params: {
              courseId: quiz.course_id
            }, children: "Back to course" }) })
          ] })
        ] })
      ] }),
      results.items.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
            "Q",
            i + 1,
            ". ",
            r.question.prompt
          ] }),
          r.isCorrect ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "gap-1 bg-green-600 hover:bg-green-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3" }),
            "+",
            r.pointsAwarded
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "destructive", className: "gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3 w-3" }),
            "0/",
            r.question.points
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2 text-sm", children: [
          r.question.type === "short_answer" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Your answer:" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: r.isCorrect ? "text-green-600 font-medium" : "text-destructive font-medium", children: r.textAnswer || /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "blank" }) })
            ] }),
            r.question.correct_short_answer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Expected:" }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: r.question.correct_short_answer })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: r.question.choices.map((c) => {
            const picked = r.selectedChoiceIds.includes(c.id);
            const cls = c.is_correct ? "text-green-600 font-medium" : picked ? "text-destructive" : "text-muted-foreground";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: `flex items-center gap-2 ${cls}`, children: [
              c.is_correct ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }) : picked ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-4 w-4" }),
              c.label,
              " ",
              picked && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "(your pick)" })
            ] }, c.id);
          }) }),
          r.question.feedback && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border bg-muted/40 p-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Feedback:" }),
            " ",
            r.question.feedback
          ] })
        ] })
      ] }, r.question.id))
    ] }) });
  }
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const lowTime = secondsLeft <= 30;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-10 border-b bg-card/95 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-base font-bold md:text-lg", children: quiz.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Attempt ",
          attemptNumber,
          " · ",
          answeredCount,
          "/",
          questions.length,
          " answered"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-mono font-bold ${lowTime ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { className: "h-4 w-4" }),
        String(mins).padStart(2, "0"),
        ":",
        String(secs).padStart(2, "0")
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-3xl space-y-4 p-4 md:p-8", children: [
      questions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-16 text-center text-muted-foreground", children: "This quiz has no questions yet." }) }) : questions.map((q, i) => {
        const a = answers[q.id] ?? {
          choiceIds: [],
          text: ""
        };
        const correctCount = q.choices.filter((c) => c.is_correct).length;
        const multi = q.type === "mcq" && correctCount > 1;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
              "Q",
              i + 1,
              ". ",
              q.prompt
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
              q.points,
              " pt",
              q.points > 1 ? "s" : ""
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-2", children: q.type === "short_answer" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: a.text, onChange: (e) => setText(q.id, e.target.value), placeholder: "Your answer…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            q.choices.map((c) => {
              const picked = a.choiceIds.includes(c.id);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setChoice(q.id, c.id, multi), className: `flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${picked ? "border-primary bg-primary/10" : "hover:bg-muted"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${picked ? "border-primary bg-primary text-primary-foreground" : ""}`, children: picked && "✓" }),
                c.label
              ] }, c.id);
            }),
            multi && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Select all that apply." })
          ] }) })
        ] }, q.id);
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky bottom-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", onClick: () => handleSubmit(false), disabled: submitting || questions.length === 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-2 h-4 w-4" }),
        " ",
        submitting ? "Submitting…" : "Submit quiz"
      ] }) })
    ] })
  ] });
}
export {
  QuizRunner as component
};
