import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, GripVertical, Plus, Trash2, Upload, Loader2, Check, FileText, Film, Headphones, NotebookPen } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/courses/builder/edit")({
  validateSearch: z.object({ id: z.string().optional() }),
  component: BuilderPage,
});

type ContentType = "video" | "pdf" | "audio" | "text";

interface DraftLesson {
  id: string;
  remoteId?: string;
  title: string;
  content_type: ContentType;
  content_url: string | null;
  content_text: string | null;
  notes: string | null;
  uploadFile?: File | null;
}
interface DraftModule {
  id: string;
  remoteId?: string;
  title: string;
  lessons: DraftLesson[];
}

const tmpId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

const PRIMARY_SUBJECTS: string[] = [
  "English Studies",
  "Mathematics",
  "Basic Science and Technology",
  "Social Studies",
  "Civic Education",
  "Cultural and Creative Arts",
  "Christian Religious Studies",
  "Islamic Religious Studies",
  "Physical and Health Education",
  "Computer Studies / ICT",
  "Agricultural Science",
  "Home Economics",
  "Nigerian Languages (Edo)",
  "French",
  "History",
  "Security Education",
];

function BuilderPage() {
  const { id: editId } = Route.useSearch();
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState<string | null>(editId ?? null);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Step 2
  const [modules, setModules] = useState<DraftModule[]>([]);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
    if (!authLoading && user && role && role !== "teacher" && role !== "admin") {
      toast.error("Only teachers can build courses");
      nav({ to: "/dashboard" });
    }
  }, [authLoading, user, role, nav]);

  useEffect(() => {
    if (!editId || !user) return;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("courses").select("*").eq("id", editId).maybeSingle();
      if (c) {
        setTitle(c.title ?? "");
        setSubject(c.subject ?? "");
        setDescription(c.description ?? "");
        setThumbUrl(c.thumbnail_url ?? null);
        setIsActive(c.is_active);
      }
      const { data: ms } = await supabase.from("modules").select("id,title,position").eq("course_id", editId).order("position");
      const moduleIds = (ms ?? []).map((m: any) => m.id);
      let lessons: any[] = [];
      if (moduleIds.length) {
        const { data: ls } = await supabase.from("lessons").select("*").in("module_id", moduleIds).order("position");
        lessons = ls ?? [];
      }
      setModules((ms ?? []).map((m: any) => ({
        id: tmpId(),
        remoteId: m.id,
        title: m.title,
        lessons: lessons.filter((l) => l.module_id === m.id).map((l) => ({
          id: tmpId(),
          remoteId: l.id,
          title: l.title,
          content_type: (l.content_type === "doc" ? "text" : l.content_type) as ContentType,
          content_url: l.content_url,
          content_text: l.content_text,
          notes: l.notes,
        })),
      })));
      setLoading(false);
    })();
  }, [editId, user]);

  const uploadThumb = async (cid: string, file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${cid}/thumb-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("course-materials").upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    return supabase.storage.from("course-materials").getPublicUrl(path).data.publicUrl;
  };

  const uploadLessonFile = async (cid: string, file: File) => {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${cid}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("course-materials").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return supabase.storage.from("course-materials").getPublicUrl(path).data.publicUrl;
  };

  const saveStep1 = async (): Promise<string | null> => {
    if (!user) return null;
    if (!title.trim()) { toast.error("Title is required"); return null; }
    if (thumbFile && thumbFile.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be under 5 MB"); return null; }
    setSaving(true);
    try {
      let cid = courseId;
      const payload: any = { title: title.trim(), subject: subject || null, description: description || null };
      if (cid) {
        const { error } = await supabase.from("courses").update(payload).eq("id", cid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("courses").insert({ ...payload, teacher_id: user.id, is_active: true }).select("id").single();
        if (error) throw error;
        cid = data.id;
        setCourseId(cid);
      }
      if (thumbFile && cid) {
        const url = await uploadThumb(cid, thumbFile);
        await supabase.from("courses").update({ thumbnail_url: url }).eq("id", cid);
        setThumbUrl(url);
        setThumbFile(null);
      }
      return cid;
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveStep2 = async (): Promise<boolean> => {
    if (!courseId) return false;
    setSaving(true);
    try {
      // Modules
      for (let mi = 0; mi < modules.length; mi++) {
        const m = modules[mi];
        if (m.remoteId) {
          await supabase.from("modules").update({ title: m.title, position: mi }).eq("id", m.remoteId);
        } else {
          const { data, error } = await supabase.from("modules").insert({ course_id: courseId, title: m.title || "Untitled module", position: mi }).select("id").single();
          if (error) throw error;
          m.remoteId = data.id;
        }
        for (let li = 0; li < m.lessons.length; li++) {
          const l = m.lessons[li];
          let content_url = l.content_url;
          if (l.uploadFile) {
            content_url = await uploadLessonFile(courseId, l.uploadFile);
            l.uploadFile = null;
          }
          const lessonPayload: any = {
            title: l.title || "Untitled lesson",
            content_type: l.content_type,
            content_url,
            content_text: l.content_text,
            notes: l.notes,
            position: li,
          };
          if (l.remoteId) {
            await supabase.from("lessons").update(lessonPayload).eq("id", l.remoteId);
          } else {
            const { data, error } = await supabase.from("lessons").insert({ ...lessonPayload, module_id: m.remoteId }).select("id").single();
            if (error) throw error;
            l.remoteId = data.id;
          }
        }
      }
      setModules([...modules]);
      return true;
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async (active: boolean) => {
    if (!courseId) return;
    setSaving(true);
    const { error } = await supabase.from("courses").update({ is_active: active }).eq("id", courseId);
    setSaving(false);
    if (error) return toast.error(error.message);
    setIsActive(active);
    toast.success(active ? "Course published 🎉" : "Course unpublished");
  };

  const next = async () => {
    if (step === 1) {
      const cid = await saveStep1();
      if (cid) setStep(2);
    } else if (step === 2) {
      const ok = await saveStep2();
      if (ok) setStep(3);
    }
  };

  const addModule = () => setModules((ms) => [...ms, { id: tmpId(), title: `Module ${ms.length + 1}`, lessons: [] }]);

  const removeModule = async (id: string) => {
    const m = modules.find((x) => x.id === id);
    if (m?.remoteId) await supabase.from("modules").delete().eq("id", m.remoteId);
    setModules((ms) => ms.filter((x) => x.id !== id));
  };

  const updateModule = (id: string, patch: Partial<DraftModule>) =>
    setModules((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const addLesson = (modId: string) =>
    updateModule(modId, {
      lessons: [
        ...(modules.find((m) => m.id === modId)?.lessons ?? []),
        { id: tmpId(), title: "New lesson", content_type: "text", content_url: null, content_text: "", notes: "" },
      ],
    });

  const removeLesson = async (modId: string, lessonId: string) => {
    const m = modules.find((x) => x.id === modId);
    const l = m?.lessons.find((x) => x.id === lessonId);
    if (l?.remoteId) await supabase.from("lessons").delete().eq("id", l.remoteId);
    updateModule(modId, { lessons: m!.lessons.filter((x) => x.id !== lessonId) });
  };

  const updateLesson = (modId: string, lessonId: string, patch: Partial<DraftLesson>) => {
    const m = modules.find((x) => x.id === modId);
    if (!m) return;
    updateModule(modId, { lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onModuleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setModules((ms) => arrayMove(ms, ms.findIndex((m) => m.id === active.id), ms.findIndex((m) => m.id === over.id)));
  };
  const onLessonDragEnd = (modId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const m = modules.find((x) => x.id === modId);
    if (!m) return;
    updateModule(modId, {
      lessons: arrayMove(m.lessons, m.lessons.findIndex((l) => l.id === active.id), m.lessons.findIndex((l) => l.id === over.id)),
    });
  };

  // Scroll to top whenever the step changes so the active section header
  // (including the Publish toggle on step 3) is visible on small screens / iOS.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  if (loading) {
    return <DashboardShell title="Course builder"><div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div></DashboardShell>;
  }

  return (
    <DashboardShell title={editId ? "Edit course" : "Create course"}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Stepper step={step} />

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Course details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Introduction to Algebra" /></div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="Select a primary school subject" /></SelectTrigger>
                  <SelectContent>
                    {PRIMARY_SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Description</Label><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What learners will gain from this course." /></div>
              <div className="space-y-1">
                <Label>Thumbnail</Label>
                {thumbUrl && !thumbFile && (
                  <img src={thumbUrl} alt="" className="h-32 w-56 rounded-md object-cover border" />
                )}
                <Input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
                <p className="text-xs text-muted-foreground">JPG/PNG, under 5 MB.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Modules & lessons</CardTitle>
              <Button size="sm" onClick={addModule}><Plus className="mr-1 h-4 w-4" />Module</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {modules.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Add your first module to get started.</p>}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModuleDragEnd}>
                <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  {modules.map((m, mi) => (
                    <SortableModuleCard
                      key={m.id}
                      module={m}
                      index={mi}
                      onChange={(p: Partial<DraftModule>) => updateModule(m.id, p)}
                      onRemove={() => removeModule(m.id)}
                      onAddLesson={() => addLesson(m.id)}
                      onLessonDragEnd={onLessonDragEnd(m.id)}
                      onLessonChange={(lid: string, p: Partial<DraftLesson>) => updateLesson(m.id, lid, p)}
                      onLessonRemove={(lid: string) => removeLesson(m.id, lid)}
                      sensors={sensors}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{[subject, description].filter(Boolean).join(" · ")}</p>
                <div className="mt-3 flex gap-3 text-sm">
                  <Badge variant="secondary">{modules.length} modules</Badge>
                  <Badge variant="secondary">{modules.reduce((n, m) => n + m.lessons.length, 0)} lessons</Badge>
                  <Badge variant={isActive ? "default" : "outline"}>{isActive ? "Published" : "Draft"}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border px-4 py-3">
                <div>
                  <Label className="text-base">Visible to learners</Label>
                  <p className="text-xs text-muted-foreground">Toggle to publish or unpublish.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={publish} disabled={saving} />
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline"><Link to="/dashboard">Back to dashboard</Link></Button>
                {courseId && <Button asChild><Link to="/courses/$courseId" params={{ courseId }}>Preview course</Link></Button>}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={step === 1 || saving} onClick={() => setStep((s) => Math.max(1, s - 1))}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < 3 ? (
            <Button disabled={saving} onClick={next}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {step === 1 ? "Save & continue" : "Save modules & continue"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button asChild><Link to="/dashboard"><Check className="mr-1 h-4 w-4" />Done</Link></Button>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Details", "Builder", "Publish"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-primary text-primary-foreground" : active ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check className="h-4 w-4" /> : idx}
            </div>
            <span className={`text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
            {idx < steps.length && <div className={`h-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function SortableModuleCard({ module: m, index, onChange, onRemove, onAddLesson, onLessonDragEnd, onLessonChange, onLessonRemove, sensors }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b p-3">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></button>
        <span className="text-xs font-medium text-muted-foreground">M{index + 1}</span>
        <Input value={m.title} onChange={(e) => onChange({ title: e.target.value })} className="flex-1" placeholder="Module title" />
        <Button size="sm" variant="ghost" onClick={onAddLesson}><Plus className="mr-1 h-4 w-4" />Lesson</Button>
        <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
      <div className="p-3 space-y-2">
        {m.lessons.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No lessons yet</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd}>
          <SortableContext items={m.lessons.map((l: DraftLesson) => l.id)} strategy={verticalListSortingStrategy}>
            {m.lessons.map((l: DraftLesson) => (
              <SortableLessonRow key={l.id} lesson={l} onChange={(p: any) => onLessonChange(l.id, p)} onRemove={() => onLessonRemove(l.id)} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableLessonRow({ lesson, onChange, onRemove }: { lesson: DraftLesson; onChange: (p: Partial<DraftLesson>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  const Icon = lesson.content_type === "video" ? Film : lesson.content_type === "pdf" ? FileText : lesson.content_type === "audio" ? Headphones : NotebookPen;
  return (
    <div ref={setNodeRef} style={style} className="rounded-md border bg-background p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></button>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Input value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} className="flex-1" placeholder="Lesson title" />
        <Select value={lesson.content_type} onValueChange={(v) => onChange({ content_type: v as ContentType, content_url: null, content_text: null, uploadFile: null })}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Video URL</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="text">Text</SelectItem>
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
      {lesson.content_type === "video" && (
        <Input placeholder="https://youtube.com/…" value={lesson.content_url ?? ""} onChange={(e) => onChange({ content_url: e.target.value })} />
      )}
      {(lesson.content_type === "pdf" || lesson.content_type === "audio") && (
        <div className="space-y-1">
          <Input
            type="file"
            accept={lesson.content_type === "pdf" ? "application/pdf" : "audio/*"}
            onChange={(e) => onChange({ uploadFile: e.target.files?.[0] ?? null })}
          />
          {lesson.content_url && !lesson.uploadFile && (
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="h-3 w-3" /> File uploaded — choose a new file to replace.</p>
          )}
        </div>
      )}
      {lesson.content_type === "text" && (
        <Textarea rows={3} placeholder="Lesson text…" value={lesson.content_text ?? ""} onChange={(e) => onChange({ content_text: e.target.value })} />
      )}
      <Textarea rows={2} placeholder="Optional notes for learners…" value={lesson.notes ?? ""} onChange={(e) => onChange({ notes: e.target.value })} />
    </div>
  );
}
