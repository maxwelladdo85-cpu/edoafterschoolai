import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, L as Link, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, a as CardContent, c as CardHeader, d as CardTitle, b as CardDescription } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { P as PageHero } from "./PageHero-CQ-1rbtd.js";
import { G as GraduationCap, B as BookOpen } from "./users-WAU5C3w0.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./NotificationBell-BKNCo5D8.js";
import "./Logo-wkBcYT7E.js";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./sparkles-DBEmDCt9.js";
const heroLibrary = "/assets/hero-library-BcddV6Gg.jpg";
function CoursesLibrary() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = reactExports.useState([]);
  const [enrolledIds, setEnrolledIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = reactExports.useState(true);
  const [enrollingId, setEnrollingId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
  }, [authLoading, user, nav]);
  reactExports.useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{
        data: cs
      }, {
        data: es
      }] = await Promise.all([supabase.from("courses").select("id, title, subject, description, thumbnail_url, class_level, teacher_name, teacher_id").order("created_at", {
        ascending: false
      }), supabase.from("enrollments").select("course_id").eq("learner_id", user.id)]);
      let rows = (cs ?? []).map((r) => ({
        ...r,
        teacher: null
      }));
      if (rows.length) {
        const ids = Array.from(new Set(rows.map((r) => r.teacher_id)));
        const {
          data: profs
        } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
        rows = rows.map((r) => ({
          ...r,
          teacher: {
            full_name: map.get(r.teacher_id) ?? null
          }
        }));
      }
      setCourses(rows);
      setEnrolledIds(new Set((es ?? []).map((e) => e.course_id)));
      setLoading(false);
    })();
  }, [user]);
  const enroll = async (courseId) => {
    if (!user) return;
    setEnrollingId(courseId);
    const {
      error
    } = await supabase.from("enrollments").insert({
      learner_id: user.id,
      course_id: courseId,
      progress: 0
    });
    setEnrollingId(null);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return toast.error(error.message);
    }
    setEnrolledIds((s) => new Set(s).add(courseId));
    toast.success("Enrolled — opening course");
    nav({
      to: "/courses/$courseId",
      params: {
        courseId
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Course Library", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PageHero, { eyebrow: "Browse & enroll", EyebrowIcon: GraduationCap, title: "Course Library", description: "Discover and enroll in courses created by Edo SUBEB teachers.", backgroundImage: heroLibrary }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-20 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin" }),
      " Loading courses…"
    ] }) : courses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", style: {
      background: "var(--gradient-emerald-soft)"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center gap-3 py-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-7 w-7" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-medium", children: "No active courses yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-sm text-muted-foreground", children: "Check back soon — teachers are publishing new courses regularly." })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3", children: courses.map((c) => {
      const enrolled = enrolledIds.has(c.id);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden flex flex-col border-border/60 transition-all hover:-translate-y-0.5", style: {
        boxShadow: "var(--shadow-card)"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[16/9] w-full overflow-hidden bg-muted", children: c.thumbnail_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: c.thumbnail_url, alt: c.title, className: "h-full w-full object-cover", loading: "lazy" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-gold/15 to-accent/15", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "h-12 w-12 text-primary/60" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base leading-snug", children: c.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1", children: [
              c.subject && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: c.subject }),
              c.class_level && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: c.class_level })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "line-clamp-2", children: c.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "mt-auto space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Teacher: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: c.teacher_name ?? c.teacher?.full_name ?? "—" })
          ] }),
          enrolled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "w-full", variant: "secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses/$courseId", params: {
            courseId: c.id
          }, children: "Continue learning" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", disabled: enrollingId === c.id, onClick: () => enroll(c.id), children: enrollingId === c.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
            " Enrolling…"
          ] }) : "Enroll" })
        ] })
      ] }, c.id);
    }) })
  ] }) });
}
export {
  CoursesLibrary as component
};
