import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";

export const Route = createFileRoute("/my-courses")({
  component: MyCoursesPage,
});

function MyCoursesPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
    else if (!loading && user && role && role !== "teacher" && role !== "admin") nav({ to: "/dashboard" });
  }, [loading, user, role, nav]);

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
            <span className="text-sm font-medium text-muted-foreground">Courses</span>
            <div className="ml-auto"><NotificationBell /></div>
          </header>
          <main className="flex-1 p-6 md:p-8">
            <TeacherDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
