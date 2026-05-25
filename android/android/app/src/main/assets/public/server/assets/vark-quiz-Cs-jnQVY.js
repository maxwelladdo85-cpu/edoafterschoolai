import { ac as useRouter, Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, L as Link, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { C as Card, c as CardHeader, d as CardTitle, b as CardDescription, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { P as Progress } from "./progress-B3TAVT7s.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { V as VARK_QUESTIONS, S as STYLE_LABELS, a as STYLE_TIPS, s as scoreAnswers } from "./vark-Q3Rb9CFW.js";
import { A as ArrowLeft } from "./arrow-left-DAFdNjpd.js";
import { S as Sparkles } from "./sparkles-DBEmDCt9.js";
import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
const __iconNode = [
  ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", key: "1p45f6" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }]
];
const RotateCw = createLucideIcon("rotate-cw", __iconNode);
function VarkQuizPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const [answers, setAnswers] = reactExports.useState(Array(VARK_QUESTIONS.length).fill(null));
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [result, setResult] = reactExports.useState(null);
  const answered = answers.filter(Boolean).length;
  const allAnswered = answered === VARK_QUESTIONS.length;
  const submit = async () => {
    if (!user || !allAnswered) return;
    setSubmitting(true);
    const final = answers;
    const {
      scores,
      dominant
    } = scoreAnswers(final);
    const {
      error
    } = await supabase.from("vark_results").insert({
      learner_id: user.id,
      visual: scores.visual,
      aural: scores.aural,
      read_write: scores.read_write,
      kinesthetic: scores.kinesthetic,
      dominant,
      answers: final
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResult({
      scores,
      dominant
    });
    toast.success("Great work! Your learning style is ready.");
  };
  const reset = () => {
    setAnswers(Array(VARK_QUESTIONS.length).fill(null));
    setResult(null);
  };
  if (result) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", onClick: () => router.navigate({
        to: "/dashboard"
      }), className: "gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to dashboard"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "w-fit gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
            " Your VARK result"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-3xl", children: [
            "You learn best as a ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: STYLE_LABELS[result.dominant] }),
            " learner"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Here's a breakdown of how you scored across the four learning styles." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: Object.keys(STYLE_LABELS).map((s) => {
          const pct = Math.round(result.scores[s] / VARK_QUESTIONS.length * 100);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: STYLE_LABELS[s] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                result.scores[s],
                " / ",
                VARK_QUESTIONS.length
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: pct })
          ] }, s);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "How you learn best" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Try these study tips that match your dominant style." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "list-disc space-y-2 pl-5 text-sm", children: STYLE_TIPS[result.dominant].map((tip, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: tip }, i)) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: reset, variant: "outline", className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCw, { className: "h-4 w-4" }),
          " Retake quiz"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard", children: "Done" }) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "mb-2 gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
        " 8 questions · ~3 minutes"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "VARK Learning Style Quiz" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Pick the option that feels most like you. There are no wrong answers." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-10 -mx-6 bg-background/80 px-6 py-3 backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Progress" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          answered,
          " / ",
          VARK_QUESTIONS.length
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { className: "mt-1", value: answered / VARK_QUESTIONS.length * 100 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: VARK_QUESTIONS.map((q, qi) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
        qi + 1,
        ". ",
        q.prompt
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "grid gap-2 sm:grid-cols-2", children: q.options.map((opt, oi) => {
        const selected = answers[qi] === opt.style;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setAnswers((a) => {
          const c = [...a];
          c[qi] = opt.style;
          return c;
        }), className: `rounded-md border p-3 text-left text-sm transition ${selected ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "hover:bg-muted/50"}`, children: opt.label }, oi);
      }) })
    ] }, q.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky bottom-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "lg", disabled: !allAnswered || submitting, onClick: submit, children: submitting ? "Saving…" : allAnswered ? "See my result" : `Answer all ${VARK_QUESTIONS.length} questions` }) })
  ] });
}
export {
  VarkQuizPage as component
};
