import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import dashboardHero from "@/assets/dashboard-hero.jpg";
import { STYLE_LABELS, STYLE_TIPS, type VarkStyle } from "@/lib/vark";
import { VirtualClassesPanel } from "@/components/VirtualClassesPanel";
import { ReportTeacherCard } from "@/components/dashboards/ReportTeacherCard";
import { VarkStartDialog } from "@/components/VarkStartDialog";

interface Enrollment {
  id: string;
  progress: number;
  course_id: string;
  course: { title: string; subject: string | null; description: string | null; created_at: string } | null;
  last_lesson_id?: string | null;
  last_lesson_at?: string | null;
}
interface Notification { id: string; title: string; message: string | null; is_read: boolean; created_at: string; }
interface VarkResult { id: string; dominant: VarkStyle; created_at: string; }

export function LearnerDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [vark, setVark] = useState<VarkResult | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [eRes, nRes, vRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id, progress, course_id, course:courses(title, subject, description, created_at)")
          .eq("learner_id", user.id),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("vark_results")
          .select("id, dominant, created_at")
          .eq("learner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setEnrollments((eRes.data as any) ?? []);
      setNotifications(nRes.data ?? []);
      setVark((vRes.data as any) ?? null);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Learner";

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Learner space"
        EyebrowIcon={GraduationCap}
        title={`Welcome back, ${firstName}.`}
        description="Continue your after-school learning journey across Edo State."
        backgroundImage={dashboardHero}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<BookOpen />} label="Enrolled Courses" value={enrollments.length} tint="from-primary/15 to-primary/5" />
        <StatCard icon={<GraduationCap />} label="Avg Progress" value={`${Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / Math.max(1, enrollments.length))}%`} tint="from-emerald-500/15 to-emerald-500/5" />
        <StatCard icon={<Bell />} label="Unread Alerts" value={notifications.filter(n => !n.is_read).length} tint="from-gold/20 to-gold/5" />
      </section>

      <section>
        {vark ? (
          <Card className="border-0 bg-gradient-to-br from-primary/15 to-gold/10" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <Badge className="w-fit gap-1"><Sparkles className="h-3 w-3" /> Your learning style</Badge>
              <CardTitle className="text-2xl">You learn best as a <span className="text-primary">{STYLE_LABELS[vark.dominant]}</span> learner</CardTitle>
              <CardDescription>Based on your VARK quiz on {new Date(vark.created_at).toLocaleDateString()}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {STYLE_TIPS[vark.dominant].slice(0, 3).map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
              <VarkStartDialog retake><Button variant="outline" size="sm">Retake quiz</Button></VarkStartDialog>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-gradient-to-br from-primary/15 to-gold/10" style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <Badge className="w-fit gap-1"><Sparkles className="h-3 w-3" /> New</Badge>
              <CardTitle>Discover how you learn best</CardTitle>
              <CardDescription>Take our quick 8-question VARK quiz to find your learning style and get tips made for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <VarkStartDialog><Button>Take the VARK quiz</Button></VarkStartDialog>
            </CardContent>
          </Card>
        )}
      </section>

      <VirtualClassesPanel mode="learner" />

      <ReportTeacherCard />

      <section>
        <h2 className="mb-3 text-xl font-semibold">Courses</h2>
        {enrollments.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">You aren't enrolled in any courses yet.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((e) => (
              <Card key={e.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{e.course?.title ?? "Course"}</CardTitle>
                      <CardDescription>{e.course?.subject}</CardDescription>
                    </div>
                    <Badge variant="secondary">{e.progress}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={e.progress} />
                  <p className="text-sm text-muted-foreground line-clamp-2">{e.course?.description}</p>
                  <Button asChild size="sm" className="w-full">
                    <Link to="/courses/$courseId" params={{ courseId: e.course_id }}>
                      <BookOpen className="mr-2 h-4 w-4" /> Open course & materials
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Notifications</h2>
        <Card>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">No notifications.</p>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 p-4">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.is_read ? "bg-muted" : "bg-primary"}`} />
                    <div className="flex-1">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, tint = "from-primary/15 to-primary/5" }: { icon: React.ReactNode; label: string; value: React.ReactNode; tint?: string }) {
  return (
    <Card className={`border-0 bg-gradient-to-br ${tint}`} style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
