import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Plus, Video, ExternalLink, PlayCircle, Trash2, Pencil } from "lucide-react";
import { formatWhen, getStatus, type VirtualClass } from "@/lib/virtual-classes";
import { LearnerVirtualClasses } from "@/components/LearnerVirtualClasses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/virtual-classes")({
  component: VirtualClassesPage,
});

const scheduleSchema = z.object({
  course_id: z.preprocess((val) => (val === "" ? null : val), z.string().uuid().optional().nullable()),
  title: z.string().trim().min(2, "Meeting title is required").max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  zoom_url: z.string().trim().url("Enter a valid Zoom link").max(500),
});

interface CourseRow { id: string; title: string; subject?: string | null }
interface ClassRow extends VirtualClass { course?: { title: string } | null }

function VirtualClassesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [recordingFor, setRecordingFor] = useState<ClassRow | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [deleting, setDeleting] = useState<ClassRow | null>(null);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  // Learners get an upcoming-only view; teachers/admins get the full scheduler below.
  if (!authLoading && role === "learner") {
    return (
      <DashboardShell title="Virtual Classes">
        <LearnerVirtualClasses />
      </DashboardShell>
    );
  }

  const canManageAll = role === "scripter" || role === "admin";

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const coursesQuery = canManageAll
      ? null
      : supabase.from("courses").select("id,title,subject").eq("teacher_id", user.id).order("created_at", { ascending: false });
    const vcQuery = canManageAll
      ? (supabase as any).from("virtual_classes").select("*").order("scheduled_at", { ascending: false })
      : (supabase as any).from("virtual_classes").select("*").order("scheduled_at", { ascending: false }); // RLS returns own + scripter-scheduled for teachers
    const [{ data: cs }, { data: vcs }] = await Promise.all([coursesQuery ?? Promise.resolve({ data: [] }), vcQuery]);
    const courseList = (cs as CourseRow[]) ?? [];
    setCourses(courseList);
    const titleMap = new Map(courseList.map((c) => [c.id, c.title]));
    const rows = ((vcs as any[]) ?? []).map((r) => ({ ...r, course: { title: titleMap.get(r.course_id ?? "") ?? "" } })) as ClassRow[];
    const missing = Array.from(new Set(rows.filter((r) => !r.course?.title && r.course_id).map((r) => r.course_id!)));
    if (missing.length) {
      const { data: extra } = await supabase.from("courses").select("id,title").in("id", missing);
      const extraMap = new Map((extra ?? []).map((c: any) => [c.id, c.title]));
      for (const r of rows) {
        if (!r.course?.title && r.course_id) r.course = { title: extraMap.get(r.course_id) ?? "" };
      }
    }
    setClasses(rows);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  const grouped = useMemo(() => {
    const upcoming: ClassRow[] = [];
    const past: ClassRow[] = [];
    for (const c of classes) {
      (getStatus(c) === "ended" ? past : upcoming).push(c);
    }
    upcoming.sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));
    return { upcoming, past };
  }, [classes]);

  const onSchedule = async (form: FormData) => {
    if (!user) return;
    const raw = {
      course_id: String(form.get("course_id") ?? ""),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? "") || null,
      date: String(form.get("date") ?? ""),
      time: String(form.get("time") ?? ""),
      duration_minutes: form.get("duration_minutes"),
      zoom_url: String(form.get("zoom_url") ?? ""),
    };
    const parsed = scheduleSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (!canManageAll && !parsed.data.course_id) {
      toast.error("Pick a course");
      return;
    }
    const scheduled_at = new Date(`${parsed.data.date}T${parsed.data.time}`).toISOString();
    const payload = {
      course_id: canManageAll ? parsed.data.course_id ?? null : parsed.data.course_id,
      title: parsed.data.title,
      description: parsed.data.description,
      scheduled_at,
      duration_minutes: parsed.data.duration_minutes,
      zoom_url: parsed.data.zoom_url,
    };
    let error;
    if (editing) {
      ({ error } = await (supabase as any).from("virtual_classes").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await (supabase as any).from("virtual_classes").insert({ ...payload, teacher_id: user.id }));
    }
    if (error) return toast.error(error.message);
    toast.success(editing ? "Class updated" : "Class scheduled");
    setOpen(false);
    setEditing(null);
    refresh();
  };

  const onDelete = async (c: ClassRow) => {
    const { error } = await (supabase as any).from("virtual_classes").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    setDeleting(null);
    refresh();
  };

  const onSaveRecording = async () => {
    if (!recordingFor) return;
    const url = recordingUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      return toast.error("Recording URL must start with http(s)://");
    }
    const { error } = await (supabase as any)
      .from("virtual_classes")
      .update({ recording_url: url || null })
      .eq("id", recordingFor.id);
    if (error) return toast.error(error.message);
    toast.success("Recording link saved");
    setRecordingFor(null);
    setRecordingUrl("");
    refresh();
  };

  const openEdit = (c: ClassRow) => {
    setEditing(c);
    setOpen(true);
  };

  const openRecording = (c: ClassRow) => {
    setRecordingFor(c);
    setRecordingUrl(c.recording_url ?? "");
  };

  const initial = editing ? {
    course_id: editing.course_id,
    title: editing.title,
    description: editing.description ?? "",
    date: editing.scheduled_at.slice(0, 10),
    time: new Date(editing.scheduled_at).toTimeString().slice(0, 5),
    duration_minutes: editing.duration_minutes,
    zoom_url: editing.zoom_url,
  } : {
    course_id: courses[0]?.id ?? "",
    title: "", description: "", date: "", time: "", duration_minutes: 60, zoom_url: "",
  };

  return (
    <DashboardShell title="Virtual Classes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6 text-primary" /> Virtual Classes</h1>
            <p className="text-sm text-muted-foreground">{canManageAll ? "Schedule live Zoom sessions — teachers are automatically notified." : "Schedule live Zoom sessions for your courses."}</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button disabled={!canManageAll && courses.length === 0}>
                <Plus className="mr-1 h-4 w-4" /> Schedule class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit class" : "Schedule a virtual class"}</DialogTitle>
              </DialogHeader>
              <form
                key={editing?.id ?? "new"}
                onSubmit={(e) => { e.preventDefault(); onSchedule(new FormData(e.currentTarget)); }}
                className="space-y-3"
              >
                {!canManageAll && (
                  <div className="space-y-1">
                    <Label>Subject</Label>
                    <Select name="course_id" defaultValue={initial.course_id ?? undefined}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.subject ? `${c.subject} — ${c.title}` : c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label>Meeting Title</Label>
                  <Input name="title" defaultValue={initial.title} maxLength={150} required />
                </div>
                <div className="space-y-1">
                  <Label>Description (optional)</Label>
                  <Textarea name="description" rows={2} defaultValue={initial.description} maxLength={1000} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-1">
                    <Label>Date</Label>
                    <Input type="date" name="date" defaultValue={initial.date} required />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <Label>Time</Label>
                    <Input type="time" name="time" defaultValue={initial.time} required />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <Label>Duration (min)</Label>
                    <Input type="number" name="duration_minutes" min={5} max={480} defaultValue={initial.duration_minutes} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Zoom link</Label>
                  <Input name="zoom_url" type="url" defaultValue={initial.zoom_url} placeholder="https://zoom.us/j/…" maxLength={500} required />
                </div>
                <DialogFooter>
                  <Button type="submit">{editing ? "Save changes" : "Schedule"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!canManageAll && courses.length === 0 && !loading && (
          <Card className="border-dashed"><CardContent className="py-6 text-center text-sm text-muted-foreground">
            Create a course first before scheduling a virtual class.
          </CardContent></Card>
        )}

        <Section title="Upcoming & live" rows={grouped.upcoming} loading={loading} onEdit={openEdit} onDelete={setDeleting} onRecording={openRecording} />
        <Section title="Past sessions" rows={grouped.past} loading={loading} onEdit={openEdit} onDelete={setDeleting} onRecording={openRecording} />
      </div>

      <Dialog open={!!recordingFor} onOpenChange={(v) => { if (!v) { setRecordingFor(null); setRecordingUrl(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add recording link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Recording URL</Label>
            <Input value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} placeholder="https://…" />
            <p className="text-xs text-muted-foreground">Paste the Zoom cloud recording or any video URL. Leave empty to remove.</p>
          </div>
          <DialogFooter>
            <Button onClick={onSaveRecording}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleting?.title}" and its Zoom link. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && onDelete(deleting)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

function Section({
  title, rows, loading, onEdit, onDelete, onRecording,
}: {
  title: string; rows: ClassRow[]; loading: boolean;
  onEdit: (c: ClassRow) => void; onDelete: (c: ClassRow) => void; onRecording: (c: ClassRow) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {loading ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Nothing here.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((c) => {
            const status = getStatus(c);
            return (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{c.title}</CardTitle>
                      <CardDescription className="truncate">{c.course?.title} · {c.duration_minutes} min</CardDescription>
                    </div>
                    {status === "live"
                      ? <Badge className="bg-destructive text-destructive-foreground animate-pulse">LIVE</Badge>
                      : status === "upcoming" ? <Badge variant="secondary">Upcoming</Badge>
                      : <Badge variant="outline">Ended</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {formatWhen(c.scheduled_at)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={c.zoom_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-3.5 w-3.5" />Open Zoom</a>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onRecording(c)}>
                      <PlayCircle className="mr-1 h-3.5 w-3.5" />{c.recording_url ? "Edit recording" : "Add recording"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(c)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(c)}><Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
