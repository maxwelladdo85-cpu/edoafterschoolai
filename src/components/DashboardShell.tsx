import { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function DashboardShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="app-shell">
        <AppSidebar />
        <div className="app-shell-content">
          <header className="app-shell-header sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-4">
            <SidebarTrigger />
            {title && <span className="text-sm font-medium text-muted-foreground truncate">{title}</span>}
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </header>
          <main className="app-main-scroll p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
