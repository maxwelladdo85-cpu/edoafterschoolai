import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Loader2 } from "lucide-react";

export const Route = createFileRoute("/certificates")({ component: CertificatesPage });

interface Cert {
  id: string;
  certificate_code: string;
  learner_name: string;
  course_name: string;
  course_id: string;
  issued_at: string;
}

function CertificatesPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("learner_id", user.id)
        .order("issued_at", { ascending: false });
      setCerts((data ?? []) as Cert[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardShell title="Certificates">
      {loading ? (
        <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
      ) : certs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Complete a course to earn your first certificate.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certs.map((c) => (
            <Card key={c.id} className="overflow-hidden border-2 border-primary/30">
              <CardContent className="p-6 text-center space-y-3 bg-gradient-to-br from-primary/5 to-accent/5">
                <Award className="mx-auto h-12 w-12 text-primary" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
                <p className="text-lg font-bold">{c.learner_name}</p>
                <p className="text-sm">has successfully completed</p>
                <p className="text-base font-semibold text-primary">{c.course_name}</p>
                <p className="text-xs text-muted-foreground">
                  Issued {new Date(c.issued_at).toLocaleDateString()}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">ID: {c.certificate_code}</p>
                <Link to="/courses/$courseId" params={{ courseId: c.course_id }} className="text-xs text-primary hover:underline">
                  View course →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
