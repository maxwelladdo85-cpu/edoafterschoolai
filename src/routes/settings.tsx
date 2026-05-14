import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar, BookOpen, GraduationCap, Users } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null; created_at: string } | null>(null);
  const [stats, setStats] = useState<{ label: string; value: number; icon: any }[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    const load = async () => {
      if (!user || !role) return;
      const { data: p } = await supabase.from("profiles").select("full_name,email,created_at").eq("id", user.id).maybeSingle();
      setProfile(p);

      if (role === "teacher") {
        const { data: cs } = await supabase.from("courses").select("id,is_active").eq("teacher_id", user.id);
        const ids = (cs ?? []).map((c) => c.id);
        const active = (cs ?? []).filter((c) => c.is_active).length;
        let enroll = 0;
        if (ids.length) {
          const { count } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).in("course_id", ids);
          enroll = count ?? 0;
        }
        setStats([
          { label: "Courses created", value: cs?.length ?? 0, icon: GraduationCap },
          { label: "Active courses", value: active, icon: BookOpen },
          { label: "Total enrollments", value: enroll, icon: Users },
        ]);
      } else if (role === "learner") {
        const { count: enrolled } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("learner_id", user.id);
        const { count: attempts } = await supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("learner_id", user.id);
        setStats([
          { label: "Enrolled courses", value: enrolled ?? 0, icon: BookOpen },
          { label: "Quiz attempts", value: attempts ?? 0, icon: GraduationCap },
        ]);
      } else if (role === "admin") {
        const [{ count: users }, { count: courses }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("courses").select("id", { count: "exact", head: true }),
        ]);
        setStats([
          { label: "Total users", value: users ?? 0, icon: Users },
          { label: "Total courses", value: courses ?? 0, icon: GraduationCap },
        ]);
      }
    };
    load();
  }, [user, role]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-2 border-b bg-card px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">Settings</span>
          </header>
          <main className="flex-1 space-y-6 p-6 md:p-8">
            <header>
              <h1 className="text-4xl font-bold">Settings</h1>
              <p className="text-lg text-muted-foreground">Your account details and overall stats.</p>
            </header>

            <Card>
              <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm text-muted-foreground">Full name</p><p className="font-medium">{displayName}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium break-all">{profile?.email || user.email}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm text-muted-foreground">Role</p><Badge className="capitalize">{role ?? "—"}</Badge></div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((s) => (
                  <Card key={s.label}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                      <s.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-3xl font-bold">{s.value}</div></CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
