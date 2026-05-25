import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { e as Route, u as useAuth, h as useNavigate, L as Link, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, a as CardContent, c as CardHeader, d as CardTitle } from "./card-h2noaq3f.js";
import { u as useComposedRefs, a as cn, B as Button } from "./button-DInpa_86.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { T as Textarea } from "./textarea-BvkbP7fP.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { f as Presence, g as Primitive, q as useControllableState, l as composeEventHandlers, v as useSize, m as createContextScope } from "./index-BHnLLcIP.js";
import { u as usePrevious, C as Check } from "./index-x37Yg8v9.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
import { T as Trash2 } from "./trash-2-Dl1mHj_4.js";
import { P as Plus } from "./plus-lxXkFzog.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./NotificationBell-BKNCo5D8.js";
import "./users-WAU5C3w0.js";
import "./sparkles-DBEmDCt9.js";
import "./badge-B3p-cBAM.js";
const __iconNode = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode);
var CHECKBOX_NAME = "Checkbox";
var [createCheckboxContext] = createContextScope(CHECKBOX_NAME);
var [CheckboxProviderImpl, useCheckboxContext] = createCheckboxContext(CHECKBOX_NAME);
function CheckboxProvider(props) {
  const {
    __scopeCheckbox,
    checked: checkedProp,
    children,
    defaultChecked,
    disabled,
    form,
    name,
    onCheckedChange,
    required,
    value = "on",
    // @ts-expect-error
    internal_do_not_use_render
  } = props;
  const [checked, setChecked] = useControllableState({
    prop: checkedProp,
    defaultProp: defaultChecked ?? false,
    onChange: onCheckedChange,
    caller: CHECKBOX_NAME
  });
  const [control, setControl] = reactExports.useState(null);
  const [bubbleInput, setBubbleInput] = reactExports.useState(null);
  const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
  const isFormControl = control ? !!form || !!control.closest("form") : (
    // We set this to true by default so that events bubble to forms without JS (SSR)
    true
  );
  const context = {
    checked,
    disabled,
    setChecked,
    control,
    setControl,
    name,
    form,
    value,
    hasConsumerStoppedPropagationRef,
    required,
    defaultChecked: isIndeterminate(defaultChecked) ? false : defaultChecked,
    isFormControl,
    bubbleInput,
    setBubbleInput
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    CheckboxProviderImpl,
    {
      scope: __scopeCheckbox,
      ...context,
      children: isFunction(internal_do_not_use_render) ? internal_do_not_use_render(context) : children
    }
  );
}
var TRIGGER_NAME = "CheckboxTrigger";
var CheckboxTrigger = reactExports.forwardRef(
  ({ __scopeCheckbox, onKeyDown, onClick, ...checkboxProps }, forwardedRef) => {
    const {
      control,
      value,
      disabled,
      checked,
      required,
      setControl,
      setChecked,
      hasConsumerStoppedPropagationRef,
      isFormControl,
      bubbleInput
    } = useCheckboxContext(TRIGGER_NAME, __scopeCheckbox);
    const composedRefs = useComposedRefs(forwardedRef, setControl);
    const initialCheckedStateRef = reactExports.useRef(checked);
    reactExports.useEffect(() => {
      const form = control?.form;
      if (form) {
        const reset = () => setChecked(initialCheckedStateRef.current);
        form.addEventListener("reset", reset);
        return () => form.removeEventListener("reset", reset);
      }
    }, [control, setChecked]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        role: "checkbox",
        "aria-checked": isIndeterminate(checked) ? "mixed" : checked,
        "aria-required": required,
        "data-state": getState(checked),
        "data-disabled": disabled ? "" : void 0,
        disabled,
        value,
        ...checkboxProps,
        ref: composedRefs,
        onKeyDown: composeEventHandlers(onKeyDown, (event) => {
          if (event.key === "Enter") event.preventDefault();
        }),
        onClick: composeEventHandlers(onClick, (event) => {
          setChecked((prevChecked) => isIndeterminate(prevChecked) ? true : !prevChecked);
          if (bubbleInput && isFormControl) {
            hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
            if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
          }
        })
      }
    );
  }
);
CheckboxTrigger.displayName = TRIGGER_NAME;
var Checkbox$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeCheckbox,
      name,
      checked,
      defaultChecked,
      required,
      disabled,
      value,
      onCheckedChange,
      form,
      ...checkboxProps
    } = props;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      CheckboxProvider,
      {
        __scopeCheckbox,
        checked,
        defaultChecked,
        disabled,
        required,
        onCheckedChange,
        name,
        form,
        value,
        internal_do_not_use_render: ({ isFormControl }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CheckboxTrigger,
            {
              ...checkboxProps,
              ref: forwardedRef,
              __scopeCheckbox
            }
          ),
          isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
            CheckboxBubbleInput,
            {
              __scopeCheckbox
            }
          )
        ] })
      }
    );
  }
);
Checkbox$1.displayName = CHECKBOX_NAME;
var INDICATOR_NAME = "CheckboxIndicator";
var CheckboxIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeCheckbox, forceMount, ...indicatorProps } = props;
    const context = useCheckboxContext(INDICATOR_NAME, __scopeCheckbox);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Presence,
      {
        present: forceMount || isIndeterminate(context.checked) || context.checked === true,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.span,
          {
            "data-state": getState(context.checked),
            "data-disabled": context.disabled ? "" : void 0,
            ...indicatorProps,
            ref: forwardedRef,
            style: { pointerEvents: "none", ...props.style }
          }
        )
      }
    );
  }
);
CheckboxIndicator.displayName = INDICATOR_NAME;
var BUBBLE_INPUT_NAME = "CheckboxBubbleInput";
var CheckboxBubbleInput = reactExports.forwardRef(
  ({ __scopeCheckbox, ...props }, forwardedRef) => {
    const {
      control,
      hasConsumerStoppedPropagationRef,
      checked,
      defaultChecked,
      required,
      disabled,
      name,
      value,
      form,
      bubbleInput,
      setBubbleInput
    } = useCheckboxContext(BUBBLE_INPUT_NAME, __scopeCheckbox);
    const composedRefs = useComposedRefs(forwardedRef, setBubbleInput);
    const prevChecked = usePrevious(checked);
    const controlSize = useSize(control);
    reactExports.useEffect(() => {
      const input = bubbleInput;
      if (!input) return;
      const inputProto = window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(
        inputProto,
        "checked"
      );
      const setChecked = descriptor.set;
      const bubbles = !hasConsumerStoppedPropagationRef.current;
      if (prevChecked !== checked && setChecked) {
        const event = new Event("click", { bubbles });
        input.indeterminate = isIndeterminate(checked);
        setChecked.call(input, isIndeterminate(checked) ? false : checked);
        input.dispatchEvent(event);
      }
    }, [bubbleInput, prevChecked, checked, hasConsumerStoppedPropagationRef]);
    const defaultCheckedRef = reactExports.useRef(isIndeterminate(checked) ? false : checked);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.input,
      {
        type: "checkbox",
        "aria-hidden": true,
        defaultChecked: defaultChecked ?? defaultCheckedRef.current,
        required,
        disabled,
        name,
        value,
        form,
        ...props,
        tabIndex: -1,
        ref: composedRefs,
        style: {
          ...props.style,
          ...controlSize,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0,
          // We transform because the input is absolutely positioned but we have
          // rendered it **after** the button. This pulls it back to sit on top
          // of the button.
          transform: "translateX(-100%)"
        }
      }
    );
  }
);
CheckboxBubbleInput.displayName = BUBBLE_INPUT_NAME;
function isFunction(value) {
  return typeof value === "function";
}
function isIndeterminate(checked) {
  return checked === "indeterminate";
}
function getState(checked) {
  return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Checkbox$1,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxIndicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = Checkbox$1.displayName;
const tid = () => Math.random().toString(36).slice(2);
function QuizEditor() {
  const {
    quizId
  } = Route.useParams();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  const [quiz, setQuiz] = reactExports.useState(null);
  const [questions, setQuestions] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
  }, [authLoading, user, nav]);
  reactExports.useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: q
      } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
      if (!q) {
        setLoading(false);
        return;
      }
      setQuiz({
        title: q.title,
        description: q.description ?? "",
        time_limit_minutes: q.time_limit_minutes,
        course_id: q.course_id
      });
      const {
        data: qs
      } = await supabase.from("questions").select("*").eq("quiz_id", quizId).order("position");
      const qIds = (qs ?? []).map((x) => x.id);
      const {
        data: cs
      } = qIds.length ? await supabase.from("question_choices").select("*").in("question_id", qIds).order("position") : {
        data: []
      };
      setQuestions((qs ?? []).map((row) => ({
        id: row.id,
        tempId: tid(),
        type: row.type,
        prompt: row.prompt,
        points: row.points,
        correct_short_answer: row.correct_short_answer ?? "",
        feedback: row.feedback ?? "",
        choices: (cs ?? []).filter((c) => c.question_id === row.id).map((c) => ({
          id: c.id,
          tempId: tid(),
          label: c.label,
          is_correct: c.is_correct
        }))
      })));
      setLoading(false);
    })();
  }, [quizId]);
  const addQuestion = (type) => {
    const base = {
      tempId: tid(),
      type,
      prompt: "",
      points: 1,
      correct_short_answer: "",
      feedback: "",
      choices: []
    };
    if (type === "mcq") base.choices = [{
      tempId: tid(),
      label: "",
      is_correct: true
    }, {
      tempId: tid(),
      label: "",
      is_correct: false
    }];
    if (type === "true_false") base.choices = [{
      tempId: tid(),
      label: "True",
      is_correct: true
    }, {
      tempId: tid(),
      label: "False",
      is_correct: false
    }];
    setQuestions((qs) => [...qs, base]);
  };
  const updateQ = (i, patch) => setQuestions((qs) => qs.map((q, idx) => idx === i ? {
    ...q,
    ...patch
  } : q));
  const removeQ = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  const updateC = (qi, ci, patch) => setQuestions((qs) => qs.map((q, idx) => idx !== qi ? q : {
    ...q,
    choices: q.choices.map((c, j) => j === ci ? {
      ...c,
      ...patch
    } : c)
  }));
  const addChoice = (qi) => updateQ(qi, {
    choices: [...questions[qi].choices, {
      tempId: tid(),
      label: "",
      is_correct: false
    }]
  });
  const removeChoice = (qi, ci) => setQuestions((qs) => qs.map((q, idx) => idx !== qi ? q : {
    ...q,
    choices: q.choices.filter((_, j) => j !== ci)
  }));
  const save = async () => {
    if (!quiz) return;
    setSaving(true);
    try {
      const {
        error: qErr
      } = await supabase.from("quizzes").update({
        title: quiz.title,
        description: quiz.description || null,
        time_limit_minutes: quiz.time_limit_minutes
      }).eq("id", quizId);
      if (qErr) throw qErr;
      const {
        error: delErr
      } = await supabase.from("questions").delete().eq("quiz_id", quizId);
      if (delErr) throw delErr;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.prompt.trim()) continue;
        const {
          data: ins,
          error: insErr
        } = await supabase.from("questions").insert({
          quiz_id: quizId,
          type: q.type,
          prompt: q.prompt,
          points: q.points,
          position: i,
          correct_short_answer: q.type === "short_answer" ? q.correct_short_answer || null : null,
          feedback: q.feedback || null
        }).select("id").single();
        if (insErr) throw insErr;
        if (q.choices.length) {
          const rows = q.choices.map((c, j) => ({
            question_id: ins.id,
            label: c.label,
            is_correct: c.is_correct,
            position: j
          }));
          const {
            error: cErr
          } = await supabase.from("question_choices").insert(rows);
          if (cErr) throw cErr;
        }
      }
      toast.success("Quiz saved");
    } catch (e) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Quiz editor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) });
  if (!quiz) return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Quiz", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-16 text-center", children: "Quiz not found." }) }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Quiz editor", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Edit quiz" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/quizzes/$courseId", params: {
          courseId: quiz.course_id
        }, children: "Back" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: save, disabled: saving, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1 h-4 w-4" }),
          saving ? "Saving…" : "Save"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Quiz details" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-3 md:grid-cols-[1fr_140px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: quiz.title, onChange: (e) => setQuiz({
            ...quiz,
            title: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Time limit (min)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, value: quiz.time_limit_minutes, onChange: (e) => setQuiz({
            ...quiz,
            time_limit_minutes: parseInt(e.target.value || "10", 10)
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: quiz.description, onChange: (e) => setQuiz({
            ...quiz,
            description: e.target.value
          }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: questions.map((q, qi) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base", children: [
          "Question ",
          qi + 1,
          " · ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase text-muted-foreground", children: q.type.replace("_", " ") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => removeQ(qi), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Prompt" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: q.prompt, onChange: (e) => updateQ(qi, {
            prompt: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Points" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, value: q.points, onChange: (e) => updateQ(qi, {
              points: parseInt(e.target.value || "1", 10)
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Feedback (shown after grading)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: q.feedback, onChange: (e) => updateQ(qi, {
              feedback: e.target.value
            }) })
          ] })
        ] }),
        q.type === "short_answer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Correct answer (case-insensitive match)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: q.correct_short_answer, onChange: (e) => updateQ(qi, {
            correct_short_answer: e.target.value
          }) })
        ] }),
        (q.type === "mcq" || q.type === "true_false") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { children: [
            "Choices (check the correct one",
            q.type === "mcq" ? "s" : "",
            ")"
          ] }),
          q.choices.map((c, ci) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: c.is_correct, onCheckedChange: (v) => {
              if (q.type === "true_false") {
                setQuestions((qs) => qs.map((qq, idx) => idx !== qi ? qq : {
                  ...qq,
                  choices: qq.choices.map((cc, j) => ({
                    ...cc,
                    is_correct: j === ci ? !!v : false
                  }))
                }));
              } else {
                updateC(qi, ci, {
                  is_correct: !!v
                });
              }
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: c.label, disabled: q.type === "true_false", onChange: (e) => updateC(qi, ci, {
              label: e.target.value
            }), placeholder: `Choice ${ci + 1}` }),
            q.type === "mcq" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => removeChoice(qi, ci), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
          ] }, c.tempId)),
          q.type === "mcq" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => addChoice(qi), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
            "Add choice"
          ] })
        ] })
      ] })
    ] }, q.tempId)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-wrap gap-2 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => addQuestion("mcq"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
        "Multiple choice"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => addQuestion("true_false"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
        "True / False"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => addQuestion("short_answer"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
        "Short answer"
      ] })
    ] }) })
  ] }) });
}
export {
  QuizEditor as component
};
