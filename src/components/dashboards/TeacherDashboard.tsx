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
  const [saving, setSaving] = useState(false);

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
    setOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({ title: c.title, subject: c.subject ?? "", description: c.description ?? "", is_active: c.is_active, class_level: c.class_level ?? "", teacher_name: c.teacher_name ?? "" });
    setThumbFile(null);
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
      toast.success(editingId ? "Course updated" : "Course created");
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setThumbFile(null);
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
        <h2 className="mb-3 text-2xl font-semibold">My Courses</h2>
        {courses.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center text-base text-muted-foreground">
            <BookOpen className="h-10 w-10" />
            <p>No courses yet — click "Create New Course" to get started.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                    <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Draft"}</Badge>
                  </div>
                  <CardDescription className="text-base">{[c.subject, c.class_level].filter(Boolean).join(" · ")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.teacher_name && (
                    <p className="text-base font-medium text-foreground">Teacher: <span className="text-muted-foreground font-normal">{c.teacher_name}</span></p>
                  )}
                  <p className="text-base text-muted-foreground line-clamp-3">{c.description}</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <MaterialUploader courseId={c.id} />
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
