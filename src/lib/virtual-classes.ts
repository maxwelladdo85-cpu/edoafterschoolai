export type VirtualClassStatus = "upcoming" | "live" | "ended";

export interface VirtualClass {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  zoom_url: string;
  recording_url: string | null;
  created_at: string;
}

export const JOIN_WINDOW_MS = 10 * 60 * 1000; // can join 10 min before start

export function getStatus(c: { scheduled_at: string; duration_minutes: number }): VirtualClassStatus {
  const start = new Date(c.scheduled_at).getTime();
  const end = start + c.duration_minutes * 60 * 1000;
  const now = Date.now();
  if (now < start - JOIN_WINDOW_MS) return "upcoming";
  if (now > end) return "ended";
  return "live";
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
