import { Y as reactExports, P as jsxRuntimeExports } from "./server-Cxw6WwHr.js";
import { t as toast, u as useAuth, L as Link, h as useNavigate } from "./router-BcETnmHN.js";
import { W as WandSparkles, S as SidebarProvider, a as AppSidebar, d as SidebarTrigger, N as NotificationBell } from "./NotificationBell-BKNCo5D8.js";
import { s as supabase } from "./client-Ba9waXZY.js";
import { C as Card, a as CardContent } from "./card-h2noaq3f.js";
import { B as Button } from "./button-DInpa_86.js";
import { I as Input } from "./Logo-wkBcYT7E.js";
import { L as Label } from "./label-DZyQQ6B1.js";
import { T as Textarea } from "./textarea-BvkbP7fP.js";
import { B as Badge } from "./badge-B3p-cBAM.js";
import { D as Dialog, f as DialogTrigger, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter } from "./dialog-DJ5dOu41.js";
import { i as dashboardHero, A as AlertDialog, h as AlertDialogTrigger, c as AlertDialogContent, f as AlertDialogHeader, g as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, b as AlertDialogCancel, a as AlertDialogAction } from "./dashboard-hero-DCxEPOj5.js";
import { S as Switch } from "./switch-077_EfQ0.js";
import { S as Select, e as SelectTrigger, f as SelectValue, a as SelectContent, b as SelectGroup, d as SelectLabel, c as SelectItem } from "./select-DJfolYNu.js";
import { C as CLASS_GROUPS } from "./classes-NbqrBCpJ.js";
import { U as UserPlus } from "./user-plus-C3OLx08z.js";
import { L as LoaderCircle } from "./loader-circle-JRLSA8FT.js";
import { U as Upload } from "./upload-vQgmjuK5.js";
import { P as PageHero } from "./PageHero-CQ-1rbtd.js";
import { G as GraduationCap, B as BookOpen } from "./users-WAU5C3w0.js";
import { P as Plus } from "./plus-lxXkFzog.js";
import { P as Pencil } from "./pencil-tZMbOL5s.js";
import { T as Trash2 } from "./trash-2-Dl1mHj_4.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./types-Ch40mmLW.js";
import "./index-ChW4vIqc.js";
import "./index-BHnLLcIP.js";
import "./createLucideIcon-Dn0WUx8o.js";
import "./sparkles-DBEmDCt9.js";
import "./index-x37Yg8v9.js";
function AssignClassButton({ courseId, defaultClass }) {
  const [open, setOpen] = reactExports.useState(false);
  const [cls, setCls] = reactExports.useState(defaultClass ?? "");
  const [busy, setBusy] = reactExports.useState(false);
  const assign = async () => {
    const value = cls.trim();
    if (!value) return toast.error("Enter a class");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("enroll_class_in_course", { p_course_id: courseId, p_class_level: value });
      if (error) throw error;
      const n = data ?? 0;
      toast.success(n === 0 ? `No new students in "${value}" — already enrolled or none found` : `Enrolled ${n} student${n === 1 ? "" : "s"} from ${value}`);
      setOpen(false);
    } catch (err) {
      toast.error(err.message ?? "Failed to assign");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-1 h-3.5 w-3.5" }),
      "Assign to class"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Assign course to a class" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Every learner whose class matches will be enrolled. Already-enrolled students are skipped." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Class" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: cls, onValueChange: setCls, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select class" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CLASS_GROUPS.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectGroup, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectLabel, { children: g.label }),
            g.classes.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c))
          ] }, g.label)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Every learner whose profile class matches will be enrolled." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: assign, disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        "Assigning…"
      ] }) : "Enroll class" }) })
    ] })
  ] });
}
function detectType(file) {
  const m = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  if (m.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(n)) return "video";
  if (m.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(n)) return "audio";
  if (m === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (m.includes("msword") || m.includes("officedocument.wordprocessingml") || /\.(doc|docx)$/.test(n)) return "doc";
  return null;
}
function MaterialUploader({ courseId, onUploaded }) {
  const [open, setOpen] = reactExports.useState(false);
  const [title, setTitle] = reactExports.useState("");
  const [file, setFile] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const reset = () => {
    setTitle("");
    setFile(null);
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Pick a file to upload");
    const type = detectType(file);
    if (!type) return toast.error("Unsupported file. Use video, audio, PDF, or Word doc.");
    if (file.size > 100 * 1024 * 1024) return toast.error("Max file size is 100 MB");
    setBusy(true);
    try {
      let { data: mod } = await supabase.from("modules").select("id").eq("course_id", courseId).eq("title", "Materials").maybeSingle();
      if (!mod) {
        const { data: created, error: mErr } = await supabase.from("modules").insert({ course_id: courseId, title: "Materials", position: 0 }).select("id").single();
        if (mErr) throw mErr;
        mod = created;
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${courseId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("course-materials").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("course-materials").getPublicUrl(path);
      const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", mod.id);
      const { error: lErr } = await supabase.from("lessons").insert({
        module_id: mod.id,
        title: title.trim() || file.name,
        position: count ?? 0,
        content_type: type,
        content_url: pub.publicUrl
      });
      if (lErr) throw lErr;
      toast.success("Material uploaded");
      reset();
      setOpen(false);
      onUploaded?.();
    } catch (err) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: (v) => {
    setOpen(v);
    if (!v) reset();
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "mr-1 h-3.5 w-3.5" }),
      "Upload material"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Upload course material" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Add a video, PDF, Word document, or audio for learners to engage with." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title (optional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Lesson 1 — Introduction", maxLength: 150 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "File" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "file",
              accept: "video/*,audio/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              onChange: (e) => setFile(e.target.files?.[0] ?? null),
              required: true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Supported: MP4, WebM, MP3, WAV, PDF, DOC/DOCX. Max 100 MB." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Uploading…"
        ] }) : "Upload" }) })
      ] })
    ] })
  ] });
}
const emptyForm = { title: "", subject: "", description: "", is_active: true, class_level: "", teacher_name: "" };
function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(emptyForm);
  const [thumbFile, setThumbFile] = reactExports.useState(null);
  const [materialFiles, setMaterialFiles] = reactExports.useState([]);
  const [saving, setSaving] = reactExports.useState(false);
  const [subjectFilter, setSubjectFilter] = reactExports.useState("all");
  const [classFilter, setClassFilter] = reactExports.useState("all");
  const subjectOptions = Array.from(new Set(courses.map((c) => c.subject).filter(Boolean))).sort();
  const classOptions = Array.from(new Set(courses.map((c) => c.class_level).filter(Boolean))).sort();
  const filteredCourses = courses.filter(
    (c) => (subjectFilter === "all" || c.subject === subjectFilter) && (classFilter === "all" || c.class_level === classFilter)
  );
  const detectMaterialType = (file) => {
    const m = file.type.toLowerCase();
    const n = file.name.toLowerCase();
    if (m.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(n)) return "video";
    if (m.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(n)) return "audio";
    if (m === "application/pdf" || n.endsWith(".pdf")) return "pdf";
    if (m.includes("msword") || m.includes("officedocument.wordprocessingml") || /\.(doc|docx)$/.test(n)) return "doc";
    return null;
  };
  const uploadMaterials = async (courseId, files) => {
    let { data: mod } = await supabase.from("modules").select("id").eq("course_id", courseId).eq("title", "Materials").maybeSingle();
    if (!mod) {
      const { data: created, error: mErr } = await supabase.from("modules").insert({ course_id: courseId, title: "Materials", position: 0 }).select("id").single();
      if (mErr) throw mErr;
      mod = created;
    }
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", mod.id);
    let pos = count ?? 0;
    for (const file of files) {
      const type = detectMaterialType(file);
      if (!type) {
        toast.error(`Skipped ${file.name}: unsupported type`);
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`Skipped ${file.name}: over 100 MB`);
        continue;
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${courseId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("course-materials").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        toast.error(`Failed ${file.name}: ${upErr.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("course-materials").getPublicUrl(path);
      await supabase.from("lessons").insert({ module_id: mod.id, title: file.name, position: pos++, content_type: type, content_url: pub.publicUrl });
    }
  };
  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("courses").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false });
    setCourses(data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, [user]);
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setThumbFile(null);
    setMaterialFiles([]);
    setOpen(true);
  };
  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ title: c.title, subject: c.subject ?? "", description: c.description ?? "", is_active: c.is_active, class_level: c.class_level ?? "", teacher_name: c.teacher_name ?? "" });
    setThumbFile(null);
    setMaterialFiles([]);
    setOpen(true);
  };
  const uploadThumb = async (courseId, file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${courseId}/thumb-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("course-materials").upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("course-materials").getPublicUrl(path);
    return pub.publicUrl;
  };
  const save = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (thumbFile && !thumbFile.type.startsWith("image/")) return toast.error("Thumbnail must be an image");
    if (thumbFile && thumbFile.size > 5 * 1024 * 1024) return toast.error("Thumbnail must be under 5 MB");
    setSaving(true);
    try {
      const payload = { title: form.title, subject: form.subject, description: form.description, is_active: form.is_active, class_level: form.class_level || null, teacher_name: form.teacher_name || null };
      let courseId = editingId;
      if (editingId) {
        const { error } = await supabase.from("courses").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("courses").insert({ ...payload, teacher_id: user.id }).select("id").single();
        if (error) throw error;
        courseId = data.id;
      }
      if (thumbFile && courseId) {
        const url = await uploadThumb(courseId, thumbFile);
        const { error: tErr } = await supabase.from("courses").update({ thumbnail_url: url }).eq("id", courseId);
        if (tErr) throw tErr;
      }
      if (materialFiles.length && courseId) {
        await uploadMaterials(courseId, materialFiles);
      }
      toast.success(editingId ? "Course updated" : "Course created");
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setThumbFile(null);
      setMaterialFiles([]);
      load();
    } catch (err) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Course deleted");
    load();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHero,
      {
        eyebrow: "Teacher workspace",
        EyebrowIcon: GraduationCap,
        title: "Teacher Workspace",
        description: "Manage and publish your courses with style.",
        backgroundImage: dashboardHero,
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/courses/builder", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-4 w-4" }),
            " Course Builder"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: (v) => {
            setOpen(v);
            if (!v) {
              setEditingId(null);
              setForm(emptyForm);
            }
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2 bg-gold text-gold-foreground hover:opacity-90", onClick: openCreate, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
              " Quick Create"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingId ? "Edit course" : "New course" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: editingId ? "Update your course details." : "Add a course your learners can enroll in." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: save, className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Title" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Subject" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.subject, onChange: (e) => setForm({ ...form, subject: e.target.value }), placeholder: "Mathematics, English…" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Class" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.class_level, onValueChange: (v) => setForm({ ...form, class_level: v }), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select class" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CLASS_GROUPS.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectGroup, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectLabel, { children: g.label }),
                        g.classes.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c))
                      ] }, g.label)) })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Teacher name" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.teacher_name, onChange: (e) => setForm({ ...form, teacher_name: e.target.value }), placeholder: "Mr. / Mrs. / Ms. / Miss Adaeze Okoro", autoCapitalize: "words", autoComplete: "name", spellCheck: false, maxLength: 100 })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Description" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Thumbnail image" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setThumbFile(e.target.files?.[0] ?? null) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                    "Shown as the card background. JPG/PNG, under 5 MB.",
                    editingId ? " Leave empty to keep the current image." : ""
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Course materials" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: "file",
                      multiple: true,
                      accept: "video/*,audio/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      onChange: (e) => setMaterialFiles(Array.from(e.target.files ?? []))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Optional. Upload videos, audio, PDFs, or Word docs (max 100 MB each). You can add more later." }),
                  materialFiles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 list-disc pl-5 text-xs text-muted-foreground", children: materialFiles.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: f.name }, f.name)) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-md border px-3 py-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Active" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Visible to learners in the Course Library" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: form.is_active, onCheckedChange: (v) => setForm({ ...form, is_active: v }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: saving, children: editingId ? "Save changes" : "Publish" }) })
              ] })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold", children: "Courses" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: subjectFilter, onValueChange: setSubjectFilter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Subject" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All subjects" }),
              subjectOptions.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s, children: s }, s))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: classFilter, onValueChange: setClassFilter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Class" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All classes" }),
              classOptions.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s, children: s }, s))
            ] })
          ] }),
          (subjectFilter !== "all" || classFilter !== "all") && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
            setSubjectFilter("all");
            setClassFilter("all");
          }, children: "Clear" })
        ] })
      ] }),
      courses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col items-center gap-3 py-12 text-center text-base text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: 'No courses yet — click "Create New Course" to get started.' })
      ] }) }) : filteredCourses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-12 text-center text-base text-muted-foreground", children: "No courses match the selected filters." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: filteredCourses.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden flex flex-col border-border/60 transition-all hover:-translate-y-0.5", style: { boxShadow: "var(--shadow-card)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "relative aspect-[16/9] w-full bg-muted",
            style: c.thumbnail_url ? { backgroundImage: `url(${c.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" } : void 0,
            children: [
              !c.thumbnail_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-gold/20 to-accent/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10 text-primary/60" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "absolute right-2 top-2", variant: c.is_active ? "default" : "secondary", children: c.is_active ? "Active" : "Draft" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold leading-tight text-white drop-shadow", children: c.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/85", children: [c.subject, c.class_level].filter(Boolean).join(" · ") })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          c.teacher_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base font-medium text-foreground", children: [
            "Teacher: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-normal", children: c.teacher_name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base text-muted-foreground line-clamp-3", children: c.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MaterialUploader, { courseId: c.id }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AssignClassButton, { courseId: c.id, defaultClass: c.class_level }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/courses/builder", search: { id: c.id }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "mr-1 h-3.5 w-3.5" }),
              "Builder"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => openEdit(c), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1 h-3.5 w-3.5" }),
              "Edit"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "destructive", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1 h-3.5 w-3.5" }),
                "Delete"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { children: [
                    'Delete "',
                    c.title,
                    '"?'
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "This will permanently remove the course and all its modules, lessons, quizzes, and enrollments." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => remove(c.id), children: "Delete" })
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }, c.id)) })
    ] })
  ] });
}
function MyCoursesPage() {
  const {
    user,
    role,
    loading
  } = useAuth();
  const nav = useNavigate();
  reactExports.useEffect(() => {
    if (!loading && !user) nav({
      to: "/login"
    });
    else if (!loading && user && role && role !== "teacher" && role !== "admin") nav({
      to: "/dashboard"
    });
  }, [loading, user, role, nav]);
  if (loading || !user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SidebarProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppSidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-14 items-center gap-2 border-b bg-card px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SidebarTrigger, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "My Courses" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationBell, {}) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 p-6 md:p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TeacherDashboard, {}) })
    ] })
  ] }) });
}
export {
  MyCoursesPage as component
};
