import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssignClassButton } from "@/components/dashboards/AssignClassButton";
import { toast } from "sonner";
import { MaterialUploader } from "@/components/dashboards/MaterialUploader";

interface Course { id: string; title: string; subject: string | null; description: string | null; is_active: boolean; created_at: string; class_level: string | null; teacher_name: string | null; thumbnail_url: string | null; }

const emptyForm = { title: "", subject: "", description: "", is_active: true, class_level: "", teacher_name: "" };

export function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  const subjectOptions = Array.from(new Set(courses.map((c) => c.subject).filter(Boolean) as string[])).sort();
  const classOptions = Array.from(new Set(courses.map((c) => c.class_level).filter(Boolean) as string[])).sort();
  const filteredCourses = courses.filter((c) =>
    (subjectFilter === "all" || c.subject === subjectFilter) &&
    (classFilter === "all" || c.class_level === classFilter)
  );

  const detectMaterialType = (file: File): "video" | "pdf" | "audio" | "doc" | null => {
    const m = file.type.toLowerCase();
    const n = file.name.toLowerCase();
    if (m.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(n)) return "video";
    if (m.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(n)) return "audio";
    if (m === "application/pdf" || n.endsWith(".pdf")) return "pdf";
    if (m.includes("msword") || m.includes("officedocument.wordprocessingml") || /\.(doc|docx)$/.test(n)) return "doc";
    return null;
  };

  const uploadMaterials = async (courseId: string, files: File[]) => {
    let { data: mod } = await supabase.from("modules").select("id").eq("course_id", courseId).eq("title", "Materials").maybeSingle();
    if (!mod) {
      const { data: created, error: mErr } = await supabase.from("modules").insert({ course_id: courseId, title: "Materials", position: 0 }).select("id").single();
      if (mErr) throw mErr;
      mod = created;
    }
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", mod!.id);
    let pos = count ?? 0;
    for (const file of files) {
      const type = detectMaterialType(file);
      if (!type) { toast.error(`Skipped ${file.name}: unsupported type`); continue; }
      if (file.size > 100 * 1024 * 1024) { toast.error(`Skipped ${file.name}: over 100 MB`); continue; }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${courseId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("course-materials").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { toast.error(`Failed ${file.name}: ${upErr.message}`); continue; }
      const { data: pub } = supabase.storage.from("course-materials").getPublicUrl(path);
      await supabase.from("lessons").insert({ module_id: mod!.id, title: file.name, position: pos++, content_type: type, content_url: pub.publicUrl });
    }
  };

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("courses").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false });
    setCourses(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setThumbFile(null);
    setMaterialFiles([]);
    setOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({ title: c.title, subject: c.subject ?? "", description: c.description ?? "", is_active: c.is_active, class_level: c.class_level ?? "", teacher_name: c.teacher_name ?? "" });
    setThumbFile(null);
    setMaterialFiles([]);
    setOpen(true);
  };

  const uploadThumb = async (courseId: string, file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${courseId}/thumb-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("course-materials")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("course-materials").getPublicUrl(path);
    return pub.publicUrl;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (thumbFile && !thumbFile.type.startsWith("image/")) return toast.error("Thumbnail must be an image");
    if (thumbFile && thumbFile.size > 5 * 1024 * 1024) return toast.error("Thumbnail must be under 5 MB");
    setSaving(true);
    try {
      const payload: any = { title: form.title, subject: form.subject, description: form.description, is_active: form.is_active, class_level: form.class_level || null, teacher_name: form.teacher_name || null };
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
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Course deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Teacher Workspace</h1>
          <p className="text-lg text-muted-foreground">Manage and publish your courses.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Create New Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit course" : "New course"}</DialogTitle>
              <DialogDescription>{editingId ? "Update your course details." : "Add a course your learners can enroll in."}</DialogDescription>
            </DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics, English…" /></div>
                <div className="space-y-1"><Label>Class</Label><Input value={form.class_level} onChange={(e) => setForm({ ...form, class_level: e.target.value })} placeholder="JSS 1, Primary 4…" /></div>
              </div>
              <div className="space-y-1"><Label>Teacher name</Label><Input value={form.teacher_name} onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} placeholder="Mr. / Mrs. / Ms. / Miss Adaeze Okoro" autoCapitalize="words" autoComplete="name" spellCheck={false} maxLength={100} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Thumbnail image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
                <p className="text-xs text-muted-foreground">Shown as the card background. JPG/PNG, under 5 MB.{editingId ? " Leave empty to keep the current image." : ""}</p>
              </div>
              <div className="space-y-1">
                <Label>Course materials</Label>
                <Input
                  type="file"
                  multiple
                  accept="video/*,audio/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setMaterialFiles(Array.from(e.target.files ?? []))}
                />
                <p className="text-xs text-muted-foreground">Optional. Upload videos, audio, PDFs, or Word docs (max 100 MB each). You can add more later.</p>
                {materialFiles.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                    {materialFiles.map((f) => <li key={f.name}>{f.name}</li>)}
                  </ul>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div><Label>Active</Label><p className="text-xs text-muted-foreground">Visible to learners in the Course Library</p></div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
              <DialogFooter><Button type="submit" disabled={saving}>{editingId ? "Save changes" : "Publish"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Courses</h2>
          <div className="flex flex-wrap gap-2">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {(subjectFilter !== "all" || classFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSubjectFilter("all"); setClassFilter("all"); }}>Clear</Button>
            )}
          </div>
        </div>
        {courses.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center text-base text-muted-foreground">
            <BookOpen className="h-10 w-10" />
            <p>No courses yet — click "Create New Course" to get started.</p>
          </CardContent></Card>
        ) : filteredCourses.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-base text-muted-foreground">
            No courses match the selected filters.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((c) => (
              <Card key={c.id} className="overflow-hidden flex flex-col">
                <div
                  className="relative aspect-[16/9] w-full bg-muted"
                  style={c.thumbnail_url ? { backgroundImage: `url(${c.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                >
                  {!c.thumbnail_url && (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-gold/20 to-accent/20">
                      <BookOpen className="h-10 w-10 text-primary/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <Badge className="absolute right-2 top-2" variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Draft"}</Badge>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-lg font-semibold leading-tight text-white drop-shadow">{c.title}</h3>
                    <p className="text-sm text-white/85">{[c.subject, c.class_level].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <CardContent className="space-y-3">
                  {c.teacher_name && (
                    <p className="text-base font-medium text-foreground">Teacher: <span className="text-muted-foreground font-normal">{c.teacher_name}</span></p>
                  )}
                  <p className="text-base text-muted-foreground line-clamp-3">{c.description}</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <MaterialUploader courseId={c.id} />
                    <AssignClassButton courseId={c.id} defaultClass={c.class_level} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive"><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{c.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove the course and all its modules, lessons, quizzes, and enrollments.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(c.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
