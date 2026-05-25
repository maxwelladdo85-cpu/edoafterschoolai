import { a0 as requireReact, Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { u as useAuth, h as useNavigate, t as toast, L as Link } from "./router-BcETnmHN.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { S as SidebarProvider, a as AppSidebar, d as SidebarTrigger, N as NotificationBell } from "./NotificationBell-BKNCo5D8.js";
import { C as Card, a as CardContent, c as CardHeader, d as CardTitle } from "./card-h2noaq3f.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { e as createSlot, a as cn, B as Button } from "./button-DInpa_86.js";
import { u as useCallbackRef, t as useLayoutEffect2 } from "./index-BHnLLcIP.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { S as Select, e as SelectTrigger, f as SelectValue, a as SelectContent, b as SelectGroup, d as SelectLabel, c as SelectItem } from "./select-DJfolYNu.js";
import { C as CLASS_GROUPS } from "./classes-NbqrBCpJ.js";
import { P as PageHero } from "./PageHero-CQ-1rbtd.js";
import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { T as Trash2 } from "./trash-2-Dl1mHj_4.js";
import { M as Mail } from "./mail-HIZEMqWY.js";
import { S as Shield } from "./shield-BXjgj3Bh.js";
import { C as Calendar } from "./calendar-BM_3-7uj.js";
import { F as FileText } from "./file-text-DKVFgU-w.js";
import { C as Cookie } from "./cookie-B-gUVfQa.js";
import { G as GraduationCap, B as BookOpen, U as Users } from "./users-WAU5C3w0.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./sparkles-DBEmDCt9.js";
import "./index-x37Yg8v9.js";
var shim = { exports: {} };
var useSyncExternalStoreShim_production = {};
var hasRequiredUseSyncExternalStoreShim_production;
function requireUseSyncExternalStoreShim_production() {
  if (hasRequiredUseSyncExternalStoreShim_production) return useSyncExternalStoreShim_production;
  hasRequiredUseSyncExternalStoreShim_production = 1;
  var React = requireReact();
  function is(x, y) {
    return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
  }
  var objectIs = "function" === typeof Object.is ? Object.is : is, useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue = React.useDebugValue;
  function useSyncExternalStore$2(subscribe2, getSnapshot) {
    var value = getSnapshot(), _useState = useState({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
    useLayoutEffect(
      function() {
        inst.value = value;
        inst.getSnapshot = getSnapshot;
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      },
      [subscribe2, value, getSnapshot]
    );
    useEffect(
      function() {
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        return subscribe2(function() {
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        });
      },
      [subscribe2]
    );
    useDebugValue(value);
    return value;
  }
  function checkIfSnapshotChanged(inst) {
    var latestGetSnapshot = inst.getSnapshot;
    inst = inst.value;
    try {
      var nextValue = latestGetSnapshot();
      return !objectIs(inst, nextValue);
    } catch (error) {
      return true;
    }
  }
  function useSyncExternalStore$1(subscribe2, getSnapshot) {
    return getSnapshot();
  }
  var shim2 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
  useSyncExternalStoreShim_production.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim2;
  return useSyncExternalStoreShim_production;
}
var hasRequiredShim;
function requireShim() {
  if (hasRequiredShim) return shim.exports;
  hasRequiredShim = 1;
  {
    shim.exports = requireUseSyncExternalStoreShim_production();
  }
  return shim.exports;
}
const __iconNode$1 = [
  [
    "path",
    {
      d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",
      key: "18u6gg"
    }
  ],
  ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
];
const Camera = createLucideIcon("camera", __iconNode$1);
const __iconNode = [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
];
const User = createLucideIcon("user", __iconNode);
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext3(rootComponentName, defaultContext) {
    const BaseContext = reactExports.createContext(defaultContext);
    BaseContext.displayName = rootComponentName + "Context";
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      const { scope, children, ...context } = props;
      const Context = scope?.[scopeName]?.[index] || BaseContext;
      const value = reactExports.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext2(consumerName, scope) {
      const Context = scope?.[scopeName]?.[index] || BaseContext;
      const context = reactExports.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext2];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return reactExports.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = scope?.[scopeName] || scopeContexts;
      return reactExports.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
}
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return reactExports.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}
var NODES = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
];
var Primitive = NODES.reduce((primitive, node) => {
  const Slot = createSlot(`Primitive.${node}`);
  const Node = reactExports.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? Slot : node;
    if (typeof window !== "undefined") {
      window[/* @__PURE__ */ Symbol.for("radix-ui")] = true;
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Comp, { ...primitiveProps, ref: forwardedRef });
  });
  Node.displayName = `Primitive.${node}`;
  return { ...primitive, [node]: Node };
}, {});
var shimExports = requireShim();
function useIsHydrated() {
  return shimExports.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
function subscribe() {
  return () => {
  };
}
var AVATAR_NAME = "Avatar";
var [createAvatarContext] = createContextScope(AVATAR_NAME);
var [AvatarProvider, useAvatarContext] = createAvatarContext(AVATAR_NAME);
var Avatar$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, ...avatarProps } = props;
    const [imageLoadingStatus, setImageLoadingStatus] = reactExports.useState("idle");
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AvatarProvider,
      {
        scope: __scopeAvatar,
        imageLoadingStatus,
        onImageLoadingStatusChange: setImageLoadingStatus,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.span, { ...avatarProps, ref: forwardedRef })
      }
    );
  }
);
Avatar$1.displayName = AVATAR_NAME;
var IMAGE_NAME = "AvatarImage";
var AvatarImage$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, src, onLoadingStatusChange = () => {
    }, ...imageProps } = props;
    const context = useAvatarContext(IMAGE_NAME, __scopeAvatar);
    const imageLoadingStatus = useImageLoadingStatus(src, imageProps);
    const handleLoadingStatusChange = useCallbackRef((status) => {
      onLoadingStatusChange(status);
      context.onImageLoadingStatusChange(status);
    });
    useLayoutEffect2(() => {
      if (imageLoadingStatus !== "idle") {
        handleLoadingStatusChange(imageLoadingStatus);
      }
    }, [imageLoadingStatus, handleLoadingStatusChange]);
    return imageLoadingStatus === "loaded" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.img, { ...imageProps, ref: forwardedRef, src }) : null;
  }
);
AvatarImage$1.displayName = IMAGE_NAME;
var FALLBACK_NAME = "AvatarFallback";
var AvatarFallback$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, delayMs, ...fallbackProps } = props;
    const context = useAvatarContext(FALLBACK_NAME, __scopeAvatar);
    const [canRender, setCanRender] = reactExports.useState(delayMs === void 0);
    reactExports.useEffect(() => {
      if (delayMs !== void 0) {
        const timerId = window.setTimeout(() => setCanRender(true), delayMs);
        return () => window.clearTimeout(timerId);
      }
    }, [delayMs]);
    return canRender && context.imageLoadingStatus !== "loaded" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.span, { ...fallbackProps, ref: forwardedRef }) : null;
  }
);
AvatarFallback$1.displayName = FALLBACK_NAME;
function resolveLoadingStatus(image, src) {
  if (!image) {
    return "idle";
  }
  if (!src) {
    return "error";
  }
  if (image.src !== src) {
    image.src = src;
  }
  return image.complete && image.naturalWidth > 0 ? "loaded" : "loading";
}
function useImageLoadingStatus(src, { referrerPolicy, crossOrigin }) {
  const isHydrated = useIsHydrated();
  const imageRef = reactExports.useRef(null);
  const image = (() => {
    if (!isHydrated) return null;
    if (!imageRef.current) {
      imageRef.current = new window.Image();
    }
    return imageRef.current;
  })();
  const [loadingStatus, setLoadingStatus] = reactExports.useState(
    () => resolveLoadingStatus(image, src)
  );
  useLayoutEffect2(() => {
    setLoadingStatus(resolveLoadingStatus(image, src));
  }, [image, src]);
  useLayoutEffect2(() => {
    const updateStatus = (status) => () => {
      setLoadingStatus(status);
    };
    if (!image) return;
    const handleLoad = updateStatus("loaded");
    const handleError = updateStatus("error");
    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    if (referrerPolicy) {
      image.referrerPolicy = referrerPolicy;
    }
    if (typeof crossOrigin === "string") {
      image.crossOrigin = crossOrigin;
    }
    return () => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
  }, [image, crossOrigin, referrerPolicy]);
  return loadingStatus;
}
var Root = Avatar$1;
var Image = AvatarImage$1;
var Fallback = AvatarFallback$1;
const Avatar = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }
));
Avatar.displayName = Root.displayName;
const AvatarImage = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = Image.displayName;
const AvatarFallback = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Fallback,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = Fallback.displayName;
const EDO_LGAS = [
  "Akoko-Edo",
  "Egor",
  "Esan Central",
  "Esan North-East",
  "Esan South-East",
  "Esan West",
  "Etsako Central",
  "Etsako East",
  "Etsako West",
  "Igueben",
  "Ikpoba-Okha",
  "Oredo",
  "Orhionmwon",
  "Ovia North-East",
  "Ovia South-West",
  "Owan East",
  "Owan West",
  "Uhunmwonde"
];
const heroSettings = "/assets/hero-settings-B0HzxBBX.jpg";
function ClassEditor({
  initial,
  onSave
}) {
  const [val, setVal] = reactExports.useState(initial);
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setVal(initial);
  }, [initial]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-[220px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: val, onValueChange: setVal, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select your class" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CLASS_GROUPS.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectGroup, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectLabel, { children: g.label }),
        g.classes.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c))
      ] }, g.label)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", disabled: saving || val.trim() === initial.trim() || !val, onClick: async () => {
      setSaving(true);
      try {
        await onSave(val.trim());
      } finally {
        setSaving(false);
      }
    }, children: saving ? "Saving…" : "Save" })
  ] });
}
function LgaEditor({
  initial,
  onSave
}) {
  const [val, setVal] = reactExports.useState(initial);
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setVal(initial);
  }, [initial]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-[220px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: val, onValueChange: setVal, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select your local government" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectGroup, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectLabel, { children: "Edo State LGAs" }),
        EDO_LGAS.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: l, children: l }, l))
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", disabled: saving || val.trim() === initial.trim() || !val, onClick: async () => {
      setSaving(true);
      try {
        await onSave(val.trim());
      } finally {
        setSaving(false);
      }
    }, children: saving ? "Saving…" : "Save" })
  ] });
}
function SettingsPage() {
  const {
    user,
    role,
    loading
  } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = reactExports.useState(null);
  const [dob, setDob] = reactExports.useState("");
  const [savingDob, setSavingDob] = reactExports.useState(false);
  const [stats, setStats] = reactExports.useState([]);
  const [uploading, setUploading] = reactExports.useState(false);
  const fileRef = reactExports.useRef(null);
  const [fullName, setFullName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [savingProfile, setSavingProfile] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!loading && !user) nav({
      to: "/login"
    });
  }, [loading, user, nav]);
  reactExports.useEffect(() => {
    const load = async () => {
      if (!user || !role) return;
      const {
        data: p
      } = await supabase.from("profiles").select("full_name,email,created_at,avatar_url,class_level,lga,date_of_birth").eq("id", user.id).maybeSingle();
      setProfile(p);
      setFullName(p?.full_name ?? "");
      setEmail(p?.email ?? user.email ?? "");
      setDob(p?.date_of_birth ?? "");
      if (role === "teacher") {
        const {
          data: cs
        } = await supabase.from("courses").select("id,is_active").eq("teacher_id", user.id);
        const ids = (cs ?? []).map((c) => c.id);
        const active = (cs ?? []).filter((c) => c.is_active).length;
        let enroll = 0;
        if (ids.length) {
          const {
            count
          } = await supabase.from("enrollments").select("id", {
            count: "exact",
            head: true
          }).in("course_id", ids);
          enroll = count ?? 0;
        }
        setStats([{
          label: "Courses created",
          value: cs?.length ?? 0,
          icon: GraduationCap
        }, {
          label: "Active courses",
          value: active,
          icon: BookOpen
        }, {
          label: "Total enrollments",
          value: enroll,
          icon: Users
        }]);
      } else if (role === "learner") {
        const {
          count: enrolled
        } = await supabase.from("enrollments").select("id", {
          count: "exact",
          head: true
        }).eq("learner_id", user.id);
        const {
          count: attempts
        } = await supabase.from("quiz_attempts").select("id", {
          count: "exact",
          head: true
        }).eq("learner_id", user.id);
        setStats([{
          label: "Enrolled courses",
          value: enrolled ?? 0,
          icon: BookOpen
        }, {
          label: "Quiz attempts",
          value: attempts ?? 0,
          icon: GraduationCap
        }]);
      } else if (role === "admin") {
        const [{
          count: users
        }, {
          count: courses
        }] = await Promise.all([supabase.from("profiles").select("id", {
          count: "exact",
          head: true
        }), supabase.from("courses").select("id", {
          count: "exact",
          head: true
        })]);
        setStats([{
          label: "Total users",
          value: users ?? 0,
          icon: Users
        }, {
          label: "Total courses",
          value: courses ?? 0,
          icon: GraduationCap
        }]);
      }
    };
    load();
  }, [user, role]);
  if (loading || !user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Pick an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type,
        upsert: true
      });
      if (upErr) throw upErr;
      const {
        data: pub
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const {
        error: pErr
      } = await supabase.from("profiles").update({
        avatar_url: pub.publicUrl
      }).eq("id", user.id);
      if (pErr) throw pErr;
      setProfile((prev) => prev ? {
        ...prev,
        avatar_url: pub.publicUrl
      } : prev);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const removeAvatar = async () => {
    if (!user) return;
    const {
      error
    } = await supabase.from("profiles").update({
      avatar_url: null
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    setProfile((prev) => prev ? {
      ...prev,
      avatar_url: null
    } : prev);
    toast.success("Profile picture removed");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SidebarProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppSidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-14 items-center gap-2 border-b bg-card px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SidebarTrigger, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationBell, {}) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-1 space-y-8 p-6 md:p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PageHero, { eyebrow: "Account", EyebrowIcon: User, title: "Settings", description: "Your profile, preferences and account stats.", backgroundImage: heroSettings }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/60 overflow-hidden", style: {
          boxShadow: "var(--shadow-card)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-28 w-full", style: {
            backgroundImage: "var(--gradient-hero)"
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-6 -bottom-12 sm:left-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-24 w-24 ring-4 ring-background shadow-lg", children: [
            profile?.avatar_url && /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: profile.avatar_url, alt: displayName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-2xl bg-gold/20 text-gold-foreground", children: initials || "U" })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6 pt-16", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold tracking-tight", children: displayName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Profile picture — JPG/PNG, under 5 MB." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: onPickAvatar }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => fileRef.current?.click(), disabled: uploading, children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
                  "Uploading…"
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "mr-2 h-4 w-4" }),
                  profile?.avatar_url ? "Change picture" : "Upload picture"
                ] }) }),
                profile?.avatar_url && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: removeAvatar, disabled: uploading, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-4 w-4" }),
                  "Remove"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "grid gap-4 sm:grid-cols-2", onSubmit: async (e) => {
              e.preventDefault();
              if (!user) return;
              const trimmedName = fullName.trim();
              const trimmedEmail = email.trim();
              if (!trimmedName) return toast.error("Full name is required");
              if (trimmedName.length > 100) return toast.error("Full name must be under 100 characters");
              const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRe.test(trimmedEmail)) return toast.error("Enter a valid email address");
              setSavingProfile(true);
              try {
                const nameChanged = trimmedName !== (profile?.full_name ?? "");
                const emailChanged = trimmedEmail.toLowerCase() !== (profile?.email ?? user.email ?? "").toLowerCase();
                if (nameChanged) {
                  const {
                    error
                  } = await supabase.from("profiles").update({
                    full_name: trimmedName
                  }).eq("id", user.id);
                  if (error) throw error;
                }
                if (emailChanged) {
                  const {
                    error: authErr
                  } = await supabase.auth.updateUser({
                    email: trimmedEmail
                  });
                  if (authErr) throw authErr;
                  const {
                    error: pErr
                  } = await supabase.from("profiles").update({
                    email: trimmedEmail
                  }).eq("id", user.id);
                  if (pErr) throw pErr;
                  toast.success("Profile saved — check your inbox to confirm the new email");
                } else if (nameChanged) {
                  toast.success("Profile saved");
                } else {
                  toast.message("No changes to save");
                }
                setProfile((prev) => prev ? {
                  ...prev,
                  full_name: trimmedName,
                  email: trimmedEmail
                } : prev);
              } catch (err) {
                toast.error(err.message ?? "Could not save profile");
              } finally {
                setSavingProfile(false);
              }
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 rounded-lg border bg-muted/30 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3.5 w-3.5 text-primary" }),
                  " Full name"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: fullName, onChange: (e) => setFullName(e.target.value), maxLength: 100, placeholder: "Your full name" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 rounded-lg border bg-muted/30 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3.5 w-3.5 text-primary" }),
                  " Email"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), maxLength: 255, placeholder: "you@example.com" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-lg border bg-muted/30 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "mt-1 h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Role" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "capitalize", children: role ?? "—" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-lg border bg-muted/30 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "mt-1 h-4 w-4 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Member since" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:col-span-2 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: savingProfile, children: savingProfile ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
                "Saving…"
              ] }) : "Save changes" }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `border-border/60 ${!profile?.date_of_birth ? "ring-2 ring-gold/60" : ""}`, style: {
          boxShadow: "var(--shadow-card)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-5 w-5 text-primary" }),
            " Date of Birth"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: profile?.date_of_birth ? "Update your date of birth below — we'll send you a birthday message every year on this day." : "Please add your date of birth so we can send you a birthday message every year. 🎂" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "flex flex-wrap items-end gap-2", onSubmit: async (e) => {
              e.preventDefault();
              if (!user) return;
              if (!dob) return toast.error("Please pick a date");
              const d = new Date(dob);
              if (isNaN(d.getTime()) || d > /* @__PURE__ */ new Date()) return toast.error("Enter a valid past date");
              setSavingDob(true);
              const {
                error
              } = await supabase.from("profiles").update({
                date_of_birth: dob
              }).eq("id", user.id);
              setSavingDob(false);
              if (error) return toast.error(error.message);
              setProfile((prev) => prev ? {
                ...prev,
                date_of_birth: dob
              } : prev);
              toast.success("Date of birth saved");
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-[220px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: dob, max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), onChange: (e) => setDob(e.target.value) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", size: "sm", disabled: savingDob || !dob || dob === (profile?.date_of_birth ?? ""), children: savingDob ? "Saving…" : "Save" })
            ] })
          ] })
        ] }),
        role === "learner" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/60", style: {
          boxShadow: "var(--shadow-card)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "My class" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: 'Set your class so teachers can assign courses to you (e.g. "JSS 1", "Primary 4").' }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ClassEditor, { initial: profile?.class_level ?? "", onSave: async (val) => {
              const {
                error
              } = await supabase.from("profiles").update({
                class_level: val || null
              }).eq("id", user.id);
              if (error) {
                toast.error(error.message);
                return;
              }
              setProfile((prev) => prev ? {
                ...prev,
                class_level: val || null
              } : prev);
              toast.success("Class saved");
            } })
          ] })
        ] }),
        (role === "learner" || role === "teacher") && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/60", style: {
          boxShadow: "var(--shadow-card)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Local Government" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Select your Local Government Area in Edo State." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(LgaEditor, { initial: profile?.lga ?? "", onSave: async (val) => {
              const {
                error
              } = await supabase.from("profiles").update({
                lga: val || null
              }).eq("id", user.id);
              if (error) {
                toast.error(error.message);
                return;
              }
              setProfile((prev) => prev ? {
                ...prev,
                lga: val || null
              } : prev);
              toast.success("Local Government saved");
            } })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/60", style: {
          boxShadow: "var(--shadow-card)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5 text-primary" }),
            " Legal"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Review the legal agreements that govern your use of the EdoLearn platform." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/privacy", className: "inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4 text-primary" }),
                " Privacy Policy"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/terms", className: "inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-primary" }),
                " Terms of Service"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cookies", className: "inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Cookie, { className: "h-4 w-4 text-primary" }),
                " Cookie Policy"
              ] })
            ] })
          ] })
        ] }),
        stats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: stats.map((s, i) => {
          const tints = ["from-primary/15 to-primary/5", "from-emerald-500/15 to-emerald-500/5", "from-gold/20 to-gold/5"];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `border-0 bg-gradient-to-br ${tints[i % tints.length]}`, style: {
            boxShadow: "var(--shadow-card)"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: s.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: "h-4 w-4" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl font-bold tracking-tight", children: s.value }) })
          ] }, s.label);
        }) })
      ] })
    ] })
  ] }) });
}
export {
  SettingsPage as component
};
