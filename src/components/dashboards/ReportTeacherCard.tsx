import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Teacher = { teacher_id: string; full_name: string | null; email: string | null; course_id: string; course_title: string };
type MyReport = { id: string; created_at: string; status: string; category: string; details: string };

const CATEGORIES = [
  "Inappropriate behaviour",
  "Harassment or bullying",
  "Discrimination",
  "Unprofessional conduct",
  "Absent or unresponsive",
  "Safety concern",
  "Other",
];

export function ReportTeacherCard() {
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [mine, setMine] = useState<MyReport[]>([]);
  const [teacherKey, setTeacherKey] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [t, m] = await Promise.all([
      supabase.rpc("list_reportable_teachers"),
      supabase.from("teacher_reports").select("id, created_at, status, category, details").order("created_at", { ascending: false }).limit(5),
    ]);
    if (t.data) setTeachers(t.data as Teacher[]);
    if (m.data) setMine(m.data as MyReport[]);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!teacherKey || !category || details.trim().length < 10) {
      toast.error("Please pick a teacher, category, and provide at least 10 characters of detail.");
      return;
    }
    const [teacher_id, course_id] = teacherKey.split("|");
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_teacher_report", {
      p_teacher_id: teacher_id,
      p_category: category,
      p_details: details.trim(),
      p_course_id: course_id || undefined,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Report submitted. An administrator will review it confidentially.");
    setOpen(false);
    setTeacherKey(""); setCategory(""); setDetails("");
    load();
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Report a teacher
            </CardTitle>
            <CardDescription>
              Confidentially flag a concern about a teacher. Reports go straight to admins.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm"><ShieldAlert className="h-4 w-4 mr-1" />File a report</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report a teacher</DialogTitle>
                <DialogDescription>Your identity is shared only with administrators reviewing the report.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Teacher</Label>
                  <Select value={teacherKey} onValueChange={setTeacherKey}>
                    <SelectTrigger><SelectValue placeholder={teachers.length ? "Pick a teacher" : "No course teachers found"} /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={`${t.teacher_id}|${t.course_id}`} value={`${t.teacher_id}|${t.course_id}`}>
                          {(t.full_name ?? t.email ?? "Teacher")} — {t.course_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="What is the concern about?" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>What happened?</Label>
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe what happened, when, and any context that helps admins investigate. (10–2000 characters)"
                    maxLength={2000}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{details.length}/2000</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                <Button variant="destructive" onClick={submit} disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Submitting…</> : "Submit report"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      {mine.length > 0 && (
        <CardContent>
          <p className="text-xs font-medium text-muted-foreground mb-2">Your recent reports</p>
          <ul className="divide-y rounded-md border">
            {mine.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.category}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <Badge variant={r.status === "resolved" ? "default" : r.status === "dismissed" ? "secondary" : "outline"}>
                  {r.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
