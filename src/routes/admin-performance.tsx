import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Sparkles, BookOpen, ClipboardCheck, UserPlus, RefreshCw, Wifi, CalendarRange, Download, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-performance")({
  component: AdminPerformancePage,
});

type ActivityRow = {
  occurred_at: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  action: string;
  detail: string | null;
};


type Perf = {
  active_today: number;
  online_now: number;
  lesson_views_last_hour: number;
  ai_messages_today: number;
  ai_messages_last_hour: number;
  quiz_attempts_today: number;
  new_signups_today: number;
  top_ai_users_today: { full_name: string | null; email: string | null; message_count: number }[];
};

function AdminPerformancePage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [perf, setPerf] = useState<Perf | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const sevenAgo = format(new Date(Date.now() - 6 * 86400000), "yyyy-MM-dd");
  const [fromDate, setFromDate] = useState(sevenAgo);
  const [toDate, setToDate] = useState(today);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [actLoading, setActLoading] = useState(false);
  const [actLoaded, setActLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
    if (!loading && user && role && role !== "admin") nav({ to: "/dashboard" });
  }, [loading, user, role, nav]);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_performance_stats");
    setBusy(false);
    if (error) return toast.error(error.message);
    setPerf(data as unknown as Perf);
    setRefreshedAt(new Date());
  };

  const loadActivity = async (fromArg?: string, toArg?: string) => {
    const f = fromArg ?? fromDate;
    const t = toArg ?? toDate;
    if (!f || !t) return toast.error("Pick a date range");
    if (f > t) return toast.error("From date must be on or before To date");
    setActLoading(true);
    const fromIso = new Date(`${f}T00:00:00`).toISOString();
    const toIso = new Date(`${t}T23:59:59.999`).toISOString();
    const { data, error } = await supabase.rpc("admin_activity_log_range", {
      p_from: fromIso, p_to: toIso, p_limit: 10000,
    });
    setActLoading(false);
    if (error) return toast.error(error.message);
    setActivity((data ?? []) as ActivityRow[]);
    setActLoaded(true);
    toast.success(`Loaded ${(data ?? []).length} event(s)`);
  };

  const filteredActivity = useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    return activity.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (!q) return true;
      return (r.full_name ?? "").toLowerCase().includes(q)
        || (r.email ?? "").toLowerCase().includes(q)
        || (r.detail ?? "").toLowerCase().includes(q)
        || r.action.toLowerCase().includes(q);
    });
  }, [activity, activitySearch, actionFilter]);

  const actionOptions = useMemo(() => Array.from(new Set(activity.map((a) => a.action))).sort(), [activity]);

  const downloadActivity = () => {
    if (filteredActivity.length === 0) return toast.error("No data to download");
    const headers = ["occurred_at", "full_name", "email", "role", "action", "detail"];
    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...filteredActivity.map((r) => headers.map((h) => escape((r as any)[h])).join(","))].join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `activity-${fromDate}_to_${toDate}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filteredActivity.length} event(s)`);
  };

  const setPreset = (days: number) => {
    const from = format(new Date(Date.now() - (days - 1) * 86400000), "yyyy-MM-dd");
    setFromDate(from);
    setToDate(today);
    loadActivity(from, today);
  };

  useEffect(() => {
    if (role === "admin") {
      load();
      const t = setInterval(load, 30000);
      return () => clearInterval(t);
    }
  }, [role]);

  if (loading || !user || role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }



  return (
    <DashboardShell title="Performance">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" /> Live performance
            </h1>
            <p className="text-sm text-muted-foreground">
              Auto-refreshes every 30 seconds.
              {refreshedAt && ` Last update: ${refreshedAt.toLocaleTimeString()}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Wifi />} label="Online now (last 5 min)" value={perf?.online_now ?? "—"} />
          <Stat icon={<Users />} label="Active users today" value={perf?.active_today ?? "—"} />
          <Stat icon={<UserPlus />} label="New signups today" value={perf?.new_signups_today ?? "—"} />
          <Stat icon={<BookOpen />} label="Lesson views (last hour)" value={perf?.lesson_views_last_hour ?? "—"} />
          <Stat icon={<Sparkles />} label="AI messages today" value={perf?.ai_messages_today ?? "—"} />
          <Stat icon={<Sparkles />} label="AI messages (last hour)" value={perf?.ai_messages_last_hour ?? "—"} />
          <Stat icon={<ClipboardCheck />} label="Quiz attempts today" value={perf?.quiz_attempts_today ?? "—"} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Top AI Tutor users today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!perf?.top_ai_users_today?.length ? (
                    <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No AI Tutor usage yet today.</TableCell></TableRow>
                  ) : perf.top_ai_users_today.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell>{u.email ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{u.message_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" /> Activity by date range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] items-end">
              <div>
                <Label htmlFor="from-date" className="text-xs">From</Label>
                <Input id="from-date" type="date" value={fromDate} max={toDate || today} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="to-date" className="text-xs">To</Label>
                <Input id="to-date" type="date" value={toDate} min={fromDate} max={today} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <Button onClick={() => loadActivity()} disabled={actLoading}>
                {actLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Loading…</> : "View activity"}
              </Button>
              <Button variant="outline" onClick={downloadActivity} disabled={filteredActivity.length === 0}>
                <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPreset(1)}>Today</Button>
              <Button size="sm" variant="ghost" onClick={() => setPreset(7)}>Last 7 days</Button>
              <Button size="sm" variant="ghost" onClick={() => setPreset(30)}>Last 30 days</Button>
              <Button size="sm" variant="ghost" onClick={() => setPreset(90)}>Last 90 days</Button>
            </div>

            {actLoaded && (
              <>
                <div className="grid gap-2 sm:grid-cols-[1fr_220px] items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email, action or detail"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <option value="">All actions</option>
                    {actionOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{filteredActivity.length}</Badge>
                  <span>event(s) shown {filteredActivity.length !== activity.length && `(of ${activity.length} loaded)`}</span>
                </div>

                <div className="rounded-md border max-h-[480px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivity.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No activity in this range.
                          </TableCell>
                        </TableRow>
                      ) : filteredActivity.slice(0, 500).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs whitespace-nowrap">{new Date(r.occurred_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="font-medium">{r.full_name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{r.email ?? ""}</div>
                          </TableCell>
                          <TableCell><Badge variant={r.role === "admin" ? "destructive" : r.role === "teacher" ? "default" : "secondary"}>{r.role}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{r.action}</TableCell>
                          <TableCell className="text-xs">{r.detail ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredActivity.length > 500 && (
                    <p className="p-3 text-center text-xs text-muted-foreground border-t">
                      Showing first 500 — download CSV to see all {filteredActivity.length}.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p><strong>About these metrics:</strong> "Online now" counts unique learners who viewed a lesson, sent an AI message, or sent a direct message in the last 5 minutes.</p>
            <p>AI Tutor rate limits per learner: 10/minute, 100/hour, 400/day.</p>
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
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
