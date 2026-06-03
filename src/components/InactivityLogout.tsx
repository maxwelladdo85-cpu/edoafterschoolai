import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const IDLE_MS = 5 * 60 * 1000; // 5 minutes

export function InactivityLogout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        toast.message("Signed out due to 5 minutes of inactivity.");
        await signOut();
        nav({ to: "/login" });
      }, IDLE_MS);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "visibilitychange",
    ] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true } as any));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, signOut, nav]);

  return null;
}
