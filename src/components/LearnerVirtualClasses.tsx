import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, ExternalLink } from "lucide-react";
import { formatWhen, getStatus, type VirtualClass } from "@/lib/virtual-classes";

interface Row extends VirtualClass {
  course?: { title: string } | null;
}

export function LearnerVirtualClasses() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [, force] = useState(0);

  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      // RLS already scopes to classes for courses the learner is enrolled in.
      const { data, error } = await (supabase as any)
        .from("virtual_classes")
        .select("*")
        .gte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error(error);
        setRows([]);
      } else {
        const list = (data as Row[]) ?? [];
        const courseIds = Array.from(new Set(list.map((r) => r.course_id).filter((id): id is string => !!id)));
        if (courseIds.length) {
          const { data: cs } = await supabase.from("courses").select("id,title").in("id", courseIds);
          const map = new Map((cs ?? []).map((c: any) => [c.id, c.title]));
          setRows(list.map((r) => ({ ...r, course: { title: map.get(r.course_id ?? "") ?? "" } })));
        } else {
          setRows(list);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" /> Upcoming Virtual Classes
        </h1>
        <p className="text-sm text-muted-foreground">Live sessions scheduled for the courses you're enrolled in.</p>
      </div>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          No upcoming classes scheduled. Check back later.
        </CardContent></Card>
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
                      : <Badge variant="secondary">Upcoming</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {formatWhen(c.scheduled_at)}
                  </p>
                  {c.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  )}
                  <Button size="sm" asChild>
                    <a href={c.zoom_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      {status === "live" ? "Join now" : "Open Zoom"}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
