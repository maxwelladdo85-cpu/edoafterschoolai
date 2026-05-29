import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Pencil, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/builder")({
  component: BuilderLandingPage,
});

interface CourseRow {
  id: string;
  title: string;
  subject: string | null;
  class_level: string | null;
  is_active: boolean;
  thumbnail_url: string | null;
  created_at: string;
}

function BuilderLandingPage() {
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
    if (!authLoading && user && role && role !== "teacher" && role !== "admin") {
      toast.error("Only teachers can build courses");
      nav({ to: "/dashboard" });
    }
  }, [authLoading, user, role, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("courses")
        .select("id,title,subject,class_level,is_active,thumbnail_url,created_at")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      setCourses(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardShell title="Course Builder">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Create new */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create a new course</CardTitle>
                <CardDescription>Start from scratch with our guided 3-step builder.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:opacity-90">
              <Link to="/courses/builder/edit"><Plus className="mr-2 h-5 w-5" />Create New Course</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Edit existing */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Edit an existing course</h2>
            <p className="text-sm text-muted-foreground">Pick any of your courses to continue editing in the builder.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your courses…
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10" />
                <p>You haven't created any courses yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {courses.map((c) => (
                <Card key={c.id} className="overflow-hidden border-border/60 transition-all hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-card)" }}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className="relative h-16 w-28 flex-none overflow-hidden rounded-lg bg-muted bg-cover bg-center ring-1 ring-border"
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
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{c.title}</h3>
                        <Badge variant={c.is_active ? "default" : "secondary"}>
                          {c.is_active ? "Active" : "Draft"}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {[c.subject, c.class_level].filter(Boolean).join(" · ") || "No subject yet"}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link to="/courses/builder/edit" search={{ id: c.id }}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
