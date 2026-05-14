import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Users, FileText, Plus } from "lucide-react";

interface CourseRow {
  id: string;
  title: string;
  subject: string | null;
  class_level: string | null;
  is_active: boolean;
  created_at: string;
  thumbnail_url: string | null;
}

export function TeacherSummary() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState(0);
  const [lessons, setLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: cs } = await supabase
        .from("courses")
        .select("id,title,subject,class_level,is_active,created_at,thumbnail_url")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      const list = cs ?? [];
      setCourses(list);
      const ids = list.map((c) => c.id);
      if (ids.length) {
        const [{ count: ec }, { data: mods }] = await Promise.all([
          supabase.from("enrollments").select("id", { count: "exact", head: true }).in("course_id", ids),
          supabase.from("modules").select("id").in("course_id", ids),
        ]);
        setEnrollments(ec ?? 0);
        const modIds = (mods ?? []).map((m) => m.id);
        if (modIds.length) {
          const { count: lc } = await supabase.from("lessons").select("id", { count: "exact", head: true }).in("module_id", modIds);
          setLessons(lc ?? 0);
        } else setLessons(0);
      } else {
        setEnrollments(0);
        setLessons(0);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const active = courses.filter((c) => c.is_active).length;
  const drafts = courses.length - active;

  const stats = [
    { label: "Total courses", value: courses.length, icon: GraduationCap },
    { label: "Active", value: active, icon: BookOpen },
    { label: "Drafts", value: drafts, icon: FileText },
    { label: "Enrollments", value: enrollments, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Welcome back</h1>
          <p className="text-lg text-muted-foreground">Here's a snapshot of the courses you've created.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/my-courses"><GraduationCap className="mr-2 h-4 w-4" />Manage courses</Link></Button>
          <Button asChild><Link to="/my-courses"><Plus className="mr-2 h-4 w-4" />Create New Course</Link></Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{loading ? "—" : s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent courses</h2>
          <Button asChild variant="link"><Link to="/my-courses">View all</Link></Button>
        </div>
        {courses.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10" />
            <p>You haven't created any courses yet.</p>
            <Button asChild><Link to="/my-courses"><Plus className="mr-2 h-4 w-4" />Create your first course</Link></Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {courses.slice(0, 5).map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="h-14 w-24 flex-none rounded-md bg-muted bg-cover bg-center"
                    style={c.thumbnail_url ? { backgroundImage: `url(${c.thumbnail_url})` } : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{c.title}</h3>
                      <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Draft"}</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{[c.subject, c.class_level].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <div className="hidden text-right text-sm text-muted-foreground sm:block">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground">{lessons} lesson{lessons === 1 ? "" : "s"} across your courses.</p>
      </section>
    </div>
  );
}
