import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Lazy + client-only: the auth form is interactive (no SEO value),
// so we avoid SSR'ing it and ship a tiny shell instead.
const AuthCard = lazy(() =>
  import("@/components/AuthCard").then((m) => ({ default: m.AuthCard })),
);

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-gold/10">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuthCard />
    </Suspense>
  );
}
