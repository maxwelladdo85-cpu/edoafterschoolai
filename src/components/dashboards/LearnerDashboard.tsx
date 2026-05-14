import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Bell, BookOpen, GraduationCap } from "lucide-react";

interface Enrollment {
  id: string;
  progress: number;
  course: { title: string; subject: string | null; description: string | null } | null;
}
interface Notification { id: string; title: string; message: string | null; is_read: boolean; created_at: string; }

export function LearnerDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: e } = await supabase
        .from("enrollments")
        .select("id, progress, course:courses(title, subject, description)")
        .eq("learner_id", user.id);
      setEnrollments((e as any) ?? []);
      const { data: n } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setNotifications(n ?? []);
    })();
  }, [user]);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Learner";

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ backgroundImage: "var(--gradient-gold)" }} />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <GraduationCap className="h-3.5 w-3.5" /> Learner space
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Welcome back, {firstName}.</h1>
          <p className="mt-3 text-base md:text-lg text-white/85">Continue your after-school learning journey across Edo State.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<BookOpen />} label="Enrolled Courses" value={enrollments.length} tint="from-primary/15 to-primary/5" />
        <StatCard icon={<GraduationCap />} label="Avg Progress" value={`${Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / Math.max(1, enrollments.length))}%`} tint="from-emerald-500/15 to-emerald-500/5" />
        <StatCard icon={<Bell />} label="Unread Alerts" value={notifications.filter(n => !n.is_read).length} tint="from-gold/20 to-gold/5" />
      </section>

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
                <CardContent>
                  <Progress value={e.progress} />
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{e.course?.description}</p>
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
