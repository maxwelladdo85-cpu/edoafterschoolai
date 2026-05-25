import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, t as toast, c as Route, h as useNavigate, L as Link } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { P as Progress } from "./progress-B3TAVT7s.js";
import { T as Textarea } from "./textarea-BvkbP7fP.js";
import { S as Sparkles } from "./sparkles-DBEmDCt9.js";
import { T as Trash2 } from "./trash-2-Dl1mHj_4.js";
import { X } from "./index-BHnLLcIP.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { S as Send } from "./send-DUaj7YoT.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
import { f as formatDistanceToNow } from "./formatDistanceToNow-B0t3DzUy.js";
import { F as Film, H as Headphones, N as NotebookPen, C as ChevronLeft, a as ChevronRight } from "./notebook-pen-CbtRftX4.js";
import { F as FileText } from "./file-text-DKVFgU-w.js";
import { C as CircleCheck } from "./circle-check-CLUGLzcT.js";
import { C as CirclePlay } from "./circle-play-C_7qxHed.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./NotificationBell-BKNCo5D8.js";
import "./users-WAU5C3w0.js";
import "./en-US-croqg5Ht.js";
const __iconNode$2 = [["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]];
const Circle = createLucideIcon("circle", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
      key: "18887p"
    }
  ]
];
const MessageSquare = createLucideIcon("message-square", __iconNode$1);
const __iconNode = [
  ["path", { d: "M20 18v-2a4 4 0 0 0-4-4H4", key: "5vmcpk" }],
  ["path", { d: "m9 17-5-5 5-5", key: "nvlc11" }]
];
const Reply = createLucideIcon("reply", __iconNode);
function AiTutorWidget({ courseId, courseTitle }) {
  const { user } = useAuth();
  const [open, setOpen] = reactExports.useState(false);
  const [messages, setMessages] = reactExports.useState([]);
  const [input, setInput] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [loadingHistory, setLoadingHistory] = reactExports.useState(false);
  const scrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!open || !user) return;
    setLoadingHistory(true);
    supabase.from("tutor_messages").select("role, content, created_at").eq("learner_id", user.id).eq("course_id", courseId).order("created_at", { ascending: true }).limit(50).then(({ data }) => {
      setMessages((data ?? []).map((m) => ({ role: m.role, content: m.content })));
      setLoadingHistory(false);
    });
  }, [open, user, courseId]);
  reactExports.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);
  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const resp = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ courseId, message: text })
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Too many requests. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Tutor is unavailable right now.");
        setMessages((m) => m.slice(0, -1));
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { role: "assistant", content: assistant };
                return next;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      toast.error(e.message ?? "Tutor failed");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setSending(false);
    }
  };
  const clearHistory = async () => {
    if (!user) return;
    if (!confirm("Clear all tutor messages for this course?")) return;
    await supabase.from("tutor_messages").delete().eq("learner_id", user.id).eq("course_id", courseId);
    setMessages([]);
  };
  if (!user) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    !open && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setOpen(true),
        className: "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105",
        "aria-label": "Open AI Tutor",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "AI Tutor" })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[85vh] w-[380px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold leading-tight", children: "AI Tutor" }),
            courseTitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] opacity-80 line-clamp-1", children: courseTitle })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: clearHistory,
              className: "rounded p-1 hover:bg-white/10",
              "aria-label": "Clear history",
              title: "Clear history",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), className: "rounded p-1 hover:bg-white/10", "aria-label": "Close", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef, className: "flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4", children: loadingHistory ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-8 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) : messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground", children: "Ask anything about this course — concepts, summaries, practice questions, or study plans." }) : messages.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `flex ${m.role === "user" ? "justify-end" : "justify-start"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-background"}`,
              children: m.content || /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" })
            }
          )
        },
        i
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t bg-background p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: input,
            onChange: (e) => setInput(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            },
            placeholder: "Ask your tutor…",
            rows: 1,
            className: "min-h-[40px] resize-none",
            disabled: sending
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", onClick: send, disabled: sending || !input.trim(), children: sending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
      ] }) })
    ] })
  ] });
}
function CourseForum({ courseId }) {
  const { user } = useAuth();
  const [posts, setPosts] = reactExports.useState([]);
  const [authors, setAuthors] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  const [title, setTitle] = reactExports.useState("");
  const [body, setBody] = reactExports.useState("");
  const [posting, setPosting] = reactExports.useState(false);
  const [replyTo, setReplyTo] = reactExports.useState(null);
  const [replyBody, setReplyBody] = reactExports.useState("");
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("forum_posts").select("*").eq("course_id", courseId).order("created_at", { ascending: true });
    const list = data ?? [];
    setPosts(list);
    const ids = Array.from(new Set(list.map((p) => p.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map = {};
      (profs ?? []).forEach((p) => map[p.id] = p);
      setAuthors(map);
    }
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, [courseId]);
  const submit = async () => {
    if (!user || !body.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("forum_posts").insert({
      course_id: courseId,
      author_id: user.id,
      parent_id: null,
      title: title.trim() || null,
      body: body.trim()
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setTitle("");
    setBody("");
    toast.success("Question posted");
    load();
  };
  const submitReply = async (parentId) => {
    if (!user || !replyBody.trim()) return;
    const { error } = await supabase.from("forum_posts").insert({
      course_id: courseId,
      author_id: user.id,
      parent_id: parentId,
      body: replyBody.trim()
    });
    if (error) return toast.error(error.message);
    setReplyTo(null);
    setReplyBody("");
    load();
  };
  const remove = async (id) => {
    const { error } = await supabase.from("forum_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  const threads = posts.filter((p) => !p.parent_id);
  const repliesFor = (id) => posts.filter((p) => p.parent_id === id);
  const authorLabel = (id) => authors[id]?.full_name || authors[id]?.email || "User";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-5 w-5" }),
      " Discussion Forum"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-lg border bg-muted/30 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Title (optional)", value: title, onChange: (e) => setTitle(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Ask a question or share something with the class…", value: body, onChange: (e) => setBody(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: submit, disabled: posting || !body.trim(), children: [
          posting && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          " Post"
        ] }) })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-center py-8 text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        " Loading…"
      ] }) : threads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-muted-foreground py-6", children: "No discussions yet. Be the first to post." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: threads.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-lg border p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            t.title && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: t.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              authorLabel(t.author_id),
              " · ",
              formatDistanceToNow(new Date(t.created_at), { addSuffix: true })
            ] })
          ] }),
          user?.id === t.author_id && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => remove(t.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm", children: t.body }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2 border-l-2 pl-3", children: [
          repliesFor(t.id).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "mr-1", children: authorLabel(r.author_id) }),
              formatDistanceToNow(new Date(r.created_at), { addSuffix: true })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: r.body })
          ] }, r.id)),
          replyTo === t.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Write a reply…", value: replyBody, onChange: (e) => setReplyBody(e.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
                setReplyTo(null);
                setReplyBody("");
              }, children: "Cancel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => submitReply(t.id), disabled: !replyBody.trim(), children: "Reply" })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: () => setReplyTo(t.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Reply, { className: "mr-1 h-3 w-3" }),
            " Reply"
          ] })
        ] })
      ] }, t.id)) })
    ] })
  ] });
}
function CoursePlayer() {
  const {
    courseId
  } = Route.useParams();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [course, setCourse] = reactExports.useState(null);
  const [modules, setModules] = reactExports.useState([]);
  const [activeId, setActiveId] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [completed, setCompleted] = reactExports.useState(/* @__PURE__ */ new Set());
  const [savingComplete, setSavingComplete] = reactExports.useState(false);
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
        data: c
      } = await supabase.from("courses").select("id, title, subject, description").eq("id", courseId).maybeSingle();
      if (!c) {
        setLoading(false);
        return;
      }
      setCourse(c);
      const {
        data: ms
      } = await supabase.from("modules").select("id, title, position").eq("course_id", courseId).order("position", {
        ascending: true
      });
      const moduleIds = (ms ?? []).map((m) => m.id);
      let lessons = [];
      if (moduleIds.length) {
        const {
          data: ls
        } = await supabase.from("lessons").select("*").in("module_id", moduleIds).order("position", {
          ascending: true
        });
        lessons = ls ?? [];
      }
      const mods = (ms ?? []).map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.module_id === m.id)
      }));
      setModules(mods);
      setActiveId(mods.flatMap((m) => m.lessons)[0]?.id ?? null);
      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length) {
        const {
          data: comps
        } = await supabase.from("lesson_completions").select("lesson_id").eq("learner_id", user.id).in("lesson_id", lessonIds);
        setCompleted(new Set((comps ?? []).map((c2) => c2.lesson_id)));
      } else {
        setCompleted(/* @__PURE__ */ new Set());
      }
      setLoading(false);
    })();
  }, [courseId, user]);
  reactExports.useEffect(() => {
    if (!user || !activeId) return;
    supabase.from("lesson_views").insert({
      learner_id: user.id,
      lesson_id: activeId
    }).then(() => {
    });
  }, [user, activeId]);
  const flatLessons = reactExports.useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const activeLesson = flatLessons.find((l) => l.id === activeId) ?? null;
  const activeIdx = flatLessons.findIndex((l) => l.id === activeId);
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter((l) => completed.has(l.id)).length;
  const progressPct = totalLessons === 0 ? 0 : Math.round(completedCount / totalLessons * 100);
  const isActiveCompleted = activeLesson ? completed.has(activeLesson.id) : false;
  const syncEnrollmentProgress = async (next) => {
    if (!user || totalLessons === 0) return;
    const pct = Math.round(Array.from(next).filter((id) => flatLessons.some((l) => l.id === id)).length / totalLessons * 100);
    await supabase.from("enrollments").update({
      progress: pct
    }).eq("learner_id", user.id).eq("course_id", courseId);
  };
  const toggleComplete = async () => {
    if (!user || !activeLesson || savingComplete) return;
    setSavingComplete(true);
    const next = new Set(completed);
    try {
      if (next.has(activeLesson.id)) {
        const {
          error
        } = await supabase.from("lesson_completions").delete().eq("learner_id", user.id).eq("lesson_id", activeLesson.id);
        if (error) throw error;
        next.delete(activeLesson.id);
        toast.message("Lesson marked incomplete");
      } else {
        const {
          error
        } = await supabase.from("lesson_completions").insert({
          learner_id: user.id,
          lesson_id: activeLesson.id
        });
        if (error) throw error;
        next.add(activeLesson.id);
        toast.success("Lesson completed");
      }
      setCompleted(next);
      await syncEnrollmentProgress(next);
    } catch (err) {
      toast.error(err.message ?? "Could not save completion");
    } finally {
      setSavingComplete(false);
    }
  };
  const goTo = (idx) => {
    const target = flatLessons[idx];
    if (!target) return;
    setActiveId(target.id);
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Course", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-20 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin" }),
      " Loading course…"
    ] }) });
  }
  if (!course) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Course", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-muted-foreground", children: "Course not found or not available." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses", children: "Back to library" }) })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DashboardShell, { title: course.title, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[280px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: course.title }),
          course.subject && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: course.subject })
        ] }),
        totalLessons > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 rounded-lg border bg-muted/30 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Course progress" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              completedCount,
              "/",
              totalLessons,
              " · ",
              progressPct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progressPct, className: "h-2" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/quizzes/$courseId", params: {
          courseId
        }, children: "Quizzes & assessments" }) }),
        modules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-6 text-sm text-muted-foreground text-center", children: "No modules yet. Check back soon." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: modules.map((m, mi) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              "Module ",
              mi + 1,
              "."
            ] }),
            " ",
            m.title
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-2 pt-0", children: m.lessons.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-2 py-2 text-xs text-muted-foreground", children: "No lessons" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", children: m.lessons.map((l) => {
            const Icon = l.content_type === "video" ? Film : l.content_type === "pdf" ? FileText : l.content_type === "audio" ? Headphones : NotebookPen;
            const isActive = l.id === activeId;
            const isDone = completed.has(l.id);
            return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveId(l.id), className: `flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: [
              isDone ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: `h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-emerald-600"}` }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `line-clamp-2 flex-1 ${isDone && !isActive ? "text-muted-foreground line-through" : ""}`, children: l.title })
            ] }) }, l.id);
          }) }) })
        ] }, m.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { children: activeLesson ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "mb-2 capitalize", children: activeLesson.content_type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: activeLesson.title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "outline", disabled: activeIdx <= 0, onClick: () => goTo(activeIdx - 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "outline", disabled: activeIdx >= flatLessons.length - 1, onClick: () => goTo(activeIdx + 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LessonContent, { lesson: activeLesson }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Lesson ",
              activeIdx + 1,
              " of ",
              totalLessons
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: isActiveCompleted ? "outline" : "default", onClick: toggleComplete, disabled: savingComplete, children: isActiveCompleted ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mr-2 h-4 w-4 text-emerald-600" }),
                " Completed — undo"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "mr-2 h-4 w-4" }),
                " Mark as complete"
              ] }) }),
              activeIdx < flatLessons.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "secondary", onClick: () => goTo(activeIdx + 1), children: [
                "Next lesson ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
              ] })
            ] })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center gap-3 py-20 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { className: "h-10 w-10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Select a lesson to begin." })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CourseForum, { courseId }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AiTutorWidget, { courseId, courseTitle: course.title })
  ] });
}
function LessonContent({
  lesson
}) {
  const downloadBtn = lesson.content_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: lesson.content_url, download: true, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted", children: "⬇ Download" }) : null;
  if (lesson.content_type === "video") {
    const url = lesson.content_url ?? "";
    const yt = toYouTubeEmbed(url);
    if (yt) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video w-full overflow-hidden rounded-lg bg-black", children: /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { src: yt, title: lesson.title, className: "h-full w-full", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true }) }),
        downloadBtn
      ] });
    }
    if (url) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: url, controls: true, className: "aspect-video w-full rounded-lg bg-black" }),
        downloadBtn
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyMedia, { label: "No video URL" });
  }
  if (lesson.content_type === "pdf") {
    if (!lesson.content_url) return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyMedia, { label: "No PDF URL" });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { src: lesson.content_url, title: lesson.title, className: "h-[70vh] w-full rounded-lg border" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: lesson.content_url, target: "_blank", rel: "noreferrer", className: "text-sm text-primary hover:underline", children: "Open PDF in new tab ↗" }),
        downloadBtn
      ] })
    ] });
  }
  if (lesson.content_type === "audio") {
    if (!lesson.content_url) return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyMedia, { label: "No audio URL" });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { src: lesson.content_url, controls: true, className: "w-full" }),
      downloadBtn
    ] });
  }
  if (lesson.content_type === "doc") {
    if (!lesson.content_url) return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyMedia, { label: "No document" });
    const office = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.content_url)}`;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { src: office, title: lesson.title, className: "h-[70vh] w-full rounded-lg border" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: lesson.content_url, target: "_blank", rel: "noreferrer", className: "text-sm text-primary hover:underline", children: "Open document in new tab ↗" }),
        downloadBtn
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("article", { className: "prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground", children: lesson.content_text || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "No notes for this lesson." }) });
}
function EmptyMedia({
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground", children: label });
}
function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
  }
  return null;
}
export {
  CoursePlayer as component
};
