import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { GraduationCap, Users, Sparkles, BookOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-gold/10">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <Logo />
        <Link to="/login"><Button variant="default">Sign in</Button></Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-foreground">
            <Sparkles className="h-3 w-3" /> Edo State SUBEB · Quality Education For All
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
            Edo After School <span className="text-primary">AI</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            An AI-powered learning management platform for Learners, Teachers and Administrators across Edo State.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/login"><Button size="lg">Get started</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">I have an account</Button></Link>
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "For Learners", body: "Track enrolled courses, progress, and notifications in one place." },
            { icon: GraduationCap, title: "For Teachers", body: "Create and publish courses for your students with one click." },
            { icon: Users, title: "For Admins", body: "Manage users and oversee active courses across the board." },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
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
