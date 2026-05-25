import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent } from "./card-h2noaq3f.js";
import { f as format, T as Table, d as TableHeader, e as TableRow, c as TableHead, a as TableBody, b as TableCell, C as CalendarRange, D as Download, S as Search } from "./table-DXDKGnwf.js";
import { B as Button } from "./button-DInpa_86.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { A as Activity, c as ClipboardCheck } from "./NotificationBell-BKNCo5D8.js";
import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
import { U as Users, B as BookOpen } from "./users-WAU5C3w0.js";
import { U as UserPlus } from "./user-plus-C3OLx08z.js";
import { S as Sparkles } from "./sparkles-DBEmDCt9.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./en-US-croqg5Ht.js";
import "./index-BHnLLcIP.js";
const __iconNode$1 = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
];
const RefreshCw = createLucideIcon("refresh-cw", __iconNode$1);
const __iconNode = [
  ["path", { d: "M12 20h.01", key: "zekei9" }],
  ["path", { d: "M2 8.82a15 15 0 0 1 20 0", key: "dnpr2z" }],
  ["path", { d: "M5 12.859a10 10 0 0 1 14 0", key: "1x1e6c" }],
  ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }]
];
const Wifi = createLucideIcon("wifi", __iconNode);
function AdminPerformancePage() {
  const {
    user,
    role,
    loading
  } = useAuth();
  const nav = useNavigate();
  const [perf, setPerf] = reactExports.useState(null);
  const [refreshedAt, setRefreshedAt] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const today = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
  const sevenAgo = format(new Date(Date.now() - 6 * 864e5), "yyyy-MM-dd");
  const [fromDate, setFromDate] = reactExports.useState(sevenAgo);
  const [toDate, setToDate] = reactExports.useState(today);
  const [activity, setActivity] = reactExports.useState([]);
  const [activitySearch, setActivitySearch] = reactExports.useState("");
  const [actionFilter, setActionFilter] = reactExports.useState("");
  const [actLoading, setActLoading] = reactExports.useState(false);
  const [actLoaded, setActLoaded] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!loading && !user) nav({
      to: "/login"
    });
    if (!loading && user && role && role !== "admin") nav({
      to: "/dashboard"
    });
  }, [loading, user, role, nav]);
  const load = async () => {
    setBusy(true);
    const {
      data,
      error
    } = await supabase.rpc("admin_performance_stats");
    setBusy(false);
    if (error) return toast.error(error.message);
    setPerf(data);
    setRefreshedAt(/* @__PURE__ */ new Date());
  };
  const loadActivity = async () => {
    if (!fromDate || !toDate) return toast.error("Pick a date range");
    if (fromDate > toDate) return toast.error("From date must be on or before To date");
    setActLoading(true);
    const fromIso = (/* @__PURE__ */ new Date(`${fromDate}T00:00:00`)).toISOString();
    const toIso = (/* @__PURE__ */ new Date(`${toDate}T23:59:59.999`)).toISOString();
    const {
      data,
      error
    } = await supabase.rpc("admin_activity_log_range", {
      p_from: fromIso,
      p_to: toIso,
      p_limit: 1e4
    });
    setActLoading(false);
    if (error) return toast.error(error.message);
    setActivity(data ?? []);
    setActLoaded(true);
    toast.success(`Loaded ${(data ?? []).length} event(s)`);
  };
  const filteredActivity = reactExports.useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    return activity.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (!q) return true;
      return (r.full_name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q) || (r.detail ?? "").toLowerCase().includes(q) || r.action.toLowerCase().includes(q);
    });
  }, [activity, activitySearch, actionFilter]);
  const actionOptions = reactExports.useMemo(() => Array.from(new Set(activity.map((a) => a.action))).sort(), [activity]);
  const downloadActivity = () => {
    if (filteredActivity.length === 0) return toast.error("No data to download");
    const headers = ["occurred_at", "full_name", "email", "role", "action", "detail"];
    const escape = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...filteredActivity.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filteredActivity.length} event(s)`);
  };
  const setPreset = (days) => {
    setFromDate(format(new Date(Date.now() - (days - 1) * 864e5), "yyyy-MM-dd"));
    setToDate(today);
  };
  reactExports.useEffect(() => {
    if (role === "admin") {
      load();
      const t = setInterval(load, 3e4);
      return () => clearInterval(t);
    }
  }, [role]);
  if (loading || !user || role !== "admin") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Performance", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-6 w-6 text-primary" }),
          " Live performance"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Auto-refreshes every 30 seconds.",
          refreshedAt && ` Last update: ${refreshedAt.toLocaleTimeString()}`
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: load, disabled: busy, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}` }),
        " Refresh"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, {}), label: "Online now (last 5 min)", value: perf?.online_now ?? "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, {}), label: "Active users today", value: perf?.active_today ?? "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, {}), label: "New signups today", value: perf?.new_signups_today ?? "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, {}), label: "Lesson views (last hour)", value: perf?.lesson_views_last_hour ?? "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, {}), label: "AI messages today", value: perf?.ai_messages_today ?? "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, {}), label: "AI messages (last hour)", value: perf?.ai_messages_last_hour ?? "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, {}), label: "Quiz attempts today", value: perf?.quiz_attempts_today ?? "—" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
        " Top AI Tutor users today"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Messages" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: !perf?.top_ai_users_today?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 3, className: "py-8 text-center text-muted-foreground", children: "No AI Tutor usage yet today." }) }) : perf.top_ai_users_today.map((u, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: u.full_name ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: u.email ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right tabular-nums", children: u.message_count })
        ] }, i)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarRange, { className: "h-4 w-4 text-primary" }),
        " Activity by date range"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "from-date", className: "text-xs", children: "From" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "from-date", type: "date", value: fromDate, max: toDate || today, onChange: (e) => setFromDate(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "to-date", className: "text-xs", children: "To" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "to-date", type: "date", value: toDate, min: fromDate, max: today, onChange: (e) => setToDate(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: loadActivity, disabled: actLoading, children: actLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }),
            "Loading…"
          ] }) : "View activity" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: downloadActivity, disabled: filteredActivity.length === 0, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
            " Download CSV"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setPreset(1), children: "Today" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setPreset(7), children: "Last 7 days" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setPreset(30), children: "Last 30 days" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setPreset(90), children: "Last 90 days" })
        ] }),
        actLoaded && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 sm:grid-cols-[1fr_220px] items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Search name, email, action or detail", value: activitySearch, onChange: (e) => setActivitySearch(e.target.value), className: "pl-9" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "h-9 rounded-md border border-input bg-transparent px-3 text-sm", value: actionFilter, onChange: (e) => setActionFilter(e.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All actions" }),
              actionOptions.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: a, children: a }, a))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: filteredActivity.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "event(s) shown ",
              filteredActivity.length !== activity.length && `(of ${activity.length} loaded)`
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border max-h-[480px] overflow-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "When" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "User" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Role" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Action" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Detail" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filteredActivity.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 5, className: "py-8 text-center text-muted-foreground", children: "No activity in this range." }) }) : filteredActivity.slice(0, 500).map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs whitespace-nowrap", children: new Date(r.occurred_at).toLocaleString() }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: r.full_name ?? "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: r.email ?? "" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: r.role === "admin" ? "destructive" : r.role === "teacher" ? "default" : "secondary", children: r.role }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "whitespace-nowrap text-sm", children: r.action }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs", children: r.detail ?? "—" })
              ] }, i)) })
            ] }),
            filteredActivity.length > 500 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "p-3 text-center text-xs text-muted-foreground border-t", children: [
              "Showing first 500 — download CSV to see all ",
              filteredActivity.length,
              "."
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-muted/40 border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-xs text-muted-foreground space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "About these metrics:" }),
        ' "Online now" counts unique learners who viewed a lesson, sent an AI message, or sent a direct message in the last 5 minutes.'
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "AI Tutor rate limits per learner: 10/minute, 100/hour, 400/day." })
    ] }) })
  ] }) });
}
function Stat({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-0 bg-gradient-to-br from-primary/10 to-primary/5", style: {
    boxShadow: "var(--shadow-card)"
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center gap-4 p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold tracking-tight tabular-nums", children: value })
    ] })
  ] }) });
}
export {
  AdminPerformancePage as component
};
