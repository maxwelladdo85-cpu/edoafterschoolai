import { P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { S as SidebarProvider, a as AppSidebar, d as SidebarTrigger, N as NotificationBell } from "./NotificationBell-BKNCo5D8.js";
function DashboardShell({ title, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SidebarProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppSidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-14 items-center gap-2 border-b bg-card px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SidebarTrigger, {}),
        title && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationBell, {}) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden", children })
    ] })
  ] }) });
}
export {
  DashboardShell as D
};
