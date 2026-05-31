import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, BookOpen, GraduationCap, TrendingUp, RefreshCw, Award } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export const Route = createFileRoute("/admin-analytics")({
  component: AdminAnalyticsPage,
});

type Overview = {
  total_learners: number;
  total_teachers: number;
  total_courses: number;
  active_sessions_today: number;
  pending_teachers: number;
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#D4AF37", "#C62828", "#6366f1", "#10b981"];

function AdminAnalyticsPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [dau, setDau] = useState<{ day: string; active_users: number }[]>([]);
  const [enroll, setEnroll] = useState<{ day: string; enrollments: number }[]>([]);
  const [topCourses, setTopCourses] = useState<{ title: string; enrollments: number }[]>([]);
  const [completion, setCompletion] = useState<{ title: string; completion_pct: number }[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
    if (!loading && user && role && role !== "admin") nav({ to: "/dashboard" });
  }, [loading, user, role, nav]);

  const load = async () => {
    setBusy(true);
    const [ov, d, e, tc, cr] = await Promise.all([
      supabase.rpc("admin_overview_stats"),
      supabase.rpc("admin_daily_active_users"),
      supabase.rpc("admin_weekly_enrollments"),
      supabase.rpc("admin_top_courses"),
      supabase.rpc("admin_completion_rates"),
    ]);
    setBusy(false);
    const err = ov.error || d.error || e.error || tc.error || cr.error;
    if (err) return toast.error(err.message);
    setOverview(ov.data as unknown as Overview);
    setDau((d.data ?? []).map((r: any) => ({ day: format(parseISO(r.day), "MMM d"), active_users: Number(r.active_users) })));
    setEnroll((e.data ?? []).map((r: any) => ({ day: format(parseISO(r.day), "MMM d"), enrollments: Number(r.enrollments) })));
    setTopCourses((tc.data ?? []).map((r: any) => ({ title: r.title, enrollments: Number(r.enrollments) })));
    setCompletion((cr.data ?? []).map((r: any) => ({ title: r.title, completion_pct: Number(r.completion_pct) })));
  };

  useEffect(() => {
    if (role === "admin") load();
  }, [role]);

  if (loading || !user || role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const roleData = overview ? [
    { name: "Learners", value: overview.total_learners },
    { name: "Teachers", value: overview.total_teachers },
    { name: "Pending teachers", value: overview.pending_teachers },
  ] : [];

  const totalEnroll7d = enroll.reduce((s, r) => s + r.enrollments, 0);
  const totalDAU14d = dau.reduce((s, r) => s + r.active_users, 0);
  const avgCompletion = completion.length ? Math.round(completion.reduce((s, r) => s + r.completion_pct, 0) / completion.length) : 0;

  return (
    <DashboardShell title="Analytics">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Analytics & trends
            </h1>
            <p className="text-sm text-muted-foreground">Track platform activity, engagement and course performance.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Users />} label="Total learners" value={overview?.total_learners ?? "—"} />
          <Kpi icon={<GraduationCap />} label="Total teachers" value={overview?.total_teachers ?? "—"} />
          <Kpi icon={<BookOpen />} label="Active courses" value={overview?.total_courses ?? "—"} />
          <Kpi icon={<TrendingUp />} label="Enrollments (7d)" value={totalEnroll7d} />
          <Kpi icon={<Users />} label="Active users (14d total)" value={totalDAU14d} />
          <Kpi icon={<Award />} label="Avg completion" value={`${avgCompletion}%`} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Daily active users (last 14 days)</CardTitle></CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dau}>
                  <defs>
                    <linearGradient id="dauG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="active_users" stroke="hsl(var(--primary))" fill="url(#dauG)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Enrollments (last 7 days)</CardTitle></CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enroll}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Top courses by enrollment</CardTitle></CardHeader>
            <CardContent style={{ height: 320 }}>
              {topCourses.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No enrollments yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCourses} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="enrollments" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">User distribution</CardTitle></CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}>
                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Course completion rates</CardTitle></CardHeader>
          <CardContent style={{ height: 360 }}>
            {completion.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No completion data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completion} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-25} textAnchor="end" interval={0} height={70} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="completion_pct" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
