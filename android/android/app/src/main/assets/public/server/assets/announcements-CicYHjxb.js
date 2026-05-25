import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { P as PageHero } from "./PageHero-CQ-1rbtd.js";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { T as Textarea } from "./textarea-BvkbP7fP.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { S as Select, e as SelectTrigger, f as SelectValue, a as SelectContent, c as SelectItem } from "./select-DJfolYNu.js";
import { D as Dialog, f as DialogTrigger, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./dialog-DJ5dOu41.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { M as Megaphone } from "./NotificationBell-BKNCo5D8.js";
import { P as Plus } from "./plus-lxXkFzog.js";
import { U as Users } from "./users-WAU5C3w0.js";
import { S as Send } from "./send-DUaj7YoT.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./index-x37Yg8v9.js";
import "./sparkles-DBEmDCt9.js";
const heroAnnouncements = "/assets/hero-announcements-BH21-Jvb.jpg";
function AnnouncementsPage() {
  const {
    user,
    role,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [classLevels, setClassLevels] = reactExports.useState([]);
  const [history, setHistory] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [sending, setSending] = reactExports.useState(false);
  const [audience, setAudience] = reactExports.useState("learners");
  const [form, setForm] = reactExports.useState({
    class_level: "",
    title: "",
    message: ""
  });
  const [recipientCount, setRecipientCount] = reactExports.useState(null);
  const [open, setOpen] = reactExports.useState(false);
  const [schedule, setSchedule] = reactExports.useState(false);
  const [sendAt, setSendAt] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
  }, [authLoading, user, nav]);
  const isStaff = role === "teacher" || role === "admin";
  reactExports.useEffect(() => {
    if (!authLoading && user && !isStaff) nav({
      to: "/dashboard"
    });
  }, [authLoading, user, isStaff, nav]);
  const load = async () => {
    if (!user || !isStaff) return;
    setLoading(true);
    const [classes, hist] = await Promise.all([supabase.rpc("list_learner_classes"), supabase.from("scheduled_announcements").select("id, title, message, class_level, send_at, sent_at, status, recipient_count, sender_id, audience").order("send_at", {
      ascending: false
    }).limit(100)]);
    if (classes.error) {
      toast.error(classes.error.message);
      setClassLevels([]);
      setLoading(false);
      return;
    }
    const rows = classes.data ?? [];
    const levels = rows.map((r) => r.class_level);
    setClassLevels(levels);
    if (!form.class_level && levels.length) setForm((f) => ({
      ...f,
      class_level: levels[0]
    }));
    window.__classCounts = Object.fromEntries(rows.map((r) => [r.class_level, Number(r.learner_count)]));
    if (!hist.error) setHistory(hist.data ?? []);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, [user, role]);
  reactExports.useEffect(() => {
    if (!form.class_level) {
      setRecipientCount(null);
      return;
    }
    const counts = window.__classCounts;
    setRecipientCount(counts?.[form.class_level] ?? null);
  }, [form.class_level, classLevels]);
  const send = async () => {
    if (audience === "learners" && !form.class_level) {
      toast.error("Select a class");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Title required");
      return;
    }
    if (form.title.length > 150) {
      toast.error("Title too long (max 150)");
      return;
    }
    if (form.message.length > 2e3) {
      toast.error("Message too long (max 2000)");
      return;
    }
    if (audience === "teachers") {
      if (schedule) {
        toast.error("Scheduling is only available for learner announcements");
        return;
      }
      setSending(true);
      const {
        data,
        error
      } = await supabase.rpc("send_teacher_announcement", {
        p_class_level: form.class_level || "",
        p_title: form.title.trim(),
        p_message: form.message.trim() || ""
      });
      setSending(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      const count = Number(data ?? 0);
      if (count === 0) {
        toast.error(form.class_level ? "No teachers found for that class" : "No teachers found");
        return;
      }
      toast.success(`Announcement sent to ${count} teacher${count === 1 ? "" : "s"}`);
    } else if (schedule) {
      if (!sendAt) {
        toast.error("Pick a date and time");
        return;
      }
      const when = new Date(sendAt);
      if (isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        toast.error("Scheduled time must be in the future");
        return;
      }
      setSending(true);
      const {
        error
      } = await supabase.rpc("schedule_class_announcement", {
        p_class_level: form.class_level,
        p_title: form.title.trim(),
        p_message: form.message.trim() || "",
        p_send_at: when.toISOString()
      });
      setSending(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Scheduled for ${when.toLocaleString()}`);
    } else {
      setSending(true);
      const {
        data,
        error
      } = await supabase.rpc("send_class_announcement", {
        p_class_level: form.class_level,
        p_title: form.title.trim(),
        p_message: form.message.trim() || ""
      });
      setSending(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      const count = Number(data ?? 0);
      if (count === 0) {
        toast.error("No learners in that class");
        return;
      }
      toast.success(`Announcement sent to ${count} learner${count === 1 ? "" : "s"}`);
    }
    setForm((f) => ({
      ...f,
      title: "",
      message: ""
    }));
    setSchedule(false);
    setSendAt("");
    setOpen(false);
    load();
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Announcements", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Announcements", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PageHero, { eyebrow: "Broadcast", EyebrowIcon: Megaphone, title: "Announcements", description: "Send a notification to every learner in a class. Messages are stored and appear in their notifications.", backgroundImage: heroAnnouncements }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Messages" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: classLevels.length === 0 ? "No learners with a class level yet — they need to set their class in Settings before you can broadcast." : "Send a message to every learner in a class." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
          "Create new message"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create new message" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Choose who should receive this notification." })
          ] }),
          classLevels.length === 0 && audience === "learners" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-dashed border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground", children: [
            "There are no classes to broadcast to yet. Each learner has to set their ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "class" }),
            " in their profile (Settings) before they can receive announcements."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Audience" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: audience, onValueChange: (v) => setAudience(v), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "learners", children: "Learners in a class" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: "teachers", children: [
                    "Teachers",
                    role === "admin" ? "" : " of a class"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: audience === "teachers" ? "Class (optional — leave blank for all teachers)" : "Class" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.class_level || "__all__", onValueChange: (v) => setForm({
                ...form,
                class_level: v === "__all__" ? "" : v
              }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select class" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  audience === "teachers" && /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__all__", children: "All teachers" }),
                  classLevels.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c))
                ] })
              ] }),
              audience === "learners" && recipientCount !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-1 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3 w-3" }),
                " ",
                recipientCount,
                " learner",
                recipientCount === 1 ? "" : "s",
                " will receive this"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.title, onChange: (e) => setForm({
                ...form,
                title: e.target.value
              }), placeholder: "Important update for tomorrow", maxLength: 150 })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Message" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: form.message, onChange: (e) => setForm({
                ...form,
                message: e.target.value
              }), placeholder: "Write the full message learners will see in their notifications…", rows: 5, maxLength: 2e3 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground text-right", children: [
                form.message.length,
                "/2000"
              ] })
            ] }),
            audience === "learners" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border/60 p-3 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm font-medium cursor-pointer", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: schedule, onChange: (e) => setSchedule(e.target.checked), className: "h-4 w-4 accent-primary" }),
                "Schedule for later"
              ] }),
              schedule && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Send on" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "datetime-local", value: sendAt, onChange: (e) => setSendAt(e.target.value), min: new Date(Date.now() + 6e4).toISOString().slice(0, 16) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Uses your local time zone. The message is delivered automatically within ~1 minute of this time." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setOpen(false), disabled: sending, children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: send, disabled: sending || !form.title.trim() || audience === "learners" && !form.class_level || schedule && !sendAt, children: [
              sending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-2 h-4 w-4" }),
              schedule ? "Schedule announcement" : "Send announcement"
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: "Announcement history" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: role === "admin" ? "All announcements sent or scheduled across the platform." : "Announcements you have sent or scheduled." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-2", children: history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-sm text-muted-foreground", children: "No announcements yet." }) : history.map((r) => {
        const isScheduledFuture = r.status === "pending";
        const displayDate = r.sent_at ?? r.send_at;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 rounded-md border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium truncate", children: r.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: r.audience === "teachers" ? r.class_level ? `Teachers · ${r.class_level}` : "All teachers" : r.class_level ?? "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: r.status === "sent" ? "default" : r.status === "pending" ? "secondary" : "destructive", children: r.status }),
              r.status === "sent" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "· ",
                r.recipient_count,
                " recipient",
                r.recipient_count === 1 ? "" : "s"
              ] })
            ] }),
            r.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground line-clamp-3 mt-1", children: r.message })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground whitespace-nowrap pt-0.5", children: [
            isScheduledFuture ? "Scheduled " : "",
            new Date(displayDate).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short"
            })
          ] })
        ] }, r.id);
      }) })
    ] })
  ] }) });
}
export {
  AnnouncementsPage as component
};
