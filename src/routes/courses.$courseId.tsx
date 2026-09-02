import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, FileText, Film, Headphones, Loader2, NotebookPen, PlayCircle, CheckCircle2, Circle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AiTutorWidget } from "@/components/AiTutorWidget";
import { CourseForum } from "@/components/CourseForum";

export const Route = createFileRoute("/courses/$courseId")({
  component: CoursePlayer,
});

type ContentType = "video" | "pdf" | "audio" | "text" | "doc";
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
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const isStaff = role === "teacher" || role === "admin";

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [savingComplete, setSavingComplete] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [viewedLessons, setViewedLessons] = useState<Set<string>>(new Set());
  const [savingViewed, setSavingViewed] = useState(false);

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
      const allLessons = mods.flatMap((m) => m.lessons);

      // Load this learner's completions for these lessons (skip for staff viewing)
      const lessonIds = lessons.map((l) => l.id);
      let lastViewedId: string | null = null;
      if (!isStaff && lessonIds.length) {
        const [{ data: comps }, { data: lastView }] = await Promise.all([
          supabase
            .from("lesson_completions")
            .select("lesson_id")
            .eq("learner_id", user.id)
            .in("lesson_id", lessonIds),
          supabase
            .from("lesson_views")
            .select("lesson_id")
            .eq("learner_id", user.id)
            .in("lesson_id", lessonIds)
            .order("viewed_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        setCompleted(new Set((comps ?? []).map((c: any) => c.lesson_id)));
        lastViewedId = (lastView as any)?.lesson_id ?? null;
      } else {
        setCompleted(new Set());
        if (isStaff && lessonIds.length) {
          const { data: views } = await supabase
            .from("lesson_views")
            .select("lesson_id")
            .eq("learner_id", user.id)
            .in("lesson_id", lessonIds);
          setViewedLessons(new Set((views ?? []).map((v: any) => v.lesson_id)));
        } else {
          setViewedLessons(new Set());
        }
      }
      setActiveId(lastViewedId ?? allLessons[0]?.id ?? null);
      setLoading(false);
    })();
  }, [courseId, user, isStaff]);

  // Attendance: log when a learner opens a lesson (skip for staff preview)
  useEffect(() => {
    if (!user || !activeId || isStaff) return;
    supabase.from("lesson_views").insert({ learner_id: user.id, lesson_id: activeId }).then(() => {});
  }, [user, activeId, isStaff]);


  const flatLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const activeLesson = flatLessons.find((l) => l.id === activeId) ?? null;
  const activeIdx = flatLessons.findIndex((l) => l.id === activeId);
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter((l) => completed.has(l.id)).length;
  const progressPct = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  const isActiveCompleted = activeLesson ? completed.has(activeLesson.id) : false;

  const syncEnrollmentProgress = async (next: Set<string>) => {
    if (!user || totalLessons === 0) return;
    const pct = Math.round((Array.from(next).filter((id) => flatLessons.some((l) => l.id === id)).length / totalLessons) * 100);
    await supabase
      .from("enrollments")
      .update({ progress: pct })
      .eq("learner_id", user.id)
      .eq("course_id", courseId);
  };

  const toggleComplete = async () => {
    if (!user || !activeLesson || savingComplete) return;
    setSavingComplete(true);
    const next = new Set(completed);
    try {
      if (next.has(activeLesson.id)) {
        const { error } = await supabase
          .from("lesson_completions")
          .delete()
          .eq("learner_id", user.id)
          .eq("lesson_id", activeLesson.id);
        if (error) throw error;
        next.delete(activeLesson.id);
        toast.message("Lesson marked incomplete");
      } else {
        const { error } = await supabase
          .from("lesson_completions")
          .insert({ learner_id: user.id, lesson_id: activeLesson.id });
        if (error) throw error;
        next.add(activeLesson.id);
        toast.success("Lesson completed");
        if (next.size === totalLessons && !isStaff) {
          setShowCongrats(true);
        }
      }
      setCompleted(next);
      await syncEnrollmentProgress(next);
    } catch (err: any) {
      toast.error(err.message ?? "Could not save completion");
    } finally {
      setSavingComplete(false);
    }
  };

  const markViewed = async () => {
    if (!user || !activeLesson || savingViewed || viewedLessons.has(activeLesson.id)) return;
    setSavingViewed(true);
    const { error } = await supabase
      .from("lesson_views")
      .insert({ learner_id: user.id, lesson_id: activeLesson.id });
    setSavingViewed(false);
    if (error) {
      toast.error(error.message ?? "Could not record view");
      return;
    }
    setViewedLessons((prev) => new Set(prev).add(activeLesson.id));
    toast.success("Marked as viewed");
  };

  const goTo = (idx: number) => {
    const target = flatLessons[idx];
    if (!target) return;
    setActiveId(target.id);
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
      <div className="pb-28 lg:pb-6">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
            else nav({ to: "/dashboard" });
          }}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* Lesson sidebar */}
        <aside className="min-w-0 space-y-4">
          <div>
            <h2 className="text-lg font-bold">{course.title}</h2>
            {course.subject && <p className="text-xs text-muted-foreground">{course.subject}</p>}
          </div>
          {totalLessons > 0 && !isStaff && (
            <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Course progress</span>
                <span className="text-muted-foreground">{completedCount}/{totalLessons} · {progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link to="/quizzes/$courseId" params={{ courseId }}>Quizzes & assessments</Link>
          </Button>
          {(() => {
            const downloadable = flatLessons.filter((l) => l.content_url && (l.content_type === "pdf" || l.content_type === "audio" || l.content_type === "doc" || l.content_type === "video"));
            if (downloadable.length === 0) return null;
            return (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Course materials</CardTitle></CardHeader>
                <CardContent className="p-2 pt-0">
                  <ul className="space-y-1">
                    {downloadable.map((l) => {
                      const Icon = l.content_type === "video" ? Film : l.content_type === "pdf" ? FileText : l.content_type === "audio" ? Headphones : NotebookPen;
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(l.id);
                              if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-muted"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-primary" />
                            <span className="line-clamp-1 flex-1">{l.title}</span>
                            <span className="text-muted-foreground">▶</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })()}
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
                          const isDone = completed.has(l.id);
                          return (
                            <li key={l.id}>
                              <button
                                onClick={() => setActiveId(l.id)}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-emerald-600"}`} />
                                ) : (
                                  <Icon className="h-4 w-4 shrink-0" />
                                )}
                                <span className={`line-clamp-2 flex-1 ${isDone && !isActive ? "text-muted-foreground line-through" : ""}`}>{l.title}</span>
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
        <section className="min-w-0">
          {activeLesson ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Badge variant="secondary" className="mb-2 capitalize">{activeLesson.content_type}</Badge>
                    <CardTitle className="break-words">{activeLesson.title}</CardTitle>
                  </div>
                  <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                    <Button size="icon" variant="outline" disabled={activeIdx <= 0} onClick={() => goTo(activeIdx - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" disabled={activeIdx >= flatLessons.length - 1} onClick={() => goTo(activeIdx + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <LessonContent lesson={activeLesson} />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    Lesson {activeIdx + 1} of {totalLessons}
                  </p>
                  <div className="flex gap-2">
                    {isStaff && role === "teacher" && (
                      viewedLessons.has(activeLesson.id) ? (
                        <Button variant="outline" disabled>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Viewed
                        </Button>
                      ) : (
                        <Button variant="default" onClick={markViewed} disabled={savingViewed}>
                          <Eye className="mr-2 h-4 w-4" /> Mark as viewed
                        </Button>
                      )
                    )}
                    {!isStaff && (
                      <Button
                        variant={isActiveCompleted ? "outline" : "default"}
                        onClick={toggleComplete}
                        disabled={savingComplete}
                      >
                        {isActiveCompleted ? (
                          <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Completed — undo</>
                        ) : (
                          <><Circle className="mr-2 h-4 w-4" /> Mark as complete</>
                        )}
                      </Button>
                    )}
                    {activeIdx < flatLessons.length - 1 && (
                      <Button variant="secondary" onClick={() => goTo(activeIdx + 1)}>
                        Next lesson <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
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
      <div className="mt-6">
        <CourseForum courseId={courseId} />
      </div>
      </div>
      {!isStaff && <AiTutorWidget courseId={courseId} courseTitle={course.title} />}


      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Trophy className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl">Weldone Champ !</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">you just finished achieved something great! Keep learning.</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button onClick={() => setShowCongrats(false)}>Continue</Button>
            <Button variant="outline" asChild>
              <Link to="/certificates">View certificates</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  const downloadBtn = lesson.content_url ? (
    <a
      href={lesson.content_url}
      download
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
    >
      ⬇ Download
    </a>
  ) : null;

  if (lesson.content_type === "video") {
    const url = lesson.content_url ?? "";
    const yt = toYouTubeEmbed(url);
    if (yt) {
      return (
        <div className="space-y-2">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe src={yt} title={lesson.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          {downloadBtn}
        </div>
      );
    }
    if (url) {
      return (
        <div className="space-y-2">
          <video src={url} controls className="aspect-video w-full rounded-lg bg-black" />
          {downloadBtn}
        </div>
      );
    }
    return <EmptyMedia label="No video URL" />;
  }
  if (lesson.content_type === "pdf") {
    if (!lesson.content_url) return <EmptyMedia label="No PDF URL" />;
    return <PdfMaterial url={lesson.content_url} title={lesson.title} />;
  }
  if (lesson.content_type === "audio") {
    if (!lesson.content_url) return <EmptyMedia label="No audio URL" />;
    return (
      <div className="space-y-2">
        <audio src={lesson.content_url} controls className="w-full" />
        {downloadBtn}
      </div>
    );
  }
  if (lesson.content_type === "doc") {
    if (!lesson.content_url) return <EmptyMedia label="No document" />;
    const office = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.content_url)}`;
    return (
      <div className="space-y-2">
        <iframe src={office} title={lesson.title} className="h-[55vh] sm:h-[70vh] w-full rounded-lg border" />
        {downloadBtn}
      </div>
    );
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

// In-app PDF renderer using PDF.js — works in every browser (incl. Android
// Chrome / iOS Safari) because pages are drawn to canvas, not embedded frames
// that Chrome blocks.
function PdfJsViewer({ url, maxHeightClass = "max-h-[70vh]" }: { url: string; maxHeightClass?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        setPageCount(doc.numPages);
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";
        for (let p = 1; p <= doc.numPages; p++) {
          if (cancelled) return;
          const page = await doc.getPage(p);
          const base = page.getViewport({ scale: 1 });
          const width = container.clientWidth || base.width;
          const scale = width / base.width;
          const viewport = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.className = "border-b last:border-b-0";
          container.appendChild(canvas);
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        console.error("PDF render failed", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  if (status === "error") {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Could not render this PDF inside the app.{" "}
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Open it in your browser
        </a>
        .
      </div>
    );
  }
  return (
    <div className={`relative overflow-y-auto rounded-lg border bg-muted ${maxHeightClass}`}>
      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
        </div>
      )}
      <div ref={containerRef} className="w-full" />
      {status === "ready" && pageCount > 0 && (
        <p className="sticky bottom-0 bg-background/80 px-3 py-1 text-right text-[11px] text-muted-foreground backdrop-blur">
          {pageCount} page{pageCount === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function PdfMaterial({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/40 p-6 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="mb-1 font-medium">{title}</p>
        <p className="mb-4 text-xs text-muted-foreground">PDF material · view inside the app (download disabled)</p>
        <Button onClick={() => setOpen(true)}>
          <Eye className="mr-2 h-4 w-4" />View Material
        </Button>
      </div>
      <PdfJsViewer url={url} />
      <p className="text-xs text-muted-foreground">
        Trouble viewing?{" "}
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Open in your browser (Chrome, Safari…)
        </a>
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl p-0 sm:p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="truncate pr-8">{title}</DialogTitle>
          </DialogHeader>
          <div className="w-full bg-muted">
            {open && <PdfJsViewer url={url} maxHeightClass="max-h-[80vh] rounded-none border-0" />}
          </div>
          <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
            <span>Viewing within the app · downloads disabled</span>
            <a href={url} target="_blank" rel="noreferrer" className="underline">
              Open in browser
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
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
