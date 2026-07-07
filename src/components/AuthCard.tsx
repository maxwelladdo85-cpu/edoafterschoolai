import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, Smartphone, ChevronUp, ChevronDown } from "lucide-react";
import { lookupLearnerEmail, checkLearnerNinAvailable } from "@/lib/learner-auth.functions";
import { lookupTeacherEmail } from "@/lib/teacher-auth.functions";
import { CLASS_GROUPS } from "@/lib/classes";
import { EDO_LGAS } from "@/lib/lgas";
import edolearnApk from "@/assets/edolearn-apk.asset.json";

const ForgotPasswordDialog = lazy(() =>
  import("@/components/ForgotPasswordDialog").then((m) => ({ default: m.ForgotPasswordDialog })),
);

function PasswordInput({ id, value, onChange, minLength }: { id: string; value: string; onChange: (v: string) => void; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} required minLength={minLength} value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthCard() {
  const nav = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // name derived from firstName + lastName in signup
  const [role, setRole] = useState<"learner" | "teacher" | "admin" | "scripter">("learner");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [learnerNin, setLearnerNin] = useState("");
  const [learnerPhone, setLearnerPhone] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [teacherOracle, setTeacherOracle] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  // Extra sign-up fields (match Settings page)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [lga, setLga] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<{ id: string; name: string; lga: string; school_type: string }[]>([]);
  const lookupEmail = useServerFn(lookupLearnerEmail);
  const lookupTeacher = useServerFn(lookupTeacherEmail);
  const checkNin = useServerFn(checkLearnerNinAvailable);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const updateScrollable = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollButtons(el.scrollHeight > el.clientHeight + 16);
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    updateScrollable();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollable);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("schools").select("id,name,lga,school_type").eq("is_active", true).order("name");
      setSchools((data ?? []) as any);
    })();
  }, []);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let signInEmail = email;
      if (role === "learner") {
        if (!/^[0-9]{11}$/.test(learnerNin.trim())) {
          throw new Error("Enter your 11-digit NIN");
        }
        const phoneDigits = learnerPhone.replace(/\D/g, "");
        if (phoneDigits.length !== 11) {
          throw new Error(`Phone number must be 11 digits — you've entered ${phoneDigits.length}`);
        }
        const res = await lookupEmail({
          data: {
            nin: learnerNin.trim(),
            phone: learnerPhone.trim(),
            email: learnerEmail.trim() || undefined,
          },
        });
        signInEmail = res.email;
      } else if (role === "teacher") {
        if (!teacherOracle.trim()) {
          throw new Error("Enter your Oracle number");
        }
        const res = await lookupTeacher({
          data: {
            oracle: teacherOracle.trim(),
            email: teacherEmail.trim() || undefined,
          },
        });
        signInEmail = res.email;
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password,
      });
      if (error) throw error;

      // Gate by profile status
      if (signInData.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", signInData.user.id)
          .maybeSingle();
        if (prof?.status === "pending") {
          await supabase.auth.signOut();
          throw new Error("Your teacher account is still pending admin approval.");
        }
        if (prof?.status === "inactive") {
          await supabase.auth.signOut();
          throw new Error("Your account has been deactivated. Contact an admin.");
        }
      }
      toast.success("Welcome back");
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!firstName.trim() || !lastName.trim()) throw new Error("Enter your first and last name");

      // Scripter: lightweight signup (email + password + name only) — no DOB/school required.
      if (role === "scripter") {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirectUrl, data: { full_name: fullName, signup_role: "scripter" } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").update({ full_name: fullName, status: "active" } as any).eq("id", data.user.id);
        }
        toast.success("Scripter account created");
        nav({ to: "/dashboard" });
        return;
      }

      if (!dob) throw new Error("Select your date of birth");
      if (!lga) throw new Error("Select your local government");
      if (!schoolType) throw new Error("Select your school type");
      if (!schoolId) throw new Error("Select your school");

      if (role === "learner") {
        if (!classLevel) throw new Error("Select your class");
        if (!/^[0-9]{11}$/.test(learnerNin.trim())) {
          throw new Error("Enter the learner's 11-digit NIN");
        }
        const phoneDigits = learnerPhone.replace(/\D/g, "");
        if (phoneDigits.length !== 11) {
          throw new Error("Phone number must be 11 digits");
        }
        const { available } = await checkNin({ data: { nin: learnerNin.trim() } });
        if (!available) {
          throw new Error("A learner with this NIN already has an account. Please sign in instead.");
        }
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
      });
      if (error) throw error;

      // Common profile fields for both roles
      if (data.user) {
        const baseUpdate: Record<string, any> = {
          full_name: fullName,
          date_of_birth: dob,
          lga,
          school_type: schoolType,
          school_id: schoolId,
        };
        if (role === "learner") {
          baseUpdate.class_level = classLevel;
          baseUpdate.nin = learnerNin.trim();
          baseUpdate.parent_phone = learnerPhone.trim();
        }
        const { error: updErr } = await supabase.from("profiles").update(baseUpdate as any).eq("id", data.user.id);
        if (updErr) {
          if (/nin/i.test(updErr.message) || /unique/i.test(updErr.message)) {
            await supabase.auth.signOut();
            throw new Error("A learner with this NIN already has an account.");
          }
          throw updErr;
        }
      }

      // Teacher signup -> mark profile pending; admin must approve before role granted.
      if (data.user && role === "teacher") {
        await supabase.from("profiles").update({ status: "pending" }).eq("id", data.user.id);
        await supabase.auth.signOut();
        toast.success("Account created. An admin must approve your teacher account before you can sign in.");
        setTab("signin");
        return;
      }

      toast.success("Welcome to Digital Learning @ Home");
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={scrollRef} className="min-h-[100dvh] w-full flex items-start sm:items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] overflow-y-auto bg-gradient-to-br from-primary/10 via-background to-gold/10">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center"><Logo /></div>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col items-center gap-2">
            <a
              href={edolearnApk.url}
              download="EdoLearn-v1.3.apk"
              className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              Download Android app (APK)
            </a>
            <Link to="/" className="text-xs text-muted-foreground hover:underline">← Back to home</Link>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 pt-3">
                <div className="space-y-1">
                  <Label>Sign in as</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="scripter">Sub Admin – Scripter</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === "learner" ? (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="lnin">NIN</Label>
                      <Input
                        id="lnin"
                        inputMode="numeric"
                        maxLength={11}
                        required
                        placeholder="11-digit NIN"
                        value={learnerNin}
                        onChange={(e) => setLearnerNin(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lphone">Phone number</Label>
                      <Input
                        id="lphone"
                        inputMode="numeric"
                        required
                        maxLength={11}
                        placeholder="090XXXXX (Must be 11 digits)"
                        value={learnerPhone}
                        onChange={(e) => setLearnerPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        aria-invalid={learnerPhone.length > 0 && learnerPhone.length !== 11}
                        className={learnerPhone.length > 0 && learnerPhone.length !== 11 ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      <p className={`text-xs ${learnerPhone.length === 11 ? "text-emerald-600" : learnerPhone.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {learnerPhone.length === 11
                          ? "Looks good"
                          : `Enter 11 digits, e.g. 090XXXXX (${learnerPhone.length}/11)`}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lemail">Email <span className="text-muted-foreground">(optional)</span></Label>
                      <Input
                        id="lemail"
                        type="email"
                        placeholder="Only needed if more than one account matches"
                        value={learnerEmail}
                        onChange={(e) => setLearnerEmail(e.target.value)}
                      />
                    </div>
                  </>
                ) : role === "teacher" ? (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="toracle">Oracle number</Label>
                      <Input
                        id="toracle"
                        required
                        placeholder="e.g. T1000"
                        value={teacherOracle}
                        onChange={(e) => setTeacherOracle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="temail">Email <span className="text-muted-foreground">(optional)</span></Label>
                      <Input
                        id="temail"
                        type="email"
                        placeholder="Only needed if more than one account matches"
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <Label htmlFor="e1">Email</Label>
                    <Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="p1">Password</Label>
                  <PasswordInput id="p1" value={password} onChange={setPassword} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">Sign In</Button>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(role === "learner" ? learnerEmail : email); setForgotOpen(true); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => setTab("signup")} className="font-medium text-primary hover:underline">
                  Sign up
                </button>
              </p>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="fn2">First name</Label>
                    <Input id="fn2" required value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ln2">Last name</Label>
                    <Input id="ln2" required value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="e2">Email</Label>
                  <Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p2">Password</Label>
                  <PasswordInput id="p2" value={password} onChange={setPassword} minLength={6} />
                </div>
                {role !== "scripter" && (
                  <div className="space-y-1">
                    <Label htmlFor="dob2">Date of birth</Label>
                    <Input id="dob2" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>I am a</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="teacher">Teacher (requires admin approval)</SelectItem>
                      <SelectItem value="scripter">Sub Admin – Scripter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {role === "learner" && (
                  <div className="space-y-1">
                    <Label>Class</Label>
                    <Select value={classLevel} onValueChange={setClassLevel}>
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
                )}
                {role !== "scripter" && (
                  <>
                    <div className="space-y-1">
                      <Label>Local government</Label>
                      <Select value={lga} onValueChange={(v) => { setLga(v); setSchoolId(""); }}>
                        <SelectTrigger><SelectValue placeholder="Select your LGA" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Edo State LGAs</SelectLabel>
                            {EDO_LGAS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>School type</Label>
                      <Select value={schoolType} onValueChange={(v) => { setSchoolType(v); setSchoolId(""); }}>
                        <SelectTrigger><SelectValue placeholder="Select school type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>School</Label>
                      <Select value={schoolId} onValueChange={setSchoolId} disabled={!lga || !schoolType}>
                        <SelectTrigger><SelectValue placeholder={!lga || !schoolType ? "Pick LGA and type first" : "Select your school"} /></SelectTrigger>
                        <SelectContent>
                          {schools
                            .filter((s) => (!lga || s.lga === lga) && (!schoolType || s.school_type === schoolType))
                            .map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {role === "learner" && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="snin">NIN</Label>
                      <Input
                        id="snin"
                        inputMode="numeric"
                        maxLength={11}
                        required
                        placeholder="Learner's 11-digit NIN"
                        value={learnerNin}
                        onChange={(e) => setLearnerNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sphone">Parent phone number</Label>
                      <Input
                        id="sphone"
                        inputMode="numeric"
                        required
                        maxLength={11}
                        placeholder="e.g. 09074669411"
                        value={learnerPhone}
                        onChange={(e) => setLearnerPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      />
                      <p className="text-xs text-muted-foreground">
                        NIN and phone number will be used to sign in.
                      </p>
                    </div>
                  </>
                )}
                <Button type="submit" disabled={loading} className="w-full">Create account</Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("signin")} className="font-medium text-primary hover:underline">
                  Sign in
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showScrollButtons && (
        <div className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-50 flex flex-col gap-2">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="rounded-full bg-primary text-primary-foreground shadow-lg p-2 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="rounded-full bg-primary text-primary-foreground shadow-lg p-2 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}

      {forgotOpen && (
        <Suspense fallback={null}>
          <ForgotPasswordDialog
            open={forgotOpen}
            onOpenChange={setForgotOpen}
            initialEmail={forgotEmail}
          />
        </Suspense>
      )}
    </div>
  );
}
