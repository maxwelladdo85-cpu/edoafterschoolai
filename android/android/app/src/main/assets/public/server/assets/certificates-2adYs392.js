import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, L as Link } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { D as DashboardShell } from "./DashboardShell-BeDwxGst.js";
import { C as Card, a as CardContent } from "./card-h2noaq3f.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { b as Award } from "./NotificationBell-BKNCo5D8.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./button-DInpa_86.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./Logo-wkBcYT7E.js";
import "./index-BHnLLcIP.js";
import "./users-WAU5C3w0.js";
import "./sparkles-DBEmDCt9.js";
import "./badge-B3p-cBAM.js";
function CertificatesPage() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const nav = useNavigate();
  const [certs, setCerts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
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
      } = await supabase.from("certificates").select("*").eq("learner_id", user.id).order("issued_at", {
        ascending: false
      });
      setCerts(data ?? []);
      setLoading(false);
    })();
  }, [user]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { title: "Certificates", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-center py-10 text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
    " Loading…"
  ] }) : certs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-12 text-center text-muted-foreground", children: "Complete a course to earn your first certificate." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2", children: certs.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden border-2 border-primary/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center space-y-3 bg-gradient-to-br from-primary/5 to-accent/5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "mx-auto h-12 w-12 text-primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Certificate of Completion" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold", children: c.learner_name }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "has successfully completed" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-semibold text-primary", children: c.course_name }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
      "Issued ",
      new Date(c.issued_at).toLocaleDateString()
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-mono text-muted-foreground", children: [
      "ID: ",
      c.certificate_code
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses/$courseId", params: {
      courseId: c.course_id
    }, className: "text-xs text-primary hover:underline", children: "View course →" })
  ] }) }, c.id)) }) });
}
export {
  CertificatesPage as component
};
