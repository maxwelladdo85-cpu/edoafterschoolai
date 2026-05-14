import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LearnerDashboard } from "@/components/dashboards/LearnerDashboard";
import { TeacherSummary } from "@/components/dashboards/TeacherSummary";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

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
            <span className="text-sm font-medium capitalize text-muted-foreground">{role} dashboard</span>
            <div className="ml-auto"><NotificationBell /></div>
          </header>
          <main className="flex-1 p-6 md:p-8">
            {role === "admin" ? <AdminDashboard /> : role === "teacher" ? <TeacherSummary /> : <LearnerDashboard />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
