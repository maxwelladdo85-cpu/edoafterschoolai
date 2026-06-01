import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";

export function DashboardShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen min-h-[100dvh] w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-4">
            <SidebarTrigger />
            {title && <span className="text-sm font-medium text-muted-foreground truncate">{title}</span>}
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden pb-[env(safe-area-inset-bottom)]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
