import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Users, BookOpen, GraduationCap, TrendingUp, RefreshCw, Award, Filter, MapPin, School, X } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
} from "recharts";

export const Route = createFileRoute("/admin-analytics")({
  component: AdminAnalyticsPage,
});

type Totals = {
  total_learners: number;
  total_teachers: number;
  total_courses: number;
  total_enrollments: number;
  certificates_issued: number;
};
type Analytics = {
  totals: Totals;
  dau: { day: string; active_users: number }[];
  enrollments: { day: string; enrollments: number }[];
  signups: { day: string; signups: number }[];
  top_courses: { id: string; title: string; enrollments: number }[];
  completion: { course_id: string; title: string; completion_pct: number }[];
  by_lga: { lga: string; learners: number }[];
  by_school_type: { school_type: string; learners: number }[];
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#D4AF37", "#C62828", "#6366f1", "#10b981", "#f97316", "#06b6d4"];
const ANY = "__all__";

function AdminAnalyticsPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Analytics | null>(null);
  const [lgas, setLgas] = useState<string[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<string[]>([]);
  const [lga, setLga] = useState<string>(ANY);
  const [schoolType, setSchoolType] = useState<string>(ANY);
  const [days, setDays] = useState<number>(14);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
    if (!loading && user && role && role !== "admin") nav({ to: "/dashboard" });
  }, [loading, user, role, nav]);

  const loadOptions = async () => {
    const { data, error } = await supabase.rpc("admin_analytics_filter_options");
    if (error) return;
    const o = data as any;
    setLgas(o?.lgas ?? []);
    setSchoolTypes(o?.school_types ?? []);
  };

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_analytics_filtered", {
      p_lga: lga === ANY ? undefined : lga,
      p_school_type: schoolType === ANY ? undefined : schoolType,
      p_days: days,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    const d = data as any as Analytics;
    setData({
      ...d,
      dau: (d.dau ?? []).map((r) => ({ ...r, day: format(parseISO(r.day), "MMM d") })),
      enrollments: (d.enrollments ?? []).map((r) => ({ ...r, day: format(parseISO(r.day), "MMM d") })),
      signups: (d.signups ?? []).map((r) => ({ ...r, day: format(parseISO(r.day), "MMM d") })),
    });
  };

  useEffect(() => {
    if (role === "admin") {
      loadOptions();
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lga, schoolType, days]);

  if (loading || !user || role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const t = data?.totals;
  const avgCompletion = data?.completion?.length
    ? Math.round(data.completion.reduce((s, r) => s + Number(r.completion_pct), 0) / data.completion.length)
    : 0;
  const totalSignups = (data?.signups ?? []).reduce((s, r) => s + r.signups, 0);
  const totalEnroll = (data?.enrollments ?? []).reduce((s, r) => s + r.enrollments, 0);
  const filterActive = lga !== ANY || schoolType !== ANY;

  return (
    <DashboardShell title="Analytics">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Analytics & trends
            </h1>
            <p className="text-sm text-muted-foreground">Drill down into platform activity, engagement and course performance.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end">
              <div>
                <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> LGA</Label>
                <Select value={lga} onValueChange={setLga}>
                  <SelectTrigger><SelectValue placeholder="All LGAs" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All LGAs</SelectItem>
                    {lgas.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><School className="h-3 w-3" /> School type</Label>
                <Select value={schoolType} onValueChange={setSchoolType}>
                  <SelectTrigger><SelectValue placeholder="All school types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All school types</SelectItem>
                    {schoolTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Time window</Label>
                <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterActive && (
                <Button variant="ghost" onClick={() => { setLga(ANY); setSchoolType(ANY); }}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
            {filterActive && (
              <div className="flex flex-wrap gap-2 mt-3">
                {lga !== ANY && <Badge variant="secondary">LGA: {lga}</Badge>}
                {schoolType !== ANY && <Badge variant="secondary">School type: {schoolType}</Badge>}
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Users />} label="Learners" value={t?.total_learners ?? "—"} />
          <Kpi icon={<GraduationCap />} label="Teachers" value={t?.total_teachers ?? "—"} />
          <Kpi icon={<BookOpen />} label="Courses" value={t?.total_courses ?? "—"} />
          <Kpi icon={<TrendingUp />} label={`Enrollments (${days}d)`} value={totalEnroll} />
          <Kpi icon={<Users />} label={`New signups (${days}d)`} value={totalSignups} />
          <Kpi icon={<Award />} label="Avg completion" value={`${avgCompletion}%`} />
          <Kpi icon={<Award />} label="Certificates" value={t?.certificates_issued ?? "—"} />
          <Kpi icon={<BookOpen />} label="Total enrollments" value={t?.total_enrollments ?? "—"} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title={`Daily active users (last ${days} days)`}>
            <AreaChart data={data?.dau ?? []}>
              <defs>
                <linearGradient id="dauG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="active_users" stroke="hsl(var(--primary))" fill="url(#dauG)" strokeWidth={2}>
                <LabelList dataKey="active_users" position="top" style={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
              </Area>
            </AreaChart>
          </ChartCard>

          <ChartCard title={`Signups vs enrollments (last ${days} days)`}>
            <LineChart data={mergeDaily(data?.signups, data?.enrollments)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="signups" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }}>
                <LabelList dataKey="signups" position="top" style={{ fontSize: 11, fill: "hsl(var(--accent))" }} />
              </Line>
              <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }}>
                <LabelList dataKey="enrollments" position="bottom" style={{ fontSize: 11, fill: "hsl(var(--primary))" }} />
              </Line>
            </LineChart>
          </ChartCard>

          <ChartCard title="Top courses by enrollment">
            {(data?.top_courses ?? []).length === 0 ? (
              <EmptyChart text="No enrollments in this scope." />
            ) : (
              <BarChart data={data!.top_courses} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="enrollments" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="enrollments" position="right" style={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                </Bar>
              </BarChart>
            )}
          </ChartCard>

          <ChartCard title="Learners by school type">
            {(data?.by_school_type ?? []).length === 0 ? (
              <EmptyChart text="No learners in this scope." />
            ) : (
              <PieChart>
                <Pie data={data!.by_school_type} dataKey="learners" nameKey="school_type" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}>
                  {data!.by_school_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Learners by LGA (top 12)" height={360}>
          {(data?.by_lga ?? []).length === 0 ? (
            <EmptyChart text="No LGA data in this scope." />
          ) : (
            <BarChart data={data!.by_lga} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="lga" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-25} textAnchor="end" interval={0} height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="learners" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ChartCard>

        <ChartCard title="Course completion rates" height={360}>
          {(data?.completion ?? []).length === 0 ? (
            <EmptyChart text="No completion data in this scope." />
          ) : (
            <BarChart data={data!.completion} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-25} textAnchor="end" interval={0} height={70} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={tooltipStyle} />
              <Bar dataKey="completion_pct" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ChartCard>
      </div>
    </DashboardShell>
  );
}

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 };

function mergeDaily(a?: { day: string; signups: number }[], b?: { day: string; enrollments: number }[]) {
  const map = new Map<string, { day: string; signups: number; enrollments: number }>();
  (a ?? []).forEach((r) => map.set(r.day, { day: r.day, signups: r.signups, enrollments: 0 }));
  (b ?? []).forEach((r) => {
    const e = map.get(r.day) ?? { day: r.day, signups: 0, enrollments: 0 };
    e.enrollments = r.enrollments;
    map.set(r.day, e);
  });
  return Array.from(map.values());
}

function ChartCard({ title, children, height = 300 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">{children as any}</ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{text}</div>;
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
