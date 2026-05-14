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

interface Course { id: string; title: string; subject: string | null; description: string | null; is_active: boolean; created_at: string; class_level: string | null; teacher_name: string | null; }

const emptyForm = { title: "", subject: "", description: "", is_active: true, class_level: "", teacher_name: "" };

export function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
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
    setOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({ title: c.title, subject: c.subject ?? "", description: c.description ?? "", is_active: c.is_active });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = { title: form.title, subject: form.subject, description: form.description, is_active: form.is_active };
    const { error } = editingId
      ? await supabase.from("courses").update(payload).eq("id", editingId)
      : await supabase.from("courses").insert({ ...payload, teacher_id: user.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Course updated" : "Course created");
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    load();
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
          <h1 className="text-3xl font-bold">Teacher Workspace</h1>
          <p className="text-muted-foreground">Manage and publish your courses.</p>
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
              <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics, English…" /></div>
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
        <h2 className="mb-3 text-xl font-semibold">My Courses</h2>
        {courses.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10" />
            <p>No courses yet — click "Create New Course" to get started.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Draft"}</Badge>
                  </div>
                  <CardDescription>{c.subject}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                  <div className="flex justify-end gap-2">
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
