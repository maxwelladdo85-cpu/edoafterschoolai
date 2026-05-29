import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, Users, Bell, LogOut, GraduationCap, UserCircle, Settings, ClipboardCheck, Megaphone, Sparkles, Wand2, Video, MessageCircle, Award, Activity, ChevronDown } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { VarkStartDialog } from "./VarkStartDialog";

type NavItem = { title: string; url: string; icon: any };
type NavSection = { label: string; items: NavItem[] };

const NAV: Record<AppRole, NavSection[]> = {
  learner: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Notifications", url: "/dashboard", icon: Bell },
      ],
    },
    {
      label: "Learning",
      items: [
        { title: "Course Library", url: "/courses", icon: BookOpen },
        { title: "Virtual Classes", url: "/dashboard", icon: Video },
        { title: "Certificates", url: "/certificates", icon: Award },
        { title: "VARK Learning Quiz", url: "/vark-quiz", icon: Sparkles },
      ],
    },
    {
      label: "Communication",
      items: [
        { title: "Messages", url: "/messages", icon: MessageCircle },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "User Summary", url: "/user-summary", icon: UserCircle },
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
  ],
  teacher: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Teaching",
      items: [
        { title: "My Courses", url: "/my-courses", icon: GraduationCap },
        { title: "Course Builder", url: "/courses/builder", icon: Wand2 },
        { title: "Course Library", url: "/courses", icon: BookOpen },
        { title: "Virtual Classes", url: "/virtual-classes", icon: Video },
        { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
      ],
    },
    {
      label: "Communication",
      items: [
        { title: "Messages", url: "/messages", icon: MessageCircle },
        { title: "Announcements", url: "/announcements", icon: Megaphone },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "User Summary", url: "/user-summary", icon: UserCircle },
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
  ],
  admin: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Performance", url: "/admin-performance", icon: Activity },
      ],
    },
    {
      label: "Content",
      items: [
        { title: "Course Library", url: "/courses", icon: BookOpen },
        { title: "Course Builder", url: "/courses/builder", icon: Wand2 },
        { title: "Assessments", url: "/assessments", icon: ClipboardCheck },
        { title: "Announcements", url: "/announcements", icon: Megaphone },
      ],
    },
    {
      label: "People",
      items: [
        { title: "Users", url: "/dashboard", icon: Users },
        { title: "User Summary", url: "/user-summary", icon: UserCircle },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
  ],
};

export function AppSidebar() {
  const { role, user, signOut } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const sections = NAV[role ?? "learner"];

  // Open the section that contains the active route by default; otherwise the first section.
  const activeSection =
    sections.find((s) => s.items.some((it) => it.url === path))?.label ?? sections[0]?.label ?? null;
  const [openSection, setOpenSection] = useState<string | null>(activeSection);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Logo className="text-sidebar-foreground [&_*]:text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => {
          const isOpen = openSection === section.label;
          return (
            <SidebarGroup key={section.label}>
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : section.label)}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                aria-expanded={isOpen}
              >
                <SidebarGroupLabel className="text-sidebar-foreground/70 text-sm font-semibold uppercase tracking-wide p-0 h-auto">
                  {section.label}
                </SidebarGroupLabel>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item, i) => (
                      <SidebarMenuItem key={i}>
                        {item.url === "/vark-quiz" ? (
                          <VarkStartDialog retake={path === "/vark-quiz"}>
                            <SidebarMenuButton isActive={path === item.url} className="text-base h-auto py-3 [&>svg]:!size-5">
                              <item.icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          </VarkStartDialog>
                        ) : (
                          <SidebarMenuButton asChild isActive={path === item.url} className="text-base h-auto py-3 [&>svg]:!size-5">
                            <Link to={item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-2 text-xs text-sidebar-foreground/70 truncate">{user?.email}</div>
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 px-2">
          <Link to="/privacy" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">
            Terms
          </Link>
          <Link to="/cookies" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">
            Cookies
          </Link>
        </div>
        <Button variant="secondary" size="sm" onClick={signOut} className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
