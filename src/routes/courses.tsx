import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses")({
  component: CoursesLibrary,
});

interface CourseRow {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  thumbnail_url: string | null;
  class_level: string | null;
  teacher_name: string | null;
  teacher_id: string;
  teacher: { full_name: string | null } | null;
}

function CoursesLibrary() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: cs }, { data: es }] = await Promise.all([
        supabase
          .from("courses")
          .select("id, title, subject, description, thumbnail_url, teacher_id, teacher:profiles!courses_teacher_id_fkey(full_name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("enrollments").select("course_id").eq("learner_id", user.id),
      ]);
      // Fallback: if FK alias didn't resolve, fetch profiles separately
      let rows: CourseRow[] = (cs as any) ?? [];
      if (rows.length && !rows[0].teacher) {
        const ids = Array.from(new Set(rows.map((r) => r.teacher_id)));
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
        rows = rows.map((r) => ({ ...r, teacher: { full_name: map.get(r.teacher_id) ?? null } }));
      }
      setCourses(rows);
      setEnrolledIds(new Set((es ?? []).map((e: any) => e.course_id)));
      setLoading(false);
    })();
  }, [user]);

  const enroll = async (courseId: string) => {
    if (!user) return;
    setEnrollingId(courseId);
    const { error } = await supabase.from("enrollments").insert({ learner_id: user.id, course_id: courseId, progress: 0 });
    setEnrollingId(null);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return toast.error(error.message);
    }
    setEnrolledIds((s) => new Set(s).add(courseId));
    toast.success("Enrolled — opening course");
    nav({ to: "/courses/$courseId", params: { courseId } });
  };

  return (
    <DashboardShell title="Course Library">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Course Library</h1>
          <p className="text-muted-foreground">Browse and enroll in courses from Edo SUBEB teachers.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading courses…
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10" />
              <p>No active courses available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => {
              const enrolled = enrolledIds.has(c.id);
              return (
                <Card key={c.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-gold/15 to-accent/15">
                        <GraduationCap className="h-12 w-12 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{c.title}</CardTitle>
                      {c.subject && <Badge variant="secondary">{c.subject}</Badge>}
                    </div>
                    <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Teacher: <span className="font-medium text-foreground">{c.teacher?.full_name ?? "—"}</span>
                    </p>
                    {enrolled ? (
                      <Button asChild className="w-full" variant="secondary">
                        <Link to="/courses/$courseId" params={{ courseId: c.id }}>Continue learning</Link>
                      </Button>
                    ) : (
                      <Button className="w-full" disabled={enrollingId === c.id} onClick={() => enroll(c.id)}>
                        {enrollingId === c.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enrolling…</> : "Enroll"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
