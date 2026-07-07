import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { LearnerDashboard } from "@/components/dashboards/LearnerDashboard";
import { TeacherSummary } from "@/components/dashboards/TeacherSummary";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: sent } = await (supabase as any).rpc("send_birthday_greeting_if_due");
      if (sent === true) toast.success("🎂 Happy Birthday from Edo SUBEB!");
      const { data: p } = await supabase.from("profiles").select("date_of_birth" as any).eq("id", user.id).maybeSingle();
      if (p && (p as any).date_of_birth == null) {
        toast.message("Add your date of birth in Settings so we can wish you a happy birthday!", { duration: 6000 });
      }
    })();
  }, [user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <SidebarProvider>
      <div className="app-shell">
        <AppSidebar />
        <div className="app-shell-content">
          <header className="app-shell-header flex h-14 items-center gap-2 border-b bg-card px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium capitalize text-muted-foreground">{role} dashboard</span>
            <div className="ml-auto"><NotificationBell /></div>
          </header>
          <main className="app-main-scroll p-4 sm:p-6 md:p-8">
            {role === "admin" ? <AdminDashboard /> : role === "scripter" || role === "teacher" ? <TeacherSummary /> : <LearnerDashboard />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
