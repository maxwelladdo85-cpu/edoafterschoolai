import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { C as Card, c as CardHeader, d as CardTitle, b as CardDescription, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { L as Logo, I as Input } from "./Logo-wkBcYT7E.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { T as Tabs, b as TabsList, c as TabsTrigger, a as TabsContent } from "./tabs-CF1iutF8.js";
import { S as Select, e as SelectTrigger, f as SelectValue, a as SelectContent, c as SelectItem } from "./select-DJfolYNu.js";
import { D as Dialog, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./dialog-DJ5dOu41.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { h as useNavigate, L as Link, t as toast } from "./router-BcETnmHN.js";
import { a as EyeOff, E as Eye } from "./eye-CVsFQtZn.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./index-ChW4vIqc.js";
import "./index-x37Yg8v9.js";
import "./types-Ch40mmLW.js";
function PasswordInput({ id, value, onChange, minLength }) {
  const [show, setShow] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id, type: show ? "text" : "password", required: true, minLength, value, onChange: (e) => onChange(e.target.value), className: "pr-10" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => setShow((s) => !s),
        "aria-label": show ? "Hide password" : "Show password",
        className: "absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground",
        children: show ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
      }
    )
  ] });
}
function AuthCard() {
  const nav = useNavigate();
  const [tab, setTab] = reactExports.useState("signin");
  const [loading, setLoading] = reactExports.useState(false);
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [name, setName] = reactExports.useState("");
  const [role, setRole] = reactExports.useState("learner");
  const [forgotOpen, setForgotOpen] = reactExports.useState(false);
  const [forgotEmail, setForgotEmail] = reactExports.useState("");
  const [forgotLoading, setForgotLoading] = reactExports.useState(false);
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Enter your email");
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setForgotLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent. Check your inbox.");
    setForgotOpen(false);
  };
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (signInData.user) {
      const { data: prof } = await supabase.from("profiles").select("status").eq("id", signInData.user.id).maybeSingle();
      if (prof?.status === "pending") {
        await supabase.auth.signOut();
        setLoading(false);
        return toast.error("Your teacher account is still pending admin approval.");
      }
      if (prof?.status === "inactive") {
        await supabase.auth.signOut();
        setLoading(false);
        return toast.error("Your account has been deactivated. Contact an admin.");
      }
    }
    setLoading(false);
    toast.success("Welcome back");
    nav({ to: "/dashboard" });
  };
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: name } }
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (data.user && role === "teacher") {
      await supabase.from("profiles").update({ status: "pending" }).eq("id", data.user.id);
      await supabase.auth.signOut();
      setLoading(false);
      toast.success("Account created. An admin must approve your teacher account before you can sign in.");
      setTab("signin");
      return;
    }
    setLoading(false);
    toast.success("Welcome to Digital Learning at Home");
    nav({ to: "/dashboard" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-gold/10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md shadow-xl border-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "space-y-3 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl", children: "Welcome" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Sign in or create an account to continue" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: tab, onValueChange: (v) => setTab(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "signin", children: "Sign In" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "signup", children: "Sign Up" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "signin", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSignIn, className: "space-y-3 pt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "e1", children: "Email" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "e1", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "p1", children: "Password" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(PasswordInput, { id: "p1", value: password, onChange: setPassword })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Sign in as" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: role, onValueChange: (v) => setRole(v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select your role" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "learner", children: "Learner" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "teacher", children: "Teacher" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "Admin" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: "Sign In" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  },
                  className: "text-xs text-primary hover:underline",
                  children: "Forgot password?"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-center text-sm text-muted-foreground", children: [
              "Don't have an account?",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setTab("signup"), className: "font-medium text-primary hover:underline", children: "Sign up" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "signup", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSignUp, className: "space-y-3 pt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "n2", children: "Full Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "n2", required: true, value: name, onChange: (e) => setName(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "e2", children: "Email" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "e2", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "p2", children: "Password" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(PasswordInput, { id: "p2", value: password, onChange: setPassword, minLength: 6 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "I am a" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: role, onValueChange: (v) => setRole(v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "learner", children: "Learner" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "teacher", children: "Teacher (requires admin approval)" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: "Create account" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-center text-sm text-muted-foreground", children: [
              "Already have an account?",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setTab("signin"), className: "font-medium text-primary hover:underline", children: "Sign in" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 text-center text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "hover:underline", children: "← Back to home" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: forgotOpen, onOpenChange: setForgotOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Reset your password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Enter the email address linked to your account. We'll send you a secure link to set a new password." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleForgot, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "forgot-email", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "forgot-email",
              type: "email",
              required: true,
              value: forgotEmail,
              onChange: (e) => setForgotEmail(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setForgotOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: forgotLoading, children: forgotLoading ? "Sending..." : "Send reset link" })
        ] })
      ] })
    ] }) })
  ] });
}
const SplitComponent = AuthCard;
export {
  SplitComponent as component
};
