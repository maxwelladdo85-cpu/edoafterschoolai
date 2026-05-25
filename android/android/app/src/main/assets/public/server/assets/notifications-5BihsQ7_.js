import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { B as Bell, C as CheckCheck } from "./NotificationBell-BKNCo5D8.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./Logo-wkBcYT7E.js";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./users-WAU5C3w0.js";
import "./sparkles-DBEmDCt9.js";
function NotificationsPage() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (!authLoading && !user) nav({
      to: "/login"
    });
  }, [authLoading, user, nav]);
  const load = async () => {
    if (!user) return;
    setLoading(true);
    const {
      data
    } = await supabase.from("notifications").select("id,title,message,is_read,created_at").eq("user_id", user.id).order("created_at", {
      ascending: false
    });
    setItems(data ?? []);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`notif-page:${user.id}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${user.id}`
    }, () => load()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);
  const unread = items.filter((n) => !n.is_read).length;
  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({
      is_read: true
    }).eq("user_id", user.id).eq("is_read", false);
    setItems((prev) => prev.map((n) => ({
      ...n,
      is_read: true
    })));
  };
  const markOne = async (id) => {
    if (!user) return;
    await supabase.from("notifications").update({
      is_read: true
    }).eq("id", id).eq("user_id", user.id);
    setItems((prev) => prev.map((n) => n.id === id ? {
      ...n,
      is_read: true
    } : n));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Notifications", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-6 w-6 text-primary" }),
          " Notifications"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: unread > 0 ? `${unread} unread` : "You're all caught up" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: markAllRead, disabled: unread === 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "mr-1 h-4 w-4" }),
        " Mark all read"
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-20 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin" }),
      " Loading…"
    ] }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center gap-2 py-16 text-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-10 w-10 opacity-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No notifications yet." })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y", children: items.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { onClick: () => !n.is_read && markOne(n.id), className: `flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-muted/40 ${!n.is_read ? "bg-primary/5" : ""}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.is_read ? "bg-muted" : "bg-primary"}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium leading-tight", children: n.title }),
          !n.is_read && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "shrink-0 text-[10px]", children: "New" })
        ] }),
        n.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground whitespace-pre-wrap", children: n.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs text-muted-foreground", children: new Date(n.created_at).toLocaleString() })
      ] })
    ] }, n.id)) }) }) })
  ] }) });
}
export {
  NotificationsPage as component
};
