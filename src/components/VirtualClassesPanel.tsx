import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, ExternalLink, PlayCircle } from "lucide-react";
import { formatWhen, getStatus, type VirtualClass } from "@/lib/virtual-classes";
import { toast } from "sonner";

interface Props {
  /** "teacher" shows classes the user teaches; "learner" shows classes for courses the user is enrolled in. */
  mode: "teacher" | "learner";
  /** Limit number of items shown (default 4). */
  limit?: number;
}

interface Row extends VirtualClass {
  course?: { title: string } | null;
}

export function VirtualClassesPanel({ mode, limit = 4 }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [, force] = useState(0);

  // Re-render every 30s so live/ended status flips automatically
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Fetch upcoming/live first (priority), then fill remaining slots with recent past sessions.
      const nowIso = new Date().toISOString();
      const pastCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: upcomingData, error: upErr }, { data: pastData, error: pastErr }] = await Promise.all([
        (supabase as any)
          .from("virtual_classes")
          .select("*")
          .gte("scheduled_at", nowIso)
          .order("scheduled_at", { ascending: true })
          .limit(limit),
        (supabase as any)
          .from("virtual_classes")
          .select("*")
          .lt("scheduled_at", nowIso)
          .gte("scheduled_at", pastCutoff)
          .order("scheduled_at", { ascending: false })
          .limit(limit),
      ]);
      if (cancelled) return;
      if (upErr || pastErr) {
        console.error(upErr || pastErr);
        setRows([]);
      } else {
        // Upcoming/live first; then past to fill up to `limit`.
        const upcoming = (upcomingData as Row[]) ?? [];
        const past = (pastData as Row[]) ?? [];
        const list = [...upcoming, ...past].slice(0, limit);
        const courseIds = Array.from(new Set(list.map((r) => (r as any).course_id).filter(Boolean)));
        if (courseIds.length) {
          const { data: cs } = await supabase.from("courses").select("id,title").in("id", courseIds);
          const map = new Map((cs ?? []).map((c: any) => [c.id, c.title]));
          setRows(list.map((r) => ({ ...r, course: { title: map.get((r as any).course_id) ?? "" } })));
        } else {
          setRows(list);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, limit]);

  const handleJoin = async (c: Row) => {
    if (mode === "learner" && user) {
      // Log attendance (idempotent via UNIQUE constraint)
      await (supabase as any)
        .from("virtual_class_attendance")
        .insert({ class_id: c.id, learner_id: user.id });
    }
    window.open(c.zoom_url, "_blank", "noopener,noreferrer");
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" /> Virtual Classes
        </h2>
      </div>

      {loading ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {mode === "teacher" ? "No virtual classes scheduled yet." : "No upcoming classes from your enrolled courses."}
            </p>
            {mode === "teacher" && (
              <Button asChild size="sm" className="mt-2">
                <Link to="/virtual-classes">Schedule a class</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((c) => {
            const status = getStatus(c);
            return (
              <Card key={c.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{c.title}</CardTitle>
                      <CardDescription className="truncate">
                        {c.course?.title ?? "Course"} · {c.duration_minutes} min
                      </CardDescription>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {formatWhen(c.scheduled_at)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {status !== "ended" && (
                      <Button
                        size="sm"
                        onClick={() => handleJoin(c)}
                        disabled={status === "upcoming"}
                        title={status === "upcoming" ? "Join opens 10 minutes before start" : undefined}
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        {status === "live" ? "Join Class" : "Join (opens soon)"}
                      </Button>
                    )}
                    {c.recording_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={c.recording_url} target="_blank" rel="noopener noreferrer">
                          <PlayCircle className="mr-1 h-3.5 w-3.5" /> Watch recording
                        </a>
                      </Button>
                    )}
                    {status === "ended" && !c.recording_url && (
                      <Badge variant="outline" className="text-xs">Recording not yet posted</Badge>
                    )}
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

function StatusBadge({ status }: { status: ReturnType<typeof getStatus> }) {
  if (status === "live") return <Badge className="bg-destructive text-destructive-foreground animate-pulse">LIVE</Badge>;
  if (status === "upcoming") return <Badge variant="secondary">Upcoming</Badge>;
  return <Badge variant="outline">Ended</Badge>;
}
