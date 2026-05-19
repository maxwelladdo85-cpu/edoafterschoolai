import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type Report = {
  id: string; created_at: string; status: string; category: string; details: string;
  admin_notes: string | null; resolved_at: string | null;
  reporter_id: string; reporter_name: string | null; reporter_email: string | null;
  teacher_id: string; teacher_name: string | null; teacher_email: string | null;
  course_id: string | null; course_title: string | null;
};

const STATUSES = ["open", "investigating", "resolved", "dismissed"];

export function TeacherReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Report | null>(null);
  const [status, setStatus] = useState("open");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data, error } = await supabase.rpc("admin_list_teacher_reports", {
      p_status: filter === "all" ? null : filter,
    });
    if (error) return toast.error(error.message);
    setReports((data as Report[]) ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const openCard = (r: Report) => { setEditing(r); setStatus(r.status); setNotes(r.admin_notes ?? ""); };
  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.rpc("admin_update_teacher_report", {
      p_report_id: editing.id, p_status: status, p_admin_notes: notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Report updated");
    setEditing(null);
    load();
  };

  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Teacher reports
            {openCount > 0 && <Badge variant="destructive">{openCount} open</Badge>}
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No reports.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {reports.map((r) => (
              <li key={r.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.category} <span className="text-muted-foreground font-normal">· {r.teacher_name ?? r.teacher_email ?? "Teacher"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reported by {r.reporter_name ?? r.reporter_email ?? "Learner"}
                      {r.course_title ? ` · ${r.course_title}` : ""} · {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "open" ? "destructive" : r.status === "resolved" ? "default" : "secondary"}>{r.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openCard(r)}>Review</Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{r.details}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.category}</DialogTitle>
            <DialogDescription>
              Teacher: {editing?.teacher_name ?? editing?.teacher_email} ·
              Reporter: {editing?.reporter_name ?? editing?.reporter_email}
              {editing?.course_title ? ` · ${editing.course_title}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{editing?.details}</div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Admin notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Actions taken, findings, follow-ups…" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
