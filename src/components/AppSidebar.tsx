import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, Users, Bell, LogOut, GraduationCap, PlusSquare, UserCircle, Settings, ClipboardCheck, Megaphone, Sparkles, Wand2 } from "lucide-react";
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
    { title: "User Summary", url: "/user-summary", icon: UserCircle },
    { title: "VARK Learning Quiz", url: "/vark-quiz", icon: Sparkles },
    { title: "Notifications", url: "/dashboard", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  teacher: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Courses", url: "/my-courses", icon: GraduationCap },
    { title: "Course Builder", url: "/courses/builder", icon: Wand2 },
    { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
    { title: "Announcements", url: "/announcements", icon: Megaphone },
    { title: "Course Library", url: "/courses", icon: BookOpen },
    { title: "User Summary", url: "/user-summary", icon: UserCircle },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Course Library", url: "/courses", icon: BookOpen },
    { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
    { title: "Announcements", url: "/announcements", icon: Megaphone },
    { title: "User Summary", url: "/user-summary", icon: UserCircle },
    { title: "Users", url: "/dashboard", icon: Users },
    { title: "Settings", url: "/settings", icon: Settings },
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
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-2xl h-auto py-2">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton asChild isActive={path === item.url} className="text-base h-auto py-3 [&>svg]:!size-5">
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
