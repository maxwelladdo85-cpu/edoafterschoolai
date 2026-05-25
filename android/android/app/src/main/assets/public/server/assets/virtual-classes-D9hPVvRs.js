import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, a as CardContent, c as CardHeader, d as CardTitle, b as CardDescription } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { T as Textarea } from "./textarea-BvkbP7fP.js";
import { S as Select, e as SelectTrigger, f as SelectValue, a as SelectContent, c as SelectItem } from "./select-DJfolYNu.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { D as Dialog, f as DialogTrigger, a as DialogContent, d as DialogHeader, e as DialogTitle, c as DialogFooter } from "./dialog-DJ5dOu41.js";
import { g as getStatus, f as formatWhen, E as ExternalLink } from "./virtual-classes-Dya2nY5V.js";
import { V as Video } from "./NotificationBell-BKNCo5D8.js";
import { P as Plus } from "./plus-lxXkFzog.js";
import { C as Calendar } from "./calendar-BM_3-7uj.js";
import { C as CirclePlay } from "./circle-play-C_7qxHed.js";
import { P as Pencil } from "./pencil-tZMbOL5s.js";
import { T as Trash2 } from "./trash-2-Dl1mHj_4.js";
import { o as objectType, s as stringType, c as coerce } from "./types-Ch40mmLW.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./index-ChW4vIqc.js";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./index-x37Yg8v9.js";
import "./users-WAU5C3w0.js";
import "./sparkles-DBEmDCt9.js";
const scheduleSchema = objectType({
  course_id: stringType().uuid({
    message: "Pick a course"
  }),
  title: stringType().trim().min(2, "Title is required").max(150),
  description: stringType().trim().max(1e3).optional().nullable(),
  date: stringType().min(1, "Date is required"),
  time: stringType().min(1, "Time is required"),
  duration_minutes: coerce.number().int().min(5).max(480),
  zoom_url: stringType().trim().url("Enter a valid Zoom link").max(500)
});
function VirtualClassesPage() {
  const {
    user,
    role,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = reactExports.useState([]);
  const [classes, setClasses] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [open, setOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [recordingFor, setRecordingFor] = reactExports.useState(null);
  const [recordingUrl, setRecordingUrl] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
    if (!authLoading && user && role && role !== "teacher" && role !== "admin") {
      toast.error("Only teachers can manage virtual classes");
      nav({
        to: "/dashboard"
      });
    }
  }, [authLoading, user, role, nav]);
  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const [{
      data: cs
    }, {
      data: vcs
    }] = await Promise.all([supabase.from("courses").select("id,title").eq("teacher_id", user.id).order("created_at", {
      ascending: false
    }), supabase.from("virtual_classes").select("*").eq("teacher_id", user.id).order("scheduled_at", {
      ascending: false
    })]);
    const courseList = cs ?? [];
    setCourses(courseList);
    const titleMap = new Map(courseList.map((c) => [c.id, c.title]));
    const rows = (vcs ?? []).map((r) => ({
      ...r,
      course: {
        title: titleMap.get(r.course_id) ?? ""
      }
    }));
    const missing = Array.from(new Set(rows.filter((r) => !r.course?.title).map((r) => r.course_id)));
    if (missing.length) {
      const {
        data: extra
      } = await supabase.from("courses").select("id,title").in("id", missing);
      const extraMap = new Map((extra ?? []).map((c) => [c.id, c.title]));
      for (const r of rows) {
        if (!r.course?.title) r.course = {
          title: extraMap.get(r.course_id) ?? ""
        };
      }
    }
    setClasses(rows);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    refresh();
  }, [user]);
  const grouped = reactExports.useMemo(() => {
    const upcoming = [];
    const past = [];
    for (const c of classes) {
      (getStatus(c) === "ended" ? past : upcoming).push(c);
    }
    upcoming.sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));
    return {
      upcoming,
      past
    };
  }, [classes]);
  const onSchedule = async (form) => {
    if (!user) return;
    const raw = {
      course_id: String(form.get("course_id") ?? ""),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? "") || null,
      date: String(form.get("date") ?? ""),
      time: String(form.get("time") ?? ""),
      duration_minutes: form.get("duration_minutes"),
      zoom_url: String(form.get("zoom_url") ?? "")
    };
    const parsed = scheduleSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const scheduled_at = (/* @__PURE__ */ new Date(`${parsed.data.date}T${parsed.data.time}`)).toISOString();
    const payload = {
      course_id: parsed.data.course_id,
      title: parsed.data.title,
      description: parsed.data.description,
      scheduled_at,
      duration_minutes: parsed.data.duration_minutes,
      zoom_url: parsed.data.zoom_url
    };
    let error;
    if (editing) {
      ({
        error
      } = await supabase.from("virtual_classes").update(payload).eq("id", editing.id));
    } else {
      ({
        error
      } = await supabase.from("virtual_classes").insert({
        ...payload,
        teacher_id: user.id
      }));
    }
    if (error) return toast.error(error.message);
    toast.success(editing ? "Class updated" : "Class scheduled");
    setOpen(false);
    setEditing(null);
    refresh();
  };
  const onDelete = async (c) => {
    if (!confirm(`Delete "${c.title}"?`)) return;
    const {
      error
    } = await supabase.from("virtual_classes").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    refresh();
  };
  const onSaveRecording = async () => {
    if (!recordingFor) return;
    const url = recordingUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      return toast.error("Recording URL must start with http(s)://");
    }
    const {
      error
    } = await supabase.from("virtual_classes").update({
      recording_url: url || null
    }).eq("id", recordingFor.id);
    if (error) return toast.error(error.message);
    toast.success("Recording link saved");
    setRecordingFor(null);
    setRecordingUrl("");
    refresh();
  };
  const openEdit = (c) => {
    setEditing(c);
    setOpen(true);
  };
  const openRecording = (c) => {
    setRecordingFor(c);
    setRecordingUrl(c.recording_url ?? "");
  };
  const initial = editing ? {
    course_id: editing.course_id,
    title: editing.title,
    description: editing.description ?? "",
    date: editing.scheduled_at.slice(0, 10),
    time: new Date(editing.scheduled_at).toTimeString().slice(0, 5),
    duration_minutes: editing.duration_minutes,
    zoom_url: editing.zoom_url
  } : {
    course_id: courses[0]?.id ?? "",
    title: "",
    description: "",
    date: "",
    time: "",
    duration_minutes: 60,
    zoom_url: ""
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DashboardShell, { title: "Virtual Classes", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "h-6 w-6 text-primary" }),
            " Virtual Classes"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Schedule live Zoom sessions for your courses." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: (v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: courses.length === 0, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
            " Schedule class"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Edit class" : "Schedule a virtual class" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
              e.preventDefault();
              onSchedule(new FormData(e.currentTarget));
            }, className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Course" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { name: "course_id", defaultValue: initial.course_id, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select course" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: courses.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.id, children: c.title }, c.id)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { name: "title", defaultValue: initial.title, placeholder: "Algebra Q&A session", maxLength: 150, required: true })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description (optional)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { name: "description", rows: 2, defaultValue: initial.description, maxLength: 1e3 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 col-span-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Date" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", name: "date", defaultValue: initial.date, required: true })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 col-span-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Time" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "time", name: "time", defaultValue: initial.time, required: true })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 col-span-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Duration (min)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", name: "duration_minutes", min: 5, max: 480, defaultValue: initial.duration_minutes, required: true })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Zoom link" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { name: "zoom_url", type: "url", defaultValue: initial.zoom_url, placeholder: "https://zoom.us/j/…", maxLength: 500, required: true })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: editing ? "Save changes" : "Schedule" }) })
            ] }, editing?.id ?? "new")
          ] })
        ] })
      ] }),
      courses.length === 0 && !loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-6 text-center text-sm text-muted-foreground", children: "Create a course first before scheduling a virtual class." }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Upcoming & live", rows: grouped.upcoming, loading, onEdit: openEdit, onDelete, onRecording: openRecording }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: "Past sessions", rows: grouped.past, loading, onEdit: openEdit, onDelete, onRecording: openRecording })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!recordingFor, onOpenChange: (v) => {
      if (!v) {
        setRecordingFor(null);
        setRecordingUrl("");
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Add recording link" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Recording URL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: recordingUrl, onChange: (e) => setRecordingUrl(e.target.value), placeholder: "https://…" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Paste the Zoom cloud recording or any video URL. Leave empty to remove." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onSaveRecording, children: "Save" }) })
    ] }) })
  ] });
}
function Section({
  title,
  rows,
  loading,
  onEdit,
  onDelete,
  onRecording
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-2 text-lg font-semibold", children: title }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-6 text-center text-muted-foreground", children: "Loading…" }) }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-6 text-center text-sm text-muted-foreground", children: "Nothing here." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: rows.map((c) => {
      const status = getStatus(c);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base truncate", children: c.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "truncate", children: [
              c.course?.title,
              " · ",
              c.duration_minutes,
              " min"
            ] })
          ] }),
          status === "live" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-destructive text-destructive-foreground animate-pulse", children: "LIVE" }) : status === "upcoming" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Upcoming" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "Ended" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4" }),
            " ",
            formatWhen(c.scheduled_at)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: c.zoom_url, target: "_blank", rel: "noopener noreferrer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "mr-1 h-3.5 w-3.5" }),
              "Open Zoom"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => onRecording(c), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { className: "mr-1 h-3.5 w-3.5" }),
              c.recording_url ? "Edit recording" : "Add recording"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: () => onEdit(c), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1 h-3.5 w-3.5" }),
              "Edit"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => onDelete(c), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1 h-3.5 w-3.5 text-destructive" }) })
          ] })
        ] })
      ] }, c.id);
    }) })
  ] });
}
export {
  VirtualClassesPage as component
};
