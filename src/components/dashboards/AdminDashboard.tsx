import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, GraduationCap, Video, Search, Check, X, UserCog, Download } from "lucide-react";
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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
  }, [users, search]);

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
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
            </CardContent>
          </Card>
        </section>
      )}

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {u.status !== "pending" && (
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(u.id, u.status)}>
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
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
