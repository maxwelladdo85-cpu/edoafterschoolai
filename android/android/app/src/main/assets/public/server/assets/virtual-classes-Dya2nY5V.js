import { c as createLucideIcon } from "./createLucideIcon-Dn0WUx8o.js";
const __iconNode = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
];
const ExternalLink = createLucideIcon("external-link", __iconNode);
const JOIN_WINDOW_MS = 10 * 60 * 1e3;
function getStatus(c) {
  const start = new Date(c.scheduled_at).getTime();
  const end = start + c.duration_minutes * 60 * 1e3;
  const now = Date.now();
  if (now < start - JOIN_WINDOW_MS) return "upcoming";
  if (now > end) return "ended";
  return "live";
}
function formatWhen(iso) {
  const d = new Date(iso);
  return d.toLocaleString(void 0, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
export {
  ExternalLink as E,
  formatWhen as f,
  getStatus as g
};
