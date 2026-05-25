import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, L as Link, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { P as PageHero } from "./PageHero-CQ-1rbtd.js";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { S as Select, e as SelectTrigger, f as SelectValue, a as SelectContent, c as SelectItem } from "./select-DJfolYNu.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { c as ClipboardCheck } from "./NotificationBell-BKNCo5D8.js";
import { P as Plus } from "./plus-lxXkFzog.js";
import { T as Timer } from "./timer-Bc8vhSuJ.js";
import { P as Pencil } from "./pencil-tZMbOL5s.js";
import { C as CirclePlay } from "./circle-play-C_7qxHed.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./index-x37Yg8v9.js";
import "./users-WAU5C3w0.js";
import "./sparkles-DBEmDCt9.js";
const heroAssessments = "/assets/hero-assessments-BW3uE1Wx.jpg";
function AssessmentsPage() {
  const {
    user,
    role,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = reactExports.useState(true);
  const [creating, setCreating] = reactExports.useState(false);
  const [courses, setCourses] = reactExports.useState([]);
  const [quizzes, setQuizzes] = reactExports.useState([]);
  const [form, setForm] = reactExports.useState({
    course_id: "",
    title: "",
    description: "",
    time_limit_minutes: 10
  });
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
  }, [authLoading, user, nav]);
  const isTeacher = role === "teacher" || role === "admin";
  const load = async () => {
    if (!user) return;
    setLoading(true);
    const courseQuery = supabase.from("courses").select("id, title").order("created_at", {
      ascending: false
    });
    const {
      data: cs
    } = role === "admin" ? await courseQuery : await courseQuery.eq("teacher_id", user.id);
    const courseList = cs ?? [];
    setCourses(courseList);
    if (courseList.length === 0) {
      setQuizzes([]);
      setLoading(false);
      return;
    }
    const ids = courseList.map((c) => c.id);
    const {
      data: qs
    } = await supabase.from("quizzes").select("id, title, description, time_limit_minutes, course_id").in("course_id", ids).order("created_at", {
      ascending: false
    });
    const quizList = qs ?? [];
    let countMap = {};
    if (quizList.length) {
      const {
        data: questions
      } = await supabase.from("questions").select("quiz_id").in("quiz_id", quizList.map((q) => q.id));
      (questions ?? []).forEach((row) => {
        countMap[row.quiz_id] = (countMap[row.quiz_id] ?? 0) + 1;
      });
    }
    setQuizzes(quizList.map((q) => ({
      ...q,
      questionCount: countMap[q.id] ?? 0
    })));
    if (!form.course_id && courseList.length) setForm((f) => ({
      ...f,
      course_id: courseList[0].id
    }));
    setLoading(false);
  };
  reactExports.useEffect(() => {
    if (user) load();
  }, [user, role]);
  const create = async () => {
    if (!form.course_id) {
      toast.error("Select a course");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Title required");
      return;
    }
    if (!form.time_limit_minutes || form.time_limit_minutes < 1) {
      toast.error("Time limit must be at least 1 minute");
      return;
    }
    setCreating(true);
    const {
      data,
      error
    } = await supabase.from("quizzes").insert({
      course_id: form.course_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      time_limit_minutes: form.time_limit_minutes
    }).select("id").single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Assessment created — add your questions");
    nav({
      to: "/quizzes/$quizId/edit",
      params: {
        quizId: data.id
      }
    });
  };
  const courseTitle = (id) => courses.find((c) => c.id === id)?.title ?? "";
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Assessments", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Assessments", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PageHero, { eyebrow: "Quizzes & evaluations", EyebrowIcon: ClipboardCheck, title: "Assessments", description: isTeacher ? "Create quizzes attached to your courses with multiple choice, true/false, and short answer questions." : "Browse and take assessments from your enrolled courses.", backgroundImage: heroAssessments }),
    isTeacher && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Create new assessment" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: courses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "You don't have any courses yet. ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/my-courses", className: "text-primary underline", children: "Create a course" }),
        " first."
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_1fr_1fr_160px_auto]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Course" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.course_id, onValueChange: (v) => setForm({
            ...form,
            course_id: v
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select course" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: courses.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.id, children: c.title }, c.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
            ...form,
            title: e.target.value
          }), placeholder: "Midterm quiz", maxLength: 120 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.description, onChange: (e) => setForm({
            ...form,
            description: e.target.value
          }), placeholder: "Optional", maxLength: 300 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Time limit (min)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", inputMode: "numeric", pattern: "[0-9]*", value: form.time_limit_minutes === 0 ? "" : String(form.time_limit_minutes), onChange: (e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            if (raw === "") {
              setForm({
                ...form,
                time_limit_minutes: 0
              });
              return;
            }
            const n = Math.min(600, parseInt(raw, 10));
            setForm({
              ...form,
              time_limit_minutes: n
            });
          } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: create, disabled: creating, className: "w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
          "Create"
        ] }) })
      ] }) })
    ] }),
    quizzes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-16 text-center text-muted-foreground", children: [
      "No assessments yet",
      isTeacher ? " — create your first one above" : "",
      "."
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: quizzes.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/60 transition hover:-translate-y-0.5", style: {
      boxShadow: "var(--shadow-card)"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: q.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: courseTitle(q.course_id) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { className: "mr-1 h-3 w-3" }),
            q.time_limit_minutes,
            "m"
          ] })
        ] }),
        q.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: q.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          q.questionCount,
          " question",
          q.questionCount === 1 ? "" : "s"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          isTeacher && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/quizzes/$quizId/edit", params: {
            quizId: q.id
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1 h-4 w-4" }),
            "Edit"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/quizzes/$courseId", params: {
            courseId: q.course_id
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { className: "mr-1 h-4 w-4" }),
            "Open"
          ] }) })
        ] })
      ] })
    ] }, q.id)) })
  ] }) });
}
export {
  AssessmentsPage as component
};
