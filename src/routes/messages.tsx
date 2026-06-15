import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

interface Contact { user_id: string; full_name: string | null; email: string | null; role: string }
interface Msg { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null }

function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("list_my_message_contacts");
      const list = (data ?? []) as Contact[];
      setContacts(list);
      if (list.length && !active) setActive(list[0].user_id);
      setLoading(false);
    })();
  }, [user]);

  const loadThread = async (other: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Msg[]);
    // mark received as read
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .eq("sender_id", other)
      .is("read_at", null);
  };

  useEffect(() => { if (active) loadThread(active); }, [active, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dm-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.sender_id === user.id || m.recipient_id === user.id) {
          if (active && (m.sender_id === active || m.recipient_id === active)) {
            setMessages((prev) => [...prev, m]);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, active]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!user || !active || !body.trim()) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id, recipient_id: active, body: body.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setBody("");
    loadThread(active);
  };

  const activeContact = useMemo(() => contacts.find((c) => c.user_id === active), [contacts, active]);
  const label = (c: Contact) => c.full_name || c.email || "User";

  return (
    <DashboardShell title="Messages">
      <div className="grid gap-4 md:grid-cols-[280px_1fr] md:h-[70vh]">
        <Card className="overflow-hidden max-h-[40vh] md:max-h-none">
          <CardContent className="p-0 h-full overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-6 w-6" />
                No contacts yet. Enroll in a course to message your teacher.
              </div>
            ) : (
              <ul>
                {contacts.map((c) => (
                  <li key={c.user_id}>
                    <button
                      onClick={() => setActive(c.user_id)}
                      className={`flex w-full items-start gap-2 border-b p-3 text-left text-sm hover:bg-muted ${active === c.user_id ? "bg-muted" : ""}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{label(c)}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{c.role}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col min-h-[60vh] md:min-h-0">
          {!activeContact ? (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation
            </CardContent>
          ) : (
            <>
              <div className="border-b p-3">
                <p className="font-semibold">{label(activeContact)}</p>
                <p className="text-xs text-muted-foreground capitalize">{activeContact.role}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">No messages yet — say hi.</p>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="border-t p-3 flex gap-2">
                <Textarea
                  placeholder="Type a message…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  className="min-h-[44px] max-h-32"
                />
                <Button onClick={send} disabled={sending || !body.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
