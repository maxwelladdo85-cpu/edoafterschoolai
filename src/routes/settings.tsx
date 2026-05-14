import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Calendar, BookOpen, GraduationCap, Users, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null; created_at: string; avatar_url: string | null; class_level: string | null } | null>(null);
  const [stats, setStats] = useState<{ label: string; value: number; icon: any }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    const load = async () => {
      if (!user || !role) return;
      const { data: p } = await supabase.from("profiles").select("full_name,email,created_at,avatar_url,class_level" as any).eq("id", user.id).maybeSingle();
      setProfile(p as any);

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
  const initials = displayName.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Pick an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: pErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
      if (pErr) throw pErr;
      setProfile((prev) => prev ? { ...prev, avatar_url: pub.publicUrl } : prev);
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    if (error) return toast.error(error.message);
    setProfile((prev) => prev ? { ...prev, avatar_url: null } : prev);
    toast.success("Profile picture removed");
  };

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
              <CardContent className="space-y-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-24 w-24">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                    <AvatarFallback className="text-2xl">{initials || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Profile picture — JPG/PNG, under 5 MB.</p>
                    <div className="flex flex-wrap gap-2">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                      <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                        {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : <><Camera className="mr-2 h-4 w-4" />{profile?.avatar_url ? "Change picture" : "Upload picture"}</>}
                      </Button>
                      {profile?.avatar_url && (
                        <Button size="sm" variant="outline" onClick={removeAvatar} disabled={uploading}>
                          <Trash2 className="mr-2 h-4 w-4" />Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
