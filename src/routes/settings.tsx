import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Calendar, BookOpen, GraduationCap, Users, Camera, Loader2, Trash2, FileText, Cookie, School as SchoolIcon, Phone, IdCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASS_GROUPS } from "@/lib/classes";
import { EDO_LGAS } from "@/lib/lgas";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import heroSettings from "@/assets/hero-settings.jpg";

function ClassEditor({ initial, onSave }: { initial: string; onSave: (val: string) => Promise<void> }) {
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setVal(initial); }, [initial]);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[220px]">
        <Select value={val} onValueChange={setVal}>
          <SelectTrigger><SelectValue placeholder="Select your class" /></SelectTrigger>
          <SelectContent>
            {CLASS_GROUPS.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" disabled={saving || val.trim() === initial.trim() || !val} onClick={async () => { setSaving(true); try { await onSave(val.trim()); } finally { setSaving(false); } }}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function LgaEditor({ initial, onSave }: { initial: string; onSave: (val: string) => Promise<void> }) {
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setVal(initial); }, [initial]);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[220px]">
        <Select value={val} onValueChange={setVal}>
          <SelectTrigger><SelectValue placeholder="Select your local government" /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Edo State LGAs</SelectLabel>
              {EDO_LGAS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" disabled={saving || val.trim() === initial.trim() || !val} onClick={async () => { setSaving(true); try { await onSave(val.trim()); } finally { setSaving(false); } }}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null; created_at: string; avatar_url: string | null; class_level: string | null; lga: string | null; date_of_birth: string | null; school_type: string | null; school_id: string | null; parent_phone: string | null; nin: string | null } | null>(null);
  const [dob, setDob] = useState("");
  const [savingDob, setSavingDob] = useState(false);
  const [stats, setStats] = useState<{ label: string; value: number; icon: any }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [schoolType, setSchoolType] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schoolOptions, setSchoolOptions] = useState<{ id: string; name: string; lga: string; school_type: string }[]>([]);
  const [savingSchool, setSavingSchool] = useState(false);
  const [parentPhone, setParentPhone] = useState("");
  const [nin, setNin] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    const load = async () => {
      if (!user || !role) return;
      const { data: p } = await supabase.from("profiles").select("full_name,email,created_at,avatar_url,class_level,lga,date_of_birth,school_type,school_id,parent_phone,nin" as any).eq("id", user.id).maybeSingle();
      setProfile(p as any);
      const nm = ((p as any)?.full_name ?? "").trim();
      const sp = nm.indexOf(" ");
      setFirstName(sp === -1 ? nm : nm.slice(0, sp));
      setLastName(sp === -1 ? "" : nm.slice(sp + 1));
      setEmail((p as any)?.email ?? user.email ?? "");
      setDob((p as any)?.date_of_birth ?? "");
      setSchoolType((p as any)?.school_type ?? "");
      setSchoolId((p as any)?.school_id ?? "");
      setParentPhone((p as any)?.parent_phone ?? "");
      setNin((p as any)?.nin ?? "");

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
            <div className="ml-auto"><NotificationBell /></div>
          </header>
          <main className="flex-1 space-y-8 p-6 md:p-8">
            <PageHero
              eyebrow="Account"
              EyebrowIcon={User}
              title="Settings"
              description="Your profile, preferences and account stats."
              backgroundImage={heroSettings}
            />

            <Card className="border-border/60 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
              <div
                className="relative h-28 w-full"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                <div className="absolute left-6 -bottom-12 sm:left-8">
                  <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                    <AvatarFallback className="text-2xl bg-gold/20 text-gold-foreground">{initials || "U"}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <CardContent className="space-y-6 pt-16">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{displayName}</p>
                    <p className="text-sm text-muted-foreground">Profile picture — JPG/PNG, under 5 MB.</p>
                  </div>
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
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    const trimmedName = fullName.trim();
                    const trimmedEmail = email.trim();
                    if (!trimmedName) return toast.error("Full name is required");
                    if (trimmedName.length > 100) return toast.error("Full name must be under 100 characters");
                    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRe.test(trimmedEmail)) return toast.error("Enter a valid email address");
                    setSavingProfile(true);
                    try {
                      const nameChanged = trimmedName !== (profile?.full_name ?? "");
                      const emailChanged = trimmedEmail.toLowerCase() !== (profile?.email ?? user.email ?? "").toLowerCase();
                      if (nameChanged) {
                        const { error } = await supabase.from("profiles").update({ full_name: trimmedName }).eq("id", user.id);
                        if (error) throw error;
                      }
                      if (emailChanged) {
                        const { error: authErr } = await supabase.auth.updateUser({ email: trimmedEmail });
                        if (authErr) throw authErr;
                        const { error: pErr } = await supabase.from("profiles").update({ email: trimmedEmail }).eq("id", user.id);
                        if (pErr) throw pErr;
                        toast.success("Profile saved — check your inbox to confirm the new email");
                      } else if (nameChanged) {
                        toast.success("Profile saved");
                      } else {
                        toast.message("No changes to save");
                      }
                      setProfile((prev) => prev ? { ...prev, full_name: trimmedName, email: trimmedEmail } : prev);
                    } catch (err: any) {
                      toast.error(err.message ?? "Could not save profile");
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                >
                  <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" /> Full name
                    </label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} placeholder="Your full name" />
                  </div>
                  <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary" /> Email
                    </label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="you@example.com" />
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <Shield className="mt-1 h-4 w-4 text-primary" />
                    <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p><Badge className="capitalize">{role ?? "—"}</Badge></div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <Calendar className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Member since</p>
                      <p className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className={`border-border/60 ${!profile?.date_of_birth ? "ring-2 ring-gold/60" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Date of Birth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {profile?.date_of_birth
                    ? "Update your date of birth below — we'll send you a birthday message every year on this day."
                    : "Please add your date of birth so we can send you a birthday message every year. 🎂"}
                </p>
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    if (!dob) return toast.error("Please pick a date");
                    const d = new Date(dob);
                    if (isNaN(d.getTime()) || d > new Date()) return toast.error("Enter a valid past date");
                    setSavingDob(true);
                    const { error } = await supabase.from("profiles").update({ date_of_birth: dob } as any).eq("id", user.id);
                    setSavingDob(false);
                    if (error) return toast.error(error.message);
                    setProfile((prev) => prev ? { ...prev, date_of_birth: dob } : prev);
                    toast.success("Date of birth saved");
                  }}
                >
                  <div className="flex-1 min-w-[220px]">
                    <Input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />
                  </div>
                  <Button type="submit" size="sm" disabled={savingDob || !dob || dob === (profile?.date_of_birth ?? "")}>
                    {savingDob ? "Saving…" : "Save"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {role === "learner" && (
              <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader><CardTitle>My class</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Set your class so teachers can assign courses to you (e.g. "JSS 1", "Primary 4").</p>
                  <ClassEditor
                    initial={profile?.class_level ?? ""}
                    onSave={async (val) => {
                      const { error } = await supabase.from("profiles").update({ class_level: val || null } as any).eq("id", user.id);
                      if (error) { toast.error(error.message); return; }
                      setProfile((prev) => prev ? { ...prev, class_level: val || null } : prev);
                      toast.success("Class saved");
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {(role === "learner" || role === "teacher") && (
              <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader><CardTitle>Local Government</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Select your Local Government Area in Edo State.</p>
                  <LgaEditor
                    initial={profile?.lga ?? ""}
                    onSave={async (val) => {
                      const { error } = await supabase.from("profiles").update({ lga: val || null } as any).eq("id", user.id);
                      if (error) { toast.error(error.message); return; }
                      setProfile((prev) => prev ? { ...prev, lga: val || null } : prev);
                      toast.success("Local Government saved");
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Legal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Review the legal agreements that govern your use of the EdoLearn platform.</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link to="/privacy" className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                    <Shield className="h-4 w-4 text-primary" /> Privacy Policy
                  </Link>
                  <Link to="/terms" className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                    <FileText className="h-4 w-4 text-primary" /> Terms of Service
                  </Link>
                  <Link to="/cookies" className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                    <Cookie className="h-4 w-4 text-primary" /> Cookie Policy
                  </Link>
                </div>
              </CardContent>
            </Card>

            {stats.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((s, i) => {
                  const tints = ["from-primary/15 to-primary/5", "from-emerald-500/15 to-emerald-500/5", "from-gold/20 to-gold/5"];
                  return (
                    <Card key={s.label} className={`border-0 bg-gradient-to-br ${tints[i % tints.length]}`} style={{ boxShadow: "var(--shadow-card)" }}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <s.icon className="h-4 w-4" />
                        </div>
                      </CardHeader>
                      <CardContent><div className="text-4xl font-bold tracking-tight">{s.value}</div></CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
