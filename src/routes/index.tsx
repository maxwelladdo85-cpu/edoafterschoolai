import { createFileRoute, Link } from "@tanstack/react-router";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { GraduationCap, Users, Sparkles, BookOpen } from "lucide-react";
import learnersImg from "@/assets/learners.jpg";
import teachersImg from "@/assets/teachers.jpg";
import adminsImg from "@/assets/admins.jpg";
import heroBg from "@/assets/hero-bg.jpg";

// Tell the CDN to cache the landing page for 5 minutes and serve stale
// content for up to a day while it refreshes in the background. This means
// anonymous visitors hit the CDN, not the server / database.
const setLandingCacheHeaders = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    }),
  );
  return { ok: true };
});

export const Route = createFileRoute("/")({
  loader: () => setLandingCacheHeaders(),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <img
          src={heroBg}
          alt="An African child learning on a smartphone"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />

        <div className="relative">
          <header className="mx-auto flex max-w-6xl items-center justify-end px-6 pt-2 pb-0" />


          <section className="mx-auto max-w-6xl px-6 pt-0 pb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/20 backdrop-blur px-3 py-1 text-xs font-medium text-foreground">
              <Sparkles className="h-3 w-3" /> EdoSUBEB · Quality Education For All
            </span>
            <h1 className="mt-6 text-6xl font-extrabold tracking-tight md:text-7xl lg:text-8xl">
              Digital Learning <span className="text-primary">at Home</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl font-bold text-foreground/90 md:text-2xl">
              An AI-powered learning management platform for Learners, Teachers and Administrators across Edo State.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/login"><Button size="lg">Get started</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">I have an account</Button></Link>
            </div>
          </section>
        </div>
      </div>

      <main className="mx-auto -mt-12 max-w-6xl px-6 pb-16">

        <section className="grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "For Learners", body: "Track enrolled courses, progress, and notifications in one place.", img: learnersImg },
            { icon: GraduationCap, title: "For Teachers", body: "Create and publish courses for your students with one click.", img: teachersImg },
            { icon: Users, title: "For Admins", body: "Manage users and oversee active courses across the board.", img: adminsImg },
          ].map((f, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img src={f.img} alt={f.title} width={1024} height={768} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><f.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Edo State Universal Basic Education Board (SUBEB)
      </footer>
    </div>
  );
}
