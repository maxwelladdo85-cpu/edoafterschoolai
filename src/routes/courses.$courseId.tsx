import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, FileText, Film, Headphones, Loader2, NotebookPen, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$courseId")({
  component: CoursePlayer,
});

type ContentType = "video" | "pdf" | "audio" | "text";
interface Lesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  content_type: ContentType;
  content_url: string | null;
  content_text: string | null;
}
interface Module { id: string; title: string; position: number; lessons: Lesson[]; }
interface Course { id: string; title: string; subject: string | null; description: string | null; }

function CoursePlayer() {
  const { courseId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("courses").select("id, title, subject, description").eq("id", courseId).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c as Course);

      const { data: ms } = await supabase
        .from("modules")
        .select("id, title, position")
        .eq("course_id", courseId)
        .order("position", { ascending: true });
      const moduleIds = (ms ?? []).map((m: any) => m.id);
      let lessons: Lesson[] = [];
      if (moduleIds.length) {
        const { data: ls } = await supabase
          .from("lessons")
          .select("*")
          .in("module_id", moduleIds)
          .order("position", { ascending: true });
        lessons = (ls as any) ?? [];
      }
      const mods: Module[] = (ms ?? []).map((m: any) => ({
        ...m, lessons: lessons.filter((l) => l.module_id === m.id),
      }));
      setModules(mods);
      setActiveId(mods.flatMap((m) => m.lessons)[0]?.id ?? null);
      setLoading(false);
    })();
  }, [courseId, user]);

  const flatLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const activeLesson = flatLessons.find((l) => l.id === activeId) ?? null;
  const activeIdx = flatLessons.findIndex((l) => l.id === activeId);

  const updateProgress = async (newIdx: number) => {
    if (!user || flatLessons.length === 0) return;
    const pct = Math.round(((newIdx + 1) / flatLessons.length) * 100);
    await supabase
      .from("enrollments")
      .update({ progress: pct })
      .eq("learner_id", user.id)
      .eq("course_id", courseId);
  };

  const goTo = (idx: number) => {
    const target = flatLessons[idx];
    if (!target) return;
    setActiveId(target.id);
    updateProgress(idx);
  };

  if (loading) {
    return (
      <DashboardShell title="Course">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading course…
        </div>
      </DashboardShell>
    );
  }

  if (!course) {
    return (
      <DashboardShell title="Course">
        <Card><CardContent className="py-16 text-center">
          <p className="mb-4 text-muted-foreground">Course not found or not available.</p>
          <Button asChild><Link to="/courses">Back to library</Link></Button>
        </CardContent></Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={course.title}>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Lesson sidebar */}
        <aside className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{course.title}</h2>
            {course.subject && <p className="text-xs text-muted-foreground">{course.subject}</p>}
          </div>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to="/quizzes/$courseId" params={{ courseId }}>Quizzes & assessments</Link>
          </Button>
          {modules.length === 0 ? (
            <Card><CardContent className="py-6 text-sm text-muted-foreground text-center">
              No modules yet. Check back soon.
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {modules.map((m, mi) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      <span className="text-muted-foreground">Module {mi + 1}.</span> {m.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    {m.lessons.length === 0 ? (
                      <p className="px-2 py-2 text-xs text-muted-foreground">No lessons</p>
                    ) : (
                      <ul className="space-y-1">
                        {m.lessons.map((l) => {
                          const Icon = l.content_type === "video" ? Film
                            : l.content_type === "pdf" ? FileText
                            : l.content_type === "audio" ? Headphones
                            : NotebookPen;
                          const isActive = l.id === activeId;
                          return (
                            <li key={l.id}>
                              <button
                                onClick={() => { setActiveId(l.id); updateProgress(flatLessons.findIndex((x) => x.id === l.id)); }}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                }`}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="line-clamp-2">{l.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <section>
          {activeLesson ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary" className="mb-2 capitalize">{activeLesson.content_type}</Badge>
                    <CardTitle>{activeLesson.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" disabled={activeIdx <= 0} onClick={() => goTo(activeIdx - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" disabled={activeIdx >= flatLessons.length - 1} onClick={() => goTo(activeIdx + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LessonContent lesson={activeLesson} />
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <PlayCircle className="h-10 w-10" />
              <p>Select a lesson to begin.</p>
            </CardContent></Card>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  if (lesson.content_type === "video") {
    const url = lesson.content_url ?? "";
    const yt = toYouTubeEmbed(url);
    if (yt) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe src={yt} title={lesson.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      );
    }
    if (url) {
      return (
        <video src={url} controls className="aspect-video w-full rounded-lg bg-black" />
      );
    }
    return <EmptyMedia label="No video URL" />;
  }
  if (lesson.content_type === "pdf") {
    if (!lesson.content_url) return <EmptyMedia label="No PDF URL" />;
    return (
      <div className="space-y-2">
        <iframe src={lesson.content_url} title={lesson.title} className="h-[70vh] w-full rounded-lg border" />
        <a href={lesson.content_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
          Open PDF in new tab ↗
        </a>
      </div>
    );
  }
  if (lesson.content_type === "audio") {
    if (!lesson.content_url) return <EmptyMedia label="No audio URL" />;
    return <audio src={lesson.content_url} controls className="w-full" />;
  }
  // text
  return (
    <article className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground">
      {lesson.content_text || <span className="text-muted-foreground">No notes for this lesson.</span>}
    </article>
  );
}

function EmptyMedia({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch { /* not a url */ }
  return null;
}
