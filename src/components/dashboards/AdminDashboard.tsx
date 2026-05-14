import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, GraduationCap, ClipboardCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import dashboardHero from "@/assets/dashboard-hero.jpg";

interface UserRow { id: string; email: string | null; full_name: string | null; created_at: string; roles: string[]; }

export function AdminDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activeCourses, setActiveCourses] = useState(0);
  const [assessments, setAssessments] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: roles }, { count: courseCount }, { count: quizCount }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("quizzes").select("*", { count: "exact", head: true }),
      ]);
      const rolesByUser: Record<string, string[]> = {};
      (roles ?? []).forEach((r: any) => {
        rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
      });
      setUsers((profiles ?? []).map((p: any) => ({ ...p, roles: rolesByUser[p.id] ?? [] })));
      setActiveCourses(courseCount ?? 0);
      setAssessments(quizCount ?? 0);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin console"
        EyebrowIcon={Users}
        title="Platform overview"
        description="Oversee learners, teachers and courses across the Digital Learning at Home platform."
        backgroundImage={dashboardHero}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users />} label="Total Users" value={users.length} tint="from-primary/15 to-primary/5" />
        <Stat icon={<BookOpen />} label="Active Courses" value={activeCourses} tint="from-emerald-500/15 to-emerald-500/5" />
        <Stat icon={<GraduationCap />} label="Teachers" value={users.filter((u) => u.roles.includes("teacher")).length} tint="from-gold/20 to-gold/5" />
        <Stat icon={<ClipboardCheck />} label="Assessments" value={assessments} tint="from-sky-500/15 to-sky-500/5" />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">User Management</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No users yet.</TableCell></TableRow>
                ) : users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r} variant={r === "admin" ? "destructive" : r === "teacher" ? "default" : "secondary"}>{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, tint = "from-primary/15 to-primary/5" }: { icon: React.ReactNode; label: string; value: React.ReactNode; tint?: string }) {
  return (
    <Card className={`border-0 bg-gradient-to-br ${tint}`} style={{ boxShadow: "var(--shadow-card)" }}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold tracking-tight">{value}</p></div>
      </CardContent>
    </Card>
  );
}
