import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { h as useNavigate, L as Link, t as toast } from "./router-BcETnmHN.js";
import { C as Card, c as CardHeader, d as CardTitle, b as CardDescription, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { L as Logo, I as Input } from "./Logo-wkBcYT7E.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { a as EyeOff, E as Eye } from "./eye-CVsFQtZn.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./createLucideIcon-Dn0WUx8o.js";
function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = reactExports.useState(false);
  const [password, setPassword] = reactExports.useState("");
  const [confirm, setConfirm] = reactExports.useState("");
  const [show, setShow] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({
      data
    }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    const {
      error
    } = await supabase.auth.updateUser({
      password
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    nav({
      to: "/login"
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-gold/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md shadow-xl border-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "space-y-3 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl", children: "Set a new password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: ready ? "Choose a strong password you haven't used before." : "Verifying your recovery link..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "np", children: "New password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "np", type: show ? "text" : "password", required: true, minLength: 6, value: password, onChange: (e) => setPassword(e.target.value), className: "pr-10", disabled: !ready }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShow((s) => !s), "aria-label": show ? "Hide password" : "Show password", className: "absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground", children: show ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cp", children: "Confirm new password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "cp", type: show ? "text" : "password", required: true, minLength: 6, value: confirm, onChange: (e) => setConfirm(e.target.value), disabled: !ready })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading || !ready, className: "w-full", children: loading ? "Updating..." : "Update password" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 text-center text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "hover:underline", children: "← Back to sign in" }) })
    ] })
  ] }) });
}
export {
  ResetPasswordPage as component
};
