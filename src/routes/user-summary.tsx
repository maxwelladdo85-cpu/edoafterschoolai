import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, FileText, Video, Music, FileType2, FolderPlus,
  ImageIcon, BookOpen, ClipboardList, CheckCircle2, UserPlus, PlayCircle, CalendarPlus,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import heroSummary from "@/assets/hero-summary.jpg";

type Activity = {
  id: string;
  ts: string;
  icon: any;
  label: string;
  detail?: string;
  badge?: string;
  href?: string;
  actor?: string;
  actorRole?: string;
};

export const Route = createFileRoute("/user-summary")({
  component: UserSummaryPage,
});

function UserSummaryPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    const load = async () => {
      if (!user || !role) return;
      setBusy(true);
      const items: Activity[] = [];

      if (role === "admin") {
        // Cross-role platform activity feed
        const [
          { data: profiles },
          { data: roles },
          { data: courses },
          { data: lessons },
          { data: enrolls },
          { data: attempts },
          { data: completions },
          { data: vClasses },
          { data: vAttend },
        ] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email"),
          supabase.from("user_roles").select("user_id, role"),
          supabase.from("courses").select("id, title, teacher_id, created_at, is_active").order("created_at", { ascending: false }).limit(100),
          supabase.from("lessons").select("id, title, content_type, module_id, created_at, modules(course_id, courses(title, teacher_id))").order("created_at", { ascending: false }).limit(100),
          supabase.from("enrollments").select("id, learner_id, course_id, enrolled_at, courses(title)").order("enrolled_at", { ascending: false }).limit(100),
          supabase.from("quiz_attempts").select("id, learner_id, quiz_id, score, max_score, started_at, submitted_at, quizzes(title)").order("started_at", { ascending: false }).limit(100),
          supabase.from("lesson_completions").select("id, learner_id, lesson_id, completed_at, lessons(title)").order("completed_at", { ascending: false }).limit(100),
          supabase.from("virtual_classes").select("id, title, teacher_id, scheduled_at, created_at, courses(title)").order("created_at", { ascending: false }).limit(100),
          supabase.from("virtual_class_attendance").select("id, learner_id, class_id, joined_at, virtual_classes(title)").order("joined_at", { ascending: false }).limit(100),
        ]);

        const nameMap = new Map<string, string>();
        (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name || p.email || "Unknown user"));
        const roleMap = new Map<string, string>();
        (roles ?? []).forEach((r: any) => {
          const cur = roleMap.get(r.user_id);
          // Prefer admin > teacher > learner for display
          if (!cur || r.role === "admin" || (r.role === "teacher" && cur === "learner")) roleMap.set(r.user_id, r.role);
        });
        const who = (uid: string) => ({ actor: nameMap.get(uid) ?? "Unknown", actorRole: roleMap.get(uid) });

        for (const c of courses ?? []) {
          const w = who(c.teacher_id);
          items.push({
            id: `acourse-${c.id}`, ts: c.created_at, icon: GraduationCap,
            label: `Created course "${c.title}"`,
            badge: c.is_active ? "Active" : "Draft",
            href: `/courses/${c.id}`, ...w,
          });
        }
        for (const l of (lessons ?? []) as any[]) {
          const teacherId = l.modules?.courses?.teacher_id;
          const w = teacherId ? who(teacherId) : {};
          const icon = l.content_type === "video" ? Video : l.content_type === "audio" ? Music : l.content_type === "pdf" ? FileText : l.content_type === "doc" ? FileType2 : FileText;
          items.push({
            id: `alesson-${l.id}`, ts: l.created_at, icon,
            label: `Added ${l.content_type} lesson "${l.title}"`,
            detail: l.modules?.courses?.title ? `in ${l.modules.courses.title}` : undefined,
            ...w,
          });
        }
        for (const vc of (vClasses ?? []) as any[]) {
          const w = who(vc.teacher_id);
          items.push({
            id: `avc-${vc.id}`, ts: vc.created_at, icon: CalendarPlus,
            label: `Scheduled virtual class "${vc.title}"`,
            detail: vc.courses?.title ? `for ${vc.courses.title} · ${new Date(vc.scheduled_at).toLocaleString()}` : new Date(vc.scheduled_at).toLocaleString(),
            ...w,
          });
        }
        for (const e of (enrolls ?? []) as any[]) {
          const w = who(e.learner_id);
          items.push({
            id: `aenroll-${e.id}`, ts: e.enrolled_at, icon: UserPlus,
            label: `Enrolled in "${e.courses?.title ?? "a course"}"`,
            href: `/courses/${e.course_id}`, ...w,
          });
        }
        for (const a of (attempts ?? []) as any[]) {
          const w = who(a.learner_id);
          items.push({
            id: `aattempt-${a.id}`, ts: a.submitted_at ?? a.started_at, icon: CheckCircle2,
            label: a.submitted_at ? `Completed quiz "${a.quizzes?.title ?? ""}"` : `Started quiz "${a.quizzes?.title ?? ""}"`,
            detail: a.submitted_at ? `Score: ${a.score} / ${a.max_score}` : undefined,
            ...w,
          });
        }
        for (const lc of (completions ?? []) as any[]) {
          const w = who(lc.learner_id);
          items.push({
            id: `acomp-${lc.id}`, ts: lc.completed_at, icon: CheckCircle2,
            label: `Completed lesson "${lc.lessons?.title ?? ""}"`,
            ...w,
          });
        }
        for (const at of (vAttend ?? []) as any[]) {
          const w = who(at.learner_id);
          items.push({
            id: `aattend-${at.id}`, ts: at.joined_at, icon: PlayCircle,
            label: `Joined virtual class "${at.virtual_classes?.title ?? ""}"`,
            ...w,
          });
        }
      } else if (role === "teacher") {
        const { data: courses } = await supabase
          .from("courses")
          .select("id,title,subject,class_level,thumbnail_url,is_active,created_at")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false });

        const courseIds = (courses ?? []).map((c) => c.id);
        const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

        for (const c of courses ?? []) {
          items.push({
            id: `course-${c.id}`,
            ts: c.created_at,
            icon: GraduationCap,
            label: `Created course "${c.title}"`,
            detail: [c.subject, c.class_level].filter(Boolean).join(" · ") || undefined,
            badge: c.is_active ? "Active" : "Draft",
            href: `/courses/${c.id}`,
          });
          if (c.thumbnail_url) {
            items.push({
              id: `thumb-${c.id}`,
              ts: c.created_at,
              icon: ImageIcon,
              label: `Added a thumbnail to "${c.title}"`,
              href: `/courses/${c.id}`,
            });
          }
        }

        if (courseIds.length) {
          const { data: modules } = await supabase
            .from("modules")
            .select("id,course_id,title,created_at")
            .in("course_id", courseIds)
            .order("created_at", { ascending: false });

          const modIds = (modules ?? []).map((m) => m.id);
          const modCourse = new Map((modules ?? []).map((m) => [m.id, m.course_id]));

          for (const m of modules ?? []) {
            const c = courseMap.get(m.course_id);
            items.push({
              id: `mod-${m.id}`,
              ts: m.created_at,
              icon: FolderPlus,
              label: `Added module "${m.title}"`,
              detail: c ? `in ${c.title}` : undefined,
              href: c ? `/courses/${c.id}` : undefined,
            });
          }

          if (modIds.length) {
            const { data: lessons } = await supabase
              .from("lessons")
              .select("id,module_id,title,content_type,created_at")
              .in("module_id", modIds)
              .order("created_at", { ascending: false });

            for (const l of lessons ?? []) {
              const courseId = modCourse.get(l.module_id);
              const c = courseId ? courseMap.get(courseId) : undefined;
              const icon =
                l.content_type === "video" ? Video :
                l.content_type === "audio" ? Music :
                l.content_type === "pdf" ? FileText :
                l.content_type === "doc" ? FileType2 : FileText;
              const verb = l.content_type === "text" ? "Added text lesson" : `Uploaded ${l.content_type}`;
              items.push({
                id: `lesson-${l.id}`,
                ts: l.created_at,
                icon,
                label: `${verb} "${l.title}"`,
                detail: c ? `in ${c.title}` : undefined,
                href: c ? `/courses/${c.id}` : undefined,
              });
            }

            const { data: quizzes } = await supabase
              .from("quizzes")
              .select("id,course_id,title,created_at")
              .in("course_id", courseIds)
              .order("created_at", { ascending: false });

            for (const q of quizzes ?? []) {
              const c = courseMap.get(q.course_id);
              items.push({
                id: `quiz-${q.id}`,
                ts: q.created_at,
                icon: ClipboardList,
                label: `Created quiz "${q.title}"`,
                detail: c ? `in ${c.title}` : undefined,
                href: c ? `/courses/${c.id}` : undefined,
              });
            }
          }
        }
      } else if (role === "learner") {
        const { data: enrolls } = await supabase
          .from("enrollments")
          .select("id,enrolled_at,course_id,courses(title)")
          .eq("learner_id", user.id)
          .order("enrolled_at", { ascending: false });
        for (const e of (enrolls ?? []) as any[]) {
          items.push({
            id: `enroll-${e.id}`,
            ts: e.enrolled_at,
            icon: UserPlus,
            label: `Enrolled in "${e.courses?.title ?? "a course"}"`,
            href: `/courses/${e.course_id}`,
          });
        }
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("id,started_at,submitted_at,score,max_score")
          .eq("learner_id", user.id)
          .order("started_at", { ascending: false });
        for (const a of attempts ?? []) {
          items.push({
            id: `attempt-${a.id}`,
            ts: a.submitted_at ?? a.started_at,
            icon: CheckCircle2,
            label: a.submitted_at ? `Completed a quiz` : `Started a quiz`,
            detail: a.submitted_at ? `Score: ${a.score} / ${a.max_score}` : undefined,
          });
        }
      }

      items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      setActivity(items);
      setBusy(false);
    };
    load();
  }, [user, role]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-2 border-b bg-card px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">User Summary</span>
            <div className="ml-auto"><NotificationBell /></div>
          </header>
          <main className="flex-1 space-y-8 p-6 md:p-8">
            <PageHero
              eyebrow="Activity timeline"
              EyebrowIcon={ClipboardList}
              title="Activity"
              description={role === "teacher" || role === "admin"
                ? "A timeline of every course, module, lesson, quiz, and material you've added."
                : "Your enrollments and quiz activity."}
              backgroundImage={heroSummary}
            />

            {busy ? (
              <p className="text-muted-foreground">Loading activity…</p>
            ) : activity.length === 0 ? (
              <Card className="border-dashed" style={{ background: "var(--gradient-emerald-soft)" }}>
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <p className="text-base font-medium">No activity yet</p>
                </CardContent>
              </Card>
            ) : (
              <ol className="space-y-3">
                {activity.map((a) => {
                  const Inner = (
                    <Card className={a.href ? "border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40" : "border-border/60"} style={{ boxShadow: "var(--shadow-card)" }}>
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                          <a.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{a.label}</p>
                            {a.badge && <Badge variant="secondary">{a.badge}</Badge>}
                          </div>
                          {a.detail && <p className="text-sm text-muted-foreground">{a.detail}</p>}
                        </div>
                        <time className="hidden flex-none text-sm text-muted-foreground sm:block">
                          {new Date(a.ts).toLocaleString()}
                        </time>
                      </CardContent>
                    </Card>
                  );
                  return (
                    <li key={a.id}>
                      {a.href ? <Link to={a.href}>{Inner}</Link> : Inner}
                    </li>
                  );
                })}
              </ol>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
