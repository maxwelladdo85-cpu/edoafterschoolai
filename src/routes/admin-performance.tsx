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

  const loadActivity = async () => {
    if (!fromDate || !toDate) return toast.error("Pick a date range");
    if (fromDate > toDate) return toast.error("From date must be on or before To date");
    setActLoading(true);
    const fromIso = new Date(`${fromDate}T00:00:00`).toISOString();
    const toIso = new Date(`${toDate}T23:59:59.999`).toISOString();
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
    setFromDate(format(new Date(Date.now() - (days - 1) * 86400000), "yyyy-MM-dd"));
    setToDate(today);
  };


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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
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
