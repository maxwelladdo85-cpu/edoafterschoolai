import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, Users, Bell, LogOut, GraduationCap, PlusSquare } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Logo } from "./Logo";
import { Button } from "./ui/button";

const NAV: Record<AppRole, { title: string; url: string; icon: any }[]> = {
  learner: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Course Library", url: "/courses", icon: BookOpen },
    { title: "Notifications", url: "/dashboard", icon: Bell },
  ],
  teacher: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Courses", url: "/dashboard", icon: GraduationCap },
    { title: "Course Library", url: "/courses", icon: BookOpen },
  ],
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Course Library", url: "/courses", icon: BookOpen },
    { title: "Users", url: "/dashboard", icon: Users },
  ],
};

export function AppSidebar() {
  const { role, user, signOut } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = NAV[role ?? "learner"];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Logo className="text-sidebar-foreground [&_*]:text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton asChild isActive={path === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-2 text-xs text-sidebar-foreground/70 truncate">{user?.email}</div>
        <Button variant="secondary" size="sm" onClick={signOut} className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
