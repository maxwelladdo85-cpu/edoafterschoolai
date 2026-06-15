import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteUserAsAdmin } from "@/lib/admin-users.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, BookOpen, GraduationCap, Video, Search, Check, X, UserCog, Download, Trash2, Loader2 } from "lucide-react";
import { BulkUploadUsers } from "@/components/dashboards/BulkUploadUsers";
import { TeacherReportsPanel } from "@/components/dashboards/TeacherReportsPanel";
import { PageHero } from "@/components/PageHero";
import dashboardHero from "@/assets/dashboard-hero.jpg";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

type Overview = { total_learners: number; total_teachers: number; total_courses: number; active_sessions_today: number; pending_teachers: number };
type WeeklyRow = { day: string; enrollments: number };
type TopCourse = { course_id: string; title: string; enrollments: number };
type CompletionRow = { course_id: string; title: string; completion_pct: number };
type DauRow = { day: string; active_users: number };
type PendingTeacher = { id: string; email: string | null; full_name: string | null; created_at: string };
type UserRow = { id: string; email: string | null; full_name: string | null; status: string; created_at: string; roles: string[] };

export function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [weekly, setWeekly] = useState<WeeklyRow[]>([]);
  const [top, setTop] = useState<TopCourse[]>([]);
  const [completion, setCompletion] = useState<CompletionRow[]>([]);
  const [dau, setDau] = useState<DauRow[]>([]);
  const [pending, setPending] = useState<PendingTeacher[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteUserFn = useServerFn(deleteUserAsAdmin);

  const loadAll = async () => {
    const [ov, wk, tc, cr, da, pt, profiles, roles] = await Promise.all([
      supabase.rpc("admin_overview_stats"),
      supabase.rpc("admin_weekly_enrollments"),
      supabase.rpc("admin_top_courses"),
      supabase.rpc("admin_completion_rates"),
      supabase.rpc("admin_daily_active_users"),
      supabase.rpc("admin_list_pending_teachers"),
      supabase.from("profiles").select("id, email, full_name, status, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (ov.data) setOverview(ov.data as unknown as Overview);
    if (wk.data) setWeekly((wk.data as any[]).map((r) => ({ day: r.day, enrollments: Number(r.enrollments) })));
    if (tc.data) setTop((tc.data as any[]).map((r) => ({ ...r, enrollments: Number(r.enrollments) })));
    if (cr.data) setCompletion((cr.data as any[]).map((r) => ({ ...r, completion_pct: Number(r.completion_pct) })));
    if (da.data) setDau((da.data as any[]).map((r) => ({ day: r.day, active_users: Number(r.active_users) })));
    if (pt.data) setPending(pt.data as PendingTeacher[]);
    const rolesByUser: Record<string, string[]> = {};
    (roles.data ?? []).forEach((r: any) => {
      rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
    });
    setUsers((profiles.data ?? []).map((p: any) => ({ ...p, roles: rolesByUser[p.id] ?? [] })));
  };

  useEffect(() => { loadAll(); }, []);

  const approveTeacher = async (uid: string) => {
    const { error } = await supabase.rpc("admin_approve_teacher", { p_user_id: uid });
    if (error) return toast.error(error.message);
    toast.success("Teacher approved");
    loadAll();
  };
  const rejectTeacher = async (uid: string) => {
    const { error } = await supabase.rpc("admin_set_user_status", { p_user_id: uid, p_status: "inactive" });
    if (error) return toast.error(error.message);
    toast.success("Teacher rejected");
    loadAll();
  };
  const toggleStatus = async (uid: string, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    const { error } = await supabase.rpc("admin_set_user_status", { p_user_id: uid, p_status: next });
    if (error) return toast.error(error.message);
    toast.success(`User set to ${next}`);
    loadAll();
  };

  const openDelete = (u: UserRow) => {
    setDeleteTarget(u);
    setDeleteConfirmEmail("");
    setDeleteReason("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUserFn({ data: {
        userId: deleteTarget.id,
        confirmEmail: deleteConfirmEmail,
        reason: deleteReason || undefined,
      }});
      toast.success(`Deleted ${deleteTarget.email ?? "user"}`);
      setDeleteTarget(null);
      loadAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
  }, [users, search]);

  const downloadCsv = (filename: string, rows: Record<string, any>[]) => {
    if (!rows.length) return toast.error("No data to export");
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "string" ? v : v instanceof Date ? v.toISOString() : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportUsers = () => {
    const rows = users.map((u) => ({
      full_name: u.full_name ?? "",
      email: u.email ?? "",
      roles: u.roles.join("|"),
      status: u.status,
      joined_at: u.created_at,
    }));
    downloadCsv(`users-${new Date().toISOString().slice(0,10)}.csv`, rows);
    toast.success(`Exported ${rows.length} users`);
  };

  const exportActivity = async () => {
    const { data, error } = await supabase.rpc("admin_user_activity_log", { p_limit: 10000 });
    if (error) return toast.error(error.message);
    downloadCsv(`activity-${new Date().toISOString().slice(0,10)}.csv`, (data ?? []) as any[]);
    toast.success(`Exported ${(data ?? []).length} activity events`);
  };

  const exportLogins = async () => {
    const { data, error } = await supabase.rpc("admin_user_last_seen");
    if (error) return toast.error(error.message);
    downloadCsv(`active-users-${new Date().toISOString().slice(0,10)}.csv`, (data ?? []) as any[]);
    toast.success(`Exported ${(data ?? []).length} user activity records`);
  };

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin console"
        EyebrowIcon={Users}
        title="Platform analytics"
        description="Real-time view of learners, teachers, courses and engagement across Edo SUBEB."
        backgroundImage={dashboardHero}
      />

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users />} label="Total Learners" value={overview?.total_learners ?? "—"} tint="from-primary/15 to-primary/5" />
        <Stat icon={<GraduationCap />} label="Total Teachers" value={overview?.total_teachers ?? "—"} tint="from-gold/20 to-gold/5" />
        <Stat icon={<BookOpen />} label="Active Courses" value={overview?.total_courses ?? "—"} tint="from-emerald-500/15 to-emerald-500/5" />
        <Stat icon={<Video />} label="Sessions Today" value={overview?.active_sessions_today ?? "—"} tint="from-sky-500/15 to-sky-500/5" />
      </section>

      {/* Exports */}
      <section>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Export reports</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportUsers}>
              <Download className="h-4 w-4 mr-2" /> Users (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={exportActivity}>
              <Download className="h-4 w-4 mr-2" /> User activity (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogins}>
              <Download className="h-4 w-4 mr-2" /> Active users / last seen (CSV)
            </Button>
            <p className="w-full text-xs text-muted-foreground mt-1">
              CSV files open directly in Excel and Google Sheets.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Charts row 1 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Weekly enrollments</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tickFormatter={(d) => format(parseISO(d), "EEE")} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="enrollments" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top 5 courses by enrollments</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
                <YAxis dataKey="title" type="category" width={140} stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="enrollments" fill="var(--gold)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Charts row 2 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily active users (last 14d)</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dau}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tickFormatter={(d) => format(parseISO(d), "MMM d")} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Line type="monotone" dataKey="active_users" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Course completion rates</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[280px] overflow-auto">
            {completion.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : completion.map((c) => (
              <div key={c.course_id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate pr-2">{c.title}</span>
                  <span className="font-medium tabular-nums">{c.completion_pct}%</span>
                </div>
                <Progress value={c.completion_pct} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Pending teachers */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Pending teacher approvals
            <Badge variant="destructive">{pending.length}</Badge>
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Requested</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          <Button size="sm" onClick={() => approveTeacher(p.id)}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectTeacher(p.id)}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Bulk onboarding */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Bulk onboarding</h2>
        <BulkUploadUsers onDone={loadAll} />
      </section>

      {/* Teacher reports */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Whistle-blow · Teacher reports</h2>
        <TeacherReportsPanel />
      </section>

      {/* User management */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-semibold">User management</h2>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Roles</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Joined</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No users found.</TableCell></TableRow>
                  ) : filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r} variant={r === "admin" ? "destructive" : r === "teacher" ? "default" : "secondary"}>{r}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : u.status === "pending" ? "outline" : "secondary"}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          {u.status !== "pending" && (
                            <Button size="sm" variant="outline" onClick={() => toggleStatus(u.id, u.status)}>
                              {u.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => openDelete(u)}>
                            <Trash2 className="mr-1 h-4 w-4" />Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.full_name ?? deleteTarget?.email}</strong>{" "}
              and all associated records (enrollments, completions, messages, certificates, etc.).
              This action cannot be undone and will be recorded in the admin audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="confirm-email">
                Type the user's email <span className="font-mono">{deleteTarget?.email}</span> to confirm
              </Label>
              <Input
                id="confirm-email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={deleteTarget?.email ?? ""}
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason (optional, logged for audit)</Label>
              <Textarea
                id="reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Why is this user being deleted?"
                maxLength={500}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting || !deleteConfirmEmail || deleteConfirmEmail.trim().toLowerCase() !== (deleteTarget?.email ?? "").trim().toLowerCase()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Deleting…</> : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ icon, label, value, tint = "from-primary/15 to-primary/5" }: { icon: React.ReactNode; label: string; value: React.ReactNode; tint?: string }) {
  return (
    <Card className={`border-0 bg-gradient-to-br ${tint}`} style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold tracking-tight">{value}</p></div>
      </CardContent>
    </Card>
  );
}
