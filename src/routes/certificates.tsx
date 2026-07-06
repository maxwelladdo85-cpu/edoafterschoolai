import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Loader2 } from "lucide-react";
import { SUBEB_LOGO_DATA_URL } from "@/lib/subeb-logo-data";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/certificates")({ component: CertificatesPage });

interface Cert {
  id: string;
  certificate_code: string;
  learner_name: string;
  course_name: string;
  course_id: string;
  issued_at: string;
}

function buildCertificateSvg(c: Cert): string {
  const issued = new Date(c.issued_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850">
  <rect width="1200" height="850" fill="#ffffff"/>
  <!-- Gold outer border -->
  <rect x="20" y="20" width="1160" height="810" fill="none" stroke="#D4AF37" stroke-width="6"/>
  <rect x="34" y="34" width="1132" height="782" fill="none" stroke="#D4AF37" stroke-width="1"/>

  <!-- Green header band -->
  <rect x="60" y="60" width="1080" height="160" fill="#00843D"/>
  <text x="600" y="128" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" letter-spacing="1">EDO STATE UNIVERSAL BASIC EDUCATION BOARD</text>
  <text x="600" y="180" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#ffffff">EdoSUBEB • Quality Education for All</text>

  <!-- Logo -->
  <image href="${SUBEB_LOGO_DATA_URL}" x="530" y="245" width="140" height="140" preserveAspectRatio="xMidYMid meet"/>

  <!-- Title -->
  <text x="600" y="450" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="56" font-weight="bold" fill="#111111">Certificate of Completion</text>

  <text x="600" y="500" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#555555">This is to certify that</text>

  <!-- Recipient name -->
  <text x="600" y="575" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="46" font-weight="bold" fill="#111111">${esc(c.learner_name)}</text>
  <line x1="230" y1="600" x2="970" y2="600" stroke="#D4AF37" stroke-width="2"/>

  <text x="600" y="650" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#555555">has successfully completed the course</text>

  <!-- Course name -->
  <text x="600" y="705" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="30" font-weight="bold" fill="#00843D">${esc(c.course_name)}</text>

  <!-- Signature lines -->
  <line x1="110" y1="770" x2="410" y2="770" stroke="#C62828" stroke-width="1.5"/>
  <text x="260" y="792" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#111111">Executive Chairman</text>
  <text x="260" y="812" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#555555">Edo SUBEB</text>

  <line x1="790" y1="770" x2="1090" y2="770" stroke="#C62828" stroke-width="1.5"/>
  <text x="940" y="792" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#111111">Director, School Support Services</text>
  <text x="940" y="812" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#555555">Digital Learning Division</text>

  <!-- Issued + ID -->
  <text x="600" y="790" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#333333">Issued on ${esc(issued)}</text>
  <text x="600" y="812" text-anchor="middle" font-family="'Courier New', monospace" font-size="13" fill="#888888" letter-spacing="1">Certificate ID: ${esc(c.certificate_code)}</text>
</svg>`;
}

async function downloadCertificate(c: Cert) {
  const svg = buildCertificateSvg(c);
  // Rasterize SVG → canvas → PNG → PDF (landscape A4-ish, matches 1200x850 viewBox)
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to render certificate"));
      img.src = svgUrl;
    });
    const scale = 2; // higher DPI
    const canvas = document.createElement("canvas");
    canvas.width = 1200 * scale;
    canvas.height = 850 * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [1200, 850] });
    pdf.addImage(png, "PNG", 0, 0, 1200, 850);
    pdf.save(`Certificate-${c.certificate_code}.pdf`);
  } finally {
    setTimeout(() => URL.revokeObjectURL(svgUrl), 1000);
  }
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
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button size="sm" onClick={() => downloadCertificate(c)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Link to="/courses/$courseId" params={{ courseId: c.course_id }} className="text-xs text-primary hover:underline">
                    View course →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
