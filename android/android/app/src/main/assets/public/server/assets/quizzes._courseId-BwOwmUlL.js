import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { a as Route, u as useAuth, h as useNavigate, L as Link, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { P as Plus } from "./plus-lxXkFzog.js";
import { T as Timer } from "./timer-Bc8vhSuJ.js";
import { C as CirclePlay } from "./circle-play-C_7qxHed.js";
import { P as Pencil } from "./pencil-tZMbOL5s.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./NotificationBell-BKNCo5D8.js";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./users-WAU5C3w0.js";
import "./sparkles-DBEmDCt9.js";
function QuizzesPage() {
  const {
    courseId
  } = Route.useParams();
  const {
    user,
    role,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [quizzes, setQuizzes] = reactExports.useState([]);
  const [course, setCourse] = reactExports.useState(null);
  const [attempts, setAttempts] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  const [creating, setCreating] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    title: "",
    description: "",
    time_limit_minutes: 10
  });
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
  }, [authLoading, user, nav]);
  const isTeacher = !!course && !!user && (course.teacher_id === user.id || role === "admin");
  const load = async () => {
    setLoading(true);
    const {
      data: c
    } = await supabase.from("courses").select("id, title, teacher_id").eq("id", courseId).maybeSingle();
    setCourse(c);
    const {
      data: qs
    } = await supabase.from("quizzes").select("id, title, description, time_limit_minutes").eq("course_id", courseId).order("created_at", {
      ascending: true
    });
    setQuizzes(qs ?? []);
    if (user && qs && qs.length) {
      const ids = qs.map((q) => q.id);
      const {
        data: at
      } = await supabase.from("quiz_attempts").select("quiz_id, score, max_score, submitted_at").in("quiz_id", ids).eq("learner_id", user.id);
      const map = {};
      (at ?? []).forEach((a) => {
        const key = a.quiz_id;
        if (!map[key]) map[key] = {
          count: 0,
          best: 0,
          max: a.max_score || 0
        };
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
  reactExports.useEffect(() => {
    if (user) load();
  }, [user, courseId]);
  const create = async () => {
    if (!form.title.trim()) {
      toast.error("Title required");
      return;
    }
    setCreating(true);
    const {
      data,
      error
    } = await supabase.from("quizzes").insert({
      course_id: courseId,
      title: form.title,
      description: form.description || null,
      time_limit_minutes: form.time_limit_minutes
    }).select("id").single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Quiz created");
    nav({
      to: "/quizzes/$quizId/edit",
      params: {
        quizId: data.id
      }
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Quizzes", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: course ? `Quizzes · ${course.title}` : "Quizzes", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Assessments" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: course?.title })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses/$courseId", params: {
        courseId
      }, children: "Back to course" }) })
    ] }),
    isTeacher && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Create new quiz" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
            ...form,
            title: e.target.value
          }), placeholder: "Midterm quiz" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.description, onChange: (e) => setForm({
            ...form,
            description: e.target.value
          }), placeholder: "Optional" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Time limit (min)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, value: form.time_limit_minutes, onChange: (e) => setForm({
            ...form,
            time_limit_minutes: parseInt(e.target.value || "10", 10)
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: create, disabled: creating, className: "w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
          "Create"
        ] }) })
      ] })
    ] }),
    quizzes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-16 text-center text-muted-foreground", children: "No quizzes yet for this course." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: quizzes.map((q) => {
      const a = attempts[q.id];
      const remaining = 3 - (a?.count ?? 0);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: q.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { className: "mr-1 h-3 w-3" }),
              q.time_limit_minutes,
              "m"
            ] })
          ] }),
          q.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: q.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "flex items-center justify-between gap-2", children: role === "learner" || !isTeacher ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: a?.count ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "Best: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              a.best,
              "/",
              a.max
            ] }),
            " · ",
            remaining,
            " attempt",
            remaining === 1 ? "" : "s",
            " left"
          ] }) : "Not attempted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", disabled: remaining <= 0, asChild: remaining > 0, onClick: remaining <= 0 ? void 0 : void 0, children: remaining > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/quizzes/$quizId/take", params: {
            quizId: q.id
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { className: "mr-1 h-4 w-4" }),
            a?.count ? "Retake" : "Start"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "No attempts left" }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/quizzes/$quizId/edit", params: {
            quizId: q.id
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1 h-4 w-4" }),
            "Edit"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/quizzes/$quizId/take", params: {
            quizId: q.id
          }, children: "Preview" }) })
        ] }) })
      ] }, q.id);
    }) })
  ] }) });
}
export {
  QuizzesPage as component
};
