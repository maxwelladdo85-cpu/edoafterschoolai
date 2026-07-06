import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import heroLibrary from "@/assets/hero-library.jpg";

export const Route = createFileRoute("/courses/")({
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
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrolledMap, setEnrolledMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const isTeacher = role === "teacher";

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (!user || !role) return;
    (async () => {
      setLoading(true);
      let coursesQuery = supabase
        .from("courses")
        .select("id, title, subject, description, thumbnail_url, class_level, teacher_name, teacher_id")
        .order("created_at", { ascending: false });
      if (isTeacher) {
        coursesQuery = coursesQuery.eq("teacher_id", user.id);
      }
      const [{ data: cs }, { data: es }] = await Promise.all([
        coursesQuery,
        isTeacher
          ? Promise.resolve({ data: [] as { course_id: string; progress: number }[] })
          : supabase.from("enrollments").select("course_id, progress").eq("learner_id", user.id),
      ]);
      let rows: CourseRow[] = ((cs as any) ?? []).map((r: any) => ({ ...r, teacher: null }));
      if (rows.length) {
        const ids = Array.from(new Set(rows.map((r) => r.teacher_id)));
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
        rows = rows.map((r) => ({ ...r, teacher: { full_name: map.get(r.teacher_id) ?? null } }));
      }
      setCourses(rows);
      const em = new Map<string, number>();
      (es ?? []).forEach((e: any) => em.set(e.course_id, e.progress));
      setEnrolledMap(em);
      setLoading(false);
    })();
  }, [user, role, isTeacher]);

  const enroll = async (courseId: string) => {
    if (!user) return;
    setEnrollingId(courseId);
    const { error } = await supabase.from("enrollments").insert({ learner_id: user.id, course_id: courseId, progress: 0 });
    setEnrollingId(null);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return toast.error(error.message);
    }
    setEnrolledMap((prev) => {
      const next = new Map(prev);
      next.set(courseId, 0);
      return next;
    });
    toast.success("Enrolled — opening course");
    nav({ to: "/courses/$courseId", params: { courseId } });
  };


  return (
    <DashboardShell title="Course Library">
      <div className="space-y-8">
        <PageHero
          eyebrow={isTeacher ? "Your courses" : "Browse & enroll"}
          EyebrowIcon={GraduationCap}
          title="Course Library"
          description={isTeacher ? "Courses you have created for your learners." : "Discover and enroll in courses created by Edo SUBEB teachers."}
          backgroundImage={heroLibrary}
        />


        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading courses…
          </div>
        ) : courses.length === 0 ? (
          <Card className="border-dashed" style={{ background: "var(--gradient-emerald-soft)" }}>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-7 w-7" />
              </div>
              <p className="text-base font-medium">No active courses yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">Check back soon — teachers are publishing new courses regularly.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => {
              const progress = enrolledMap.get(c.id);
              const enrolled = progress !== undefined;
              const isComplete = enrolled && progress >= 100;
              return (
                <Card key={c.id} className="overflow-hidden flex flex-col border-border/60 transition-all hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-card)" }}>
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
                      <div className="flex flex-col items-end gap-1">
                        {c.subject && <Badge variant="secondary">{c.subject}</Badge>}
                        {c.class_level && <Badge variant="outline">{c.class_level}</Badge>}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Teacher: <span className="font-medium text-foreground">{c.teacher_name ?? c.teacher?.full_name ?? "—"}</span>
                    </p>
                    {isTeacher ? (
                      <Button asChild className="w-full" variant="secondary">
                        <Link to="/courses/$courseId" params={{ courseId: c.id }}>Preview</Link>
                      </Button>
                    ) : isComplete ? (
                      <Button asChild className="w-full font-semibold shadow-md hover:shadow-lg transition-shadow">
                        <Link to="/courses/$courseId" params={{ courseId: c.id }}>
                          <RefreshCw className="mr-2 h-4 w-4" /> Take course again
                        </Link>
                      </Button>
                    ) : enrolled ? (
                      <Button asChild className="w-full font-semibold shadow-md hover:shadow-lg transition-shadow">
                        <Link to="/courses/$courseId" params={{ courseId: c.id }}>
                          <PlayCircle className="mr-2 h-4 w-4" /> Continue learning
                        </Link>
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
