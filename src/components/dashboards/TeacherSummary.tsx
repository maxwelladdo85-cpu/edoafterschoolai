import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Users, FileText, Plus, Sparkles, ArrowRight, ClipboardCheck, Wand2 } from "lucide-react";
import { VirtualClassesPanel } from "@/components/VirtualClassesPanel";
import { AiTeachingAssistantPanel } from "@/components/AiTeachingAssistantPanel";

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
  const { user, role } = useAuth();
  const isScripter = role === "scripter";
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState(0);
  const [lessons, setLessons] = useState(0);
  const [assessments, setAssessments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; class_level: string | null; schoolName: string | null } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name,class_level,school_id" as any)
        .eq("id", user.id)
        .maybeSingle();
      let schoolName: string | null = null;
      const profSchoolId = (prof as any)?.school_id as string | null | undefined;
      if (profSchoolId) {
        const { data: sch } = await supabase.from("schools").select("name").eq("id", profSchoolId).maybeSingle();
        schoolName = sch?.name ?? null;
      }
      setProfile({ full_name: (prof as any)?.full_name ?? null, class_level: (prof as any)?.class_level ?? null, schoolName });
      const { data: cs } = await supabase
        .from("courses")
        .select("id,title,subject,class_level,is_active,created_at,thumbnail_url")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      const list = cs ?? [];
      setCourses(list);
      const ids = list.map((c) => c.id);
      if (ids.length) {
        const [{ count: ec }, { data: mods }, { count: qc }] = await Promise.all([
          supabase.from("enrollments").select("id", { count: "exact", head: true }).in("course_id", ids),
          supabase.from("modules").select("id").in("course_id", ids),
          supabase.from("quizzes").select("id", { count: "exact", head: true }).in("course_id", ids),
        ]);
        setEnrollments(ec ?? 0);
        setAssessments(qc ?? 0);
        const modIds = (mods ?? []).map((m) => m.id);
        if (modIds.length) {
          const { count: lc } = await supabase.from("lessons").select("id", { count: "exact", head: true }).in("module_id", modIds);
          setLessons(lc ?? 0);
        } else setLessons(0);
      } else {
        setEnrollments(0);
        setLessons(0);
        setAssessments(0);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const active = courses.filter((c) => c.is_active).length;
  const drafts = courses.length - active;

  const stats = [
    { label: isScripter ? "Total courses" : "Total lessons", value: courses.length, icon: GraduationCap, tint: "from-primary/15 to-primary/5", iconClass: "bg-primary/10 text-primary" },
    { label: "Active", value: active, icon: BookOpen, tint: "from-emerald-500/15 to-emerald-500/5", iconClass: "bg-primary/10 text-primary" },
    { label: "Drafts", value: drafts, icon: FileText, tint: "from-gold/20 to-gold/5", iconClass: "bg-gold/15 text-gold-foreground" },
    { label: "Enrollments", value: enrollments, icon: Users, tint: "from-destructive/15 to-destructive/5", iconClass: "bg-destructive/10 text-destructive" },
    { label: "Assessments", value: assessments, icon: ClipboardCheck, tint: "from-sky-500/15 to-sky-500/5", iconClass: "bg-sky-500/10 text-sky-600" },
  ];

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? (isScripter ? "Scripter" : "Teacher");
  const eyebrowLabel = isScripter ? "Sub Admin - Scripter" : "Teacher workspace";
  const heroTitle = isScripter ? "Sub Admin - Scripter" : "Teacher Workspace";
  const heroDesc = isScripter
    ? "Create and upload courses, schedule Zoom classes, and share them with teachers."
    : "A snapshot of everything you've created — lessons and learners — in one elegant view.";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-8 md:p-10 text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="absolute -right-24 -top-24 h-56 w-56 sm:h-72 sm:w-72 rounded-full opacity-30 blur-3xl"
          style={{ backgroundImage: "var(--gradient-gold)" }} />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 sm:h-56 sm:w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {eyebrowLabel}
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:mt-4 sm:text-3xl md:text-5xl">
              {isScripter ? "Welcome Scripter" : `Welcome back, ${firstName}.`}
            </h1>
            <p className="mt-2 text-sm sm:mt-3 sm:text-base md:text-lg text-white/85">
              {heroDesc}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isScripter && (
              <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20 border">
                <Link to="/courses/builder"><Wand2 className="mr-2 h-4 w-4" />Create course</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Card
            key={s.label}
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${s.tint}`}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${s.iconClass}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight">{loading ? "—" : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <VirtualClassesPanel mode="teacher" />

      <AiTeachingAssistantPanel />

      {/* Recent courses */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{isScripter ? "Recent courses" : "Recent lessons"}</h2>
            <p className="text-sm text-muted-foreground">{lessons} lesson{lessons === 1 ? "" : "s"} across your {isScripter ? "courses" : "lessons"}.</p>
          </div>
          <Button asChild variant="ghost" className="gap-1">
            <Link to="/my-courses">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card className="border-dashed" style={{ background: "var(--gradient-emerald-soft)" }}>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-7 w-7" />
              </div>
              <p className="text-base font-medium">{isScripter ? "No courses yet" : "No lessons yet"}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{isScripter ? "Create your first course and start sharing knowledge with learners across Edo State." : "Lessons assigned to you will appear here."}</p>
              {isScripter && <Button asChild className="mt-2"><Link to="/courses/builder"><Wand2 className="mr-2 h-4 w-4" />Open Course Builder</Link></Button>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {courses.slice(0, 5).map((c) => (
              <Card
                key={c.id}
                className="group overflow-hidden border-border/60 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                  <div
                    className="relative h-14 w-20 flex-none overflow-hidden rounded-lg bg-muted bg-cover bg-center ring-1 ring-border sm:h-16 sm:w-28"
                    style={c.thumbnail_url
                      ? { backgroundImage: `url(${c.thumbnail_url})` }
                      : { backgroundImage: "var(--gradient-hero)" }}
                  >
                    {!c.thumbnail_url && (
                      <div className="absolute inset-0 flex items-center justify-center text-white/80">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 break-words font-semibold sm:truncate">{c.title}</h3>
                      <Badge
                        variant={c.is_active ? "default" : "secondary"}
                        className={c.is_active ? "" : "bg-gold/20 text-gold-foreground hover:bg-gold/30"}
                      >
                        {c.is_active ? "Active" : "Draft"}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {[c.subject, c.class_level].filter(Boolean).join(" · ") || "No subject yet"}
                    </p>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">
                    {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <Button size="sm" variant="outline" asChild className="shrink-0">
                    <Link to="/courses/$courseId" params={{ courseId: c.id }}><BookOpen className="mr-1 h-3.5 w-3.5" />Preview</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
