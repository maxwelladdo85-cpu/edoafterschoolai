import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff } from "lucide-react";
import { lookupLearnerEmail } from "@/lib/learner-auth.functions";

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
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"learner" | "teacher" | "admin">("learner");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [learnerNin, setLearnerNin] = useState("");
  const [learnerPhone, setLearnerPhone] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const lookupEmail = useServerFn(lookupLearnerEmail);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Enter your email");
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent. Check your inbox.");
    setForgotOpen(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let signInEmail = email;
      if (role === "learner") {
        if (!/^[0-9]{11}$/.test(learnerNin.trim())) {
          throw new Error("Enter your 11-digit NIN");
        }
        if (learnerPhone.replace(/\D/g, "").length < 7) {
          throw new Error("Enter a valid phone number");
        }
        const res = await lookupEmail({
          data: {
            nin: learnerNin.trim(),
            phone: learnerPhone.trim(),
            email: learnerEmail.trim() || undefined,
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
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: name } },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Teacher signup -> mark profile pending; admin must approve before role granted.
    if (data.user && role === "teacher") {
      await supabase.from("profiles").update({ status: "pending" }).eq("id", data.user.id);
      await supabase.auth.signOut();
      setLoading(false);
      toast.success("Account created. An admin must approve your teacher account before you can sign in.");
      setTab("signin");
      return;
    }
    setLoading(false);
    toast.success("Welcome to Digital Learning at Home");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-gold/10">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center"><Logo /></div>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 pt-3">
                <div className="space-y-1">
                  <Label htmlFor="e1">Email</Label>
                  <Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p1">Password</Label>
                  <PasswordInput id="p1" value={password} onChange={setPassword} />
                </div>
                <div className="space-y-1">
                  <Label>Sign in as</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading} className="w-full">Sign In</Button>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
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
                <div className="space-y-1">
                  <Label htmlFor="n2">Full Name</Label>
                  <Input id="n2" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="e2">Email</Label>
                  <Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p2">Password</Label>
                  <PasswordInput id="p2" value={password} onChange={setPassword} minLength={6} />
                </div>
                <div className="space-y-1">
                  <Label>I am a</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="teacher">Teacher (requires admin approval)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← Back to home</Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter the email address linked to your account. We'll send you a secure link to set a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
