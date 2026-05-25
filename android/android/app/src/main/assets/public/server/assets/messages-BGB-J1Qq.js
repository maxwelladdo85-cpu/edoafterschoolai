import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, t as toast } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { T as Textarea } from "./textarea-BvkbP7fP.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
import { f as formatDistanceToNow } from "./formatDistanceToNow-B0t3DzUy.js";
import { S as Send } from "./send-DUaj7YoT.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./NotificationBell-BKNCo5D8.js";
import "./Logo-wkBcYT7E.js";
import "./index-BHnLLcIP.js";
import "./users-WAU5C3w0.js";
import "./sparkles-DBEmDCt9.js";
import "./en-US-croqg5Ht.js";
const __iconNode = [
  ["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12", key: "o97t9d" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ]
];
const Inbox = createLucideIcon("inbox", __iconNode);
function MessagesPage() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [contacts, setContacts] = reactExports.useState([]);
  const [active, setActive] = reactExports.useState(null);
  const [messages, setMessages] = reactExports.useState([]);
  const [body, setBody] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  const endRef = reactExports.useRef(null);
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
        data
      } = await supabase.rpc("list_my_message_contacts");
      const list = data ?? [];
      setContacts(list);
      if (list.length && !active) setActive(list[0].user_id);
      setLoading(false);
    })();
  }, [user]);
  const loadThread = async (other) => {
    if (!user) return;
    const {
      data
    } = await supabase.from("direct_messages").select("*").or(`and(sender_id.eq.${user.id},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${user.id})`).order("created_at", {
      ascending: true
    });
    setMessages(data ?? []);
    await supabase.from("direct_messages").update({
      read_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("recipient_id", user.id).eq("sender_id", other).is("read_at", null);
  };
  reactExports.useEffect(() => {
    if (active) loadThread(active);
  }, [active, user]);
  reactExports.useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("dm-realtime").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "direct_messages"
    }, (payload) => {
      const m = payload.new;
      if (m.sender_id === user.id || m.recipient_id === user.id) {
        if (active && (m.sender_id === active || m.recipient_id === active)) {
          setMessages((prev) => [...prev, m]);
        }
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, active]);
  reactExports.useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const send = async () => {
    if (!user || !active || !body.trim()) return;
    setSending(true);
    const {
      error
    } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      recipient_id: active,
      body: body.trim()
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setBody("");
    loadThread(active);
  };
  const activeContact = reactExports.useMemo(() => contacts.find((c) => c.user_id === active), [contacts, active]);
  const label = (c) => c.full_name || c.email || "User";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Messages", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-[280px_1fr] h-[70vh]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0 h-full overflow-y-auto", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-center py-10 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading…"
    ] }) : contacts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "mx-auto mb-2 h-6 w-6" }),
      "No contacts yet. Enroll in a course to message your teacher."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { children: contacts.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActive(c.user_id), className: `flex w-full items-start gap-2 border-b p-3 text-left text-sm hover:bg-muted ${active === c.user_id ? "bg-muted" : ""}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: label(c) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: c.email })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: c.role })
    ] }) }, c.user_id)) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "flex flex-col", children: !activeContact ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "flex-1 flex items-center justify-center text-muted-foreground", children: "Select a conversation" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: label(activeContact) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground capitalize", children: activeContact.role })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-2", children: [
        messages.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-muted-foreground", children: "No messages yet — say hi." }),
        messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${mine ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: m.body }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`, children: formatDistanceToNow(new Date(m.created_at), {
              addSuffix: true
            }) })
          ] }) }, m.id);
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: endRef })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t p-3 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Type a message…", value: body, onChange: (e) => setBody(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }, className: "min-h-[44px] max-h-32" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: send, disabled: sending || !body.trim(), children: sending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
      ] })
    ] }) })
  ] }) });
}
export {
  MessagesPage as component
};
