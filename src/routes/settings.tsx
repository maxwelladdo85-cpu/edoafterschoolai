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
import { User, Mail, Shield, Calendar, BookOpen, GraduationCap, Users, Camera, Loader2, Trash2, FileText, Cookie, School as SchoolIcon, Phone, IdCard, Pencil, CheckCircle2 } from "lucide-react";
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

function SummaryRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
      <Icon className="mt-1 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium capitalize truncate">{value || <span className="italic text-muted-foreground normal-case">Not set</span>}</p>
      </div>
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
  const [schoolLga, setSchoolLga] = useState("");
  const [schoolOptions, setSchoolOptions] = useState<{ id: string; name: string; lga: string; school_type: string }[]>([]);
  const [savingSchool, setSavingSchool] = useState(false);
  const [parentPhone, setParentPhone] = useState("");
  const [nin, setNin] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const isEditing = (k: string) => editing.has(k);
  const startEdit = (k: string) => setEditing((s) => new Set(s).add(k));
  const stopEdit = (k: string) => setEditing((s) => { const n = new Set(s); n.delete(k); return n; });

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
      setSchoolLga((p as any)?.lga ?? "");
      setParentPhone((p as any)?.parent_phone ?? "");
      setNin((p as any)?.nin ?? "");

      // Auto-open sections that are missing data so users are prompted to fill them.
      const pp = p as any;
      const missing = new Set<string>();
      if (!pp?.full_name || !pp?.email) missing.add("profile");
      if (!pp?.date_of_birth) missing.add("dob");
      if (role === "learner" && !pp?.class_level) missing.add("class");
      if ((role === "learner" || role === "teacher") && !pp?.lga) missing.add("lga");
      if (!pp?.school_id || !pp?.school_type) missing.add("school");
      if (!pp?.parent_phone || !pp?.nin) missing.add("contact");
      setEditing(missing);

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("schools").select("id,name,lga,school_type").eq("is_active", true).order("name");
      setSchoolOptions((data ?? []) as any);
    })();
  }, []);

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
                {isEditing("profile") ? (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    const trimmedFirst = firstName.trim();
                    const trimmedLast = lastName.trim();
                    const trimmedName = `${trimmedFirst} ${trimmedLast}`.trim();
                    const trimmedEmail = email.trim();
                    if (!trimmedFirst) return toast.error("First name is required");
                    if (!trimmedLast) return toast.error("Last name is required");
                    if (trimmedName.length > 100) return toast.error("Name must be under 100 characters");
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
                      stopEdit("profile");
                    } catch (err: any) {
                      toast.error(err.message ?? "Could not save profile");
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                >
                  <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" /> First name
                    </label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} placeholder="First name" />
                  </div>
                  <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary" /> Last name
                    </label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} placeholder="Last name" />
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
                  <div className="sm:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => stopEdit("profile")} disabled={savingProfile}>Cancel</Button>
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save changes"}
                    </Button>
                  </div>
                </form>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryRow icon={User} label="Full name" value={profile?.full_name} />
                    <SummaryRow icon={Mail} label="Email" value={profile?.email ?? user.email} />
                    <SummaryRow icon={Shield} label="Role" value={role ?? "—"} />
                    <SummaryRow icon={Calendar} label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"} />
                    <div className="sm:col-span-2 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => startEdit("profile")}><Pencil className="mr-2 h-4 w-4" />Change</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`border-border/60 ${!profile?.date_of_birth ? "ring-2 ring-gold/60" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Date of Birth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing("dob") ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {profile?.date_of_birth
                        ? "Update your date of birth — we'll send you a birthday message every year."
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
                        stopEdit("dob");
                      }}
                    >
                      <div className="flex-1 min-w-[220px]">
                        <Input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => stopEdit("dob")} disabled={savingDob}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={savingDob || !dob}>
                        {savingDob ? "Saving…" : "Save"}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <SummaryRow icon={Calendar} label="Date of birth" value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : ""} />
                    <Button size="sm" variant="outline" onClick={() => startEdit("dob")}><Pencil className="mr-2 h-4 w-4" />Change</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {role === "learner" && (
              <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader><CardTitle>My class</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {isEditing("class") ? (
                    <>
                      <p className="text-sm text-muted-foreground">Set your class so teachers can assign courses to you (e.g. "JSS 1", "Primary 4").</p>
                      <ClassEditor
                        initial={profile?.class_level ?? ""}
                        onSave={async (val) => {
                          const { error } = await supabase.from("profiles").update({ class_level: val || null } as any).eq("id", user.id);
                          if (error) { toast.error(error.message); return; }
                          setProfile((prev) => prev ? { ...prev, class_level: val || null } : prev);
                          toast.success("Class saved");
                          stopEdit("class");
                        }}
                      />
                      <Button size="sm" variant="ghost" onClick={() => stopEdit("class")}>Cancel</Button>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <SummaryRow icon={GraduationCap} label="Class" value={profile?.class_level} />
                      <Button size="sm" variant="outline" onClick={() => startEdit("class")}><Pencil className="mr-2 h-4 w-4" />Change</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(role === "learner" || role === "teacher") && (
              <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader><CardTitle>Local Government</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {isEditing("lga") ? (
                    <>
                      <p className="text-sm text-muted-foreground">Select your Local Government Area in Edo State.</p>
                      <LgaEditor
                        initial={profile?.lga ?? ""}
                        onSave={async (val) => {
                          const { error } = await supabase.from("profiles").update({ lga: val || null } as any).eq("id", user.id);
                          if (error) { toast.error(error.message); return; }
                          setProfile((prev) => prev ? { ...prev, lga: val || null } : prev);
                          toast.success("Local Government saved");
                          stopEdit("lga");
                        }}
                      />
                      <Button size="sm" variant="ghost" onClick={() => stopEdit("lga")}>Cancel</Button>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <SummaryRow icon={SchoolIcon} label="Local Government" value={profile?.lga} />
                      <Button size="sm" variant="outline" onClick={() => startEdit("lga")}><Pencil className="mr-2 h-4 w-4" />Change</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><SchoolIcon className="h-5 w-5 text-primary" /> School</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing("school") ? (
                  <>
                    <p className="text-sm text-muted-foreground">Pick your Local Government and school level — the school list updates to show only schools in that LGA and school type.</p>
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!user) return;
                        setSavingSchool(true);
                        const { error } = await supabase.from("profiles").update({
                          lga: schoolLga || null,
                          school_type: schoolType || null,
                          school_id: schoolId || null,
                        } as any).eq("id", user.id);
                        setSavingSchool(false);
                        if (error) return toast.error(error.message);
                        setProfile((prev) => prev ? { ...prev, lga: schoolLga || null, school_type: schoolType || null, school_id: schoolId || null } : prev);
                        toast.success("School saved");
                        stopEdit("school");
                      }}
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">Local Government</label>
                        <Select value={schoolLga} onValueChange={(v) => { setSchoolLga(v); setSchoolId(""); }}>
                          <SelectTrigger><SelectValue placeholder="Select your LGA" /></SelectTrigger>
                          <SelectContent>
                            {EDO_LGAS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">School type</label>
                        <Select value={schoolType} onValueChange={(v) => { setSchoolType(v); setSchoolId(""); }}>
                          <SelectTrigger><SelectValue placeholder="Select school type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="jss">Junior Secondary (JSS)</SelectItem>
                            <SelectItem value="sss">Senior Secondary (SSS)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">School name</label>
                        <Select value={schoolId} onValueChange={setSchoolId} disabled={!schoolLga || !schoolType}>
                          <SelectTrigger>
                            <SelectValue placeholder={!schoolLga ? "Pick LGA first" : !schoolType ? "Pick school type first" : "Select your school"} />
                          </SelectTrigger>
                          <SelectContent>
                            {schoolOptions
                              .filter((s) => s.lga === schoolLga && s.school_type === schoolType)
                              .map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            {schoolLga && schoolType && schoolOptions.filter((s) => s.lga === schoolLga && s.school_type === schoolType).length === 0 && (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">No schools listed for this LGA and type yet.</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => stopEdit("school")} disabled={savingSchool}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={savingSchool}>
                          {savingSchool ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryRow icon={SchoolIcon} label="School" value={schoolOptions.find((s) => s.id === profile?.school_id)?.name} />
                    <SummaryRow icon={GraduationCap} label="School type" value={profile?.school_type} />
                    <SummaryRow icon={SchoolIcon} label="LGA" value={profile?.lga} />
                    <div className="flex items-end justify-end">
                      <Button size="sm" variant="outline" onClick={() => startEdit("school")}><Pencil className="mr-2 h-4 w-4" />Change</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><IdCard className="h-5 w-5 text-primary" /> Parent contact & NIN</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing("contact") ? (
                  <>
                    <p className="text-sm text-muted-foreground">Add a parent or guardian phone number and your National Identification Number (NIN).</p>
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!user) return;
                        const phone = parentPhone.trim();
                        const ninVal = nin.trim();
                        if (phone && !/^\+?[0-9\s-]{7,20}$/.test(phone)) return toast.error("Enter a valid phone number");
                        if (!ninVal) return toast.error("Please enter your 11-digit NIN");
                        if (!/^[0-9]{11}$/.test(ninVal)) return toast.error(`NIN must be 11 digits — you've entered ${ninVal.length}`);
                        setSavingContact(true);
                        const { error } = await supabase.from("profiles").update({
                          parent_phone: phone || null,
                          nin: ninVal || null,
                        } as any).eq("id", user.id);
                        setSavingContact(false);
                        if (error) return toast.error(error.message);
                        setProfile((prev) => prev ? { ...prev, parent_phone: phone || null, nin: ninVal || null } : prev);
                        toast.success("Contact details saved");
                        stopEdit("contact");
                      }}
                    >
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Phone className="h-3.5 w-3.5 text-primary" /> Parent phone</label>
                        <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} maxLength={20} placeholder="e.g. +234 803 000 0000" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><IdCard className="h-3.5 w-3.5 text-primary" /> NIN</label>
                        <Input
                          value={nin}
                          onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                          maxLength={11}
                          inputMode="numeric"
                          placeholder="11-digit NIN"
                          aria-invalid={nin.length > 0 && nin.length < 11}
                          className={nin.length > 0 && nin.length < 11 ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        <p className={`text-xs ${nin.length === 11 ? "text-emerald-600" : nin.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {nin.length === 0
                            ? "Enter all 11 digits of your NIN."
                            : nin.length < 11
                              ? `${11 - nin.length} more digit${11 - nin.length === 1 ? "" : "s"} needed (${nin.length}/11).`
                              : "Looks good ✓"}
                        </p>
                      </div>
                      <div className="sm:col-span-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => stopEdit("contact")} disabled={savingContact}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={savingContact}>
                          {savingContact ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryRow icon={Phone} label="Parent phone" value={profile?.parent_phone} />
                    <SummaryRow icon={IdCard} label="NIN" value={profile?.nin} />
                    <div className="sm:col-span-2 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => startEdit("contact")}><Pencil className="mr-2 h-4 w-4" />Change</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Legal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Review the legal agreements that govern your use of the EdoSUBEB platform.</p>
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
