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
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Course { id: string; title: string; subject: string | null; description: string | null; is_active: boolean; created_at: string; }

export function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("courses").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false });
    setCourses(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("courses").insert({ ...form, teacher_id: user.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Course created");
    setOpen(false);
    setForm({ title: "", subject: "", description: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Teacher Workspace</h1>
          <p className="text-muted-foreground">Manage and publish your courses.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create New Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New course</DialogTitle>
              <DialogDescription>Add a course your learners can enroll in.</DialogDescription>
            </DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics, English…" /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <DialogFooter><Button type="submit" disabled={saving}>Publish</Button></DialogFooter>
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
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
