import { P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { L as Link } from "./router-BcETnmHN.js";
import { B as Button } from "./button-DInpa_86.js";
import { S as Sparkles } from "./sparkles-DBEmDCt9.js";
import { B as BookOpen, G as GraduationCap, U as Users } from "./users-WAU5C3w0.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./client-Ba9waXZY.js";
import "./index-ChW4vIqc.js";
import "./types-Ch40mmLW.js";
import "./createLucideIcon-Dn0WUx8o.js";
const learnersImg = "/assets/learners-DJkMszE2.jpg";
const teachersImg = "/assets/teachers-CF5QWCcW.jpg";
const adminsImg = "/assets/admins-CcC4opaW.jpg";
const heroBg = "/assets/hero-bg-eb7IaEmI.jpg";
function Index() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: heroBg, alt: "An African child learning on a smartphone", width: 1920, height: 1280, className: "absolute inset-0 h-full w-full object-cover" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "mx-auto flex max-w-6xl items-center justify-end px-6 pt-2 pb-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-6xl px-6 pt-0 pb-10 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/20 backdrop-blur px-3 py-1 text-xs font-medium text-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
            " EdoSUBEB · Quality Education For All"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-6 text-6xl font-extrabold tracking-tight md:text-7xl lg:text-8xl", children: [
            "Digital Learning ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "at Home" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-6 max-w-3xl text-xl font-bold text-foreground/90 md:text-2xl", children: "An AI-powered learning management platform for Learners, Teachers and Administrators across Edo State." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex justify-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "lg", children: "Get started" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "lg", variant: "outline", children: "I have an account" }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto -mt-12 max-w-6xl px-6 pb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "grid gap-6 md:grid-cols-3", children: [{
      icon: BookOpen,
      title: "For Learners",
      body: "Track enrolled courses, progress, and notifications in one place.",
      img: learnersImg
    }, {
      icon: GraduationCap,
      title: "For Teachers",
      body: "Create and publish courses for your students with one click.",
      img: teachersImg
    }, {
      icon: Users,
      title: "For Admins",
      body: "Manage users and oversee active courses across the board.",
      img: adminsImg
    }].map((f, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[4/3] w-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: f.img, alt: f.title, width: 1024, height: 768, loading: "lazy", className: "h-full w-full object-cover" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(f.icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-semibold", children: f.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: f.body })
      ] })
    ] }, i)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "mx-auto max-w-6xl px-6 py-10 text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy", className: "underline underline-offset-2 hover:text-foreground transition-colors", children: "Privacy Policy" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "|" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms", className: "underline underline-offset-2 hover:text-foreground transition-colors", children: "Terms of Service" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "|" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/cookies", className: "underline underline-offset-2 hover:text-foreground transition-colors", children: "Cookie Policy" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " Edo State Universal Basic Education Board (SUBEB)"
      ] })
    ] }) })
  ] });
}
export {
  Index as component
};
