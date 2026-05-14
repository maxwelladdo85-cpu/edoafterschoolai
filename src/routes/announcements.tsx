import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { PageHero } from "@/components/PageHero";
import heroAnnouncements from "@/assets/hero-announcements.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Megaphone, Send, Users, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/announcements")({
  component: AnnouncementsPage,
});

interface SentRow {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  user_id: string;
}

function AnnouncementsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [classLevels, setClassLevels] = useState<string[]>([]);
  const [recentSent, setRecentSent] = useState<SentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ class_level: "", title: "", message: "" });
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [sendAt, setSendAt] = useState("");

  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  const isStaff = role === "teacher" || role === "admin";

  useEffect(() => {
    if (!authLoading && user && !isStaff) nav({ to: "/dashboard" });
  }, [authLoading, user, isStaff, nav]);

  const load = async () => {
    if (!user || !isStaff) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("list_learner_classes");
    if (error) { toast.error(error.message); setClassLevels([]); setLoading(false); return; }
    const rows = (data ?? []) as { class_level: string; learner_count: number }[];
    const levels = rows.map((r) => r.class_level);
    setClassLevels(levels);
    if (!form.class_level && levels.length) setForm((f) => ({ ...f, class_level: levels[0] }));
    // map class -> count for recipient hint
    (window as any).__classCounts = Object.fromEntries(rows.map((r) => [r.class_level, Number(r.learner_count)]));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, role]);

  // Recipient count comes from the cached RPC result
  useEffect(() => {
    if (!form.class_level) { setRecipientCount(null); return; }
    const counts = (window as any).__classCounts as Record<string, number> | undefined;
    setRecipientCount(counts?.[form.class_level] ?? null);
  }, [form.class_level, classLevels]);

  const send = async () => {
    if (!form.class_level) { toast.error("Select a class"); return; }
    if (!form.title.trim()) { toast.error("Title required"); return; }
    if (form.title.length > 150) { toast.error("Title too long (max 150)"); return; }
    if (form.message.length > 2000) { toast.error("Message too long (max 2000)"); return; }

    if (schedule) {
      if (!sendAt) { toast.error("Pick a date and time"); return; }
      const when = new Date(sendAt);
      if (isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        toast.error("Scheduled time must be in the future"); return;
      }
      setSending(true);
      const { error } = await supabase.rpc("schedule_class_announcement", {
        p_class_level: form.class_level,
        p_title: form.title.trim(),
        p_message: form.message.trim() || "",
        p_send_at: when.toISOString(),
      });
      setSending(false);
      if (error) { toast.error(error.message); return; }
      toast.success(`Scheduled for ${when.toLocaleString()}`);
    } else {
      setSending(true);
      const { data, error } = await supabase.rpc("send_class_announcement", {
        p_class_level: form.class_level,
        p_title: form.title.trim(),
        p_message: form.message.trim() || "",
      });
      setSending(false);
      if (error) { toast.error(error.message); return; }
      const count = Number(data ?? 0);
      if (count === 0) { toast.error("No learners in that class"); return; }
      toast.success(`Announcement sent to ${count} learner${count === 1 ? "" : "s"}`);
      setRecentSent((prev) => [{
        id: crypto.randomUUID(),
        title: form.title.trim(),
        message: form.message.trim() || null,
        created_at: new Date().toISOString(),
        user_id: form.class_level,
      }, ...prev].slice(0, 8));
    }

    setForm((f) => ({ ...f, title: "", message: "" }));
    setSchedule(false);
    setSendAt("");
    setOpen(false);
  };

  if (loading) {
    return (
      <DashboardShell title="Announcements">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Announcements">
      <div className="space-y-6">
        <PageHero
          eyebrow="Broadcast"
          EyebrowIcon={Megaphone}
          title="Announcements"
          description="Send a notification to every learner in a class. Messages are stored and appear in their notifications."
          backgroundImage={heroAnnouncements}
        />

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Messages</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {classLevels.length === 0
                  ? "No learners with a class level yet — they need to set their class in Settings before you can broadcast."
                  : "Send a message to every learner in a class."}
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />Create new message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create new message</DialogTitle>
                  <DialogDescription>
                    Choose a class — every learner in that class will get this notification.
                  </DialogDescription>
                </DialogHeader>
                {classLevels.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                    There are no classes to broadcast to yet. Each learner has to set their <strong>class</strong> in their profile (Settings) before they can receive announcements.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Class</Label>
                      <Select value={form.class_level} onValueChange={(v) => setForm({ ...form, class_level: v })}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classLevels.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {recipientCount !== null && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" /> {recipientCount} learner{recipientCount === 1 ? "" : "s"} will receive this
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Important update for tomorrow"
                        maxLength={150}
                      />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Write the full message learners will see in their notifications…"
                        rows={5}
                        maxLength={2000}
                      />
                      <p className="mt-1 text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
                    </div>
                    <div className="rounded-md border border-border/60 p-3 space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule}
                          onChange={(e) => setSchedule(e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Schedule for later
                      </label>
                      {schedule && (
                        <div>
                          <Label>Send on</Label>
                          <Input
                            type="datetime-local"
                            value={sendAt}
                            onChange={(e) => setSendAt(e.target.value)}
                            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Uses your local time zone. The message is delivered automatically within ~1 minute of this time.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>Cancel</Button>
                  <Button onClick={send} disabled={sending || !form.class_level || !form.title.trim() || (schedule && !sendAt)}>
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {schedule ? "Schedule announcement" : "Send announcement"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        {recentSent.length > 0 && (
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Recently sent (this session)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recentSent.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-border/60 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{r.title}</p>
                      <Badge variant="secondary">{r.user_id}</Badge>
                    </div>
                    {r.message && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{r.message}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
