import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { a as cn } from "./button-DInpa_86.js";
const Input = reactExports.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const logo = "/assets/edo-subeb-logo-BjW-V6V8.png";
function Logo({ className = "", showText = true }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "Edo SUBEB logo", width: 44, height: 44, loading: "eager", decoding: "async", className: "h-11 w-11 object-contain" }),
    showText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-tight", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-extrabold tracking-tight", children: "Digital Learning at Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider opacity-70", children: "SUBEB · Quality Education For All" })
    ] })
  ] });
}
export {
  Input as I,
  Logo as L
};
