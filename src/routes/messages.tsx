import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Inbox, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

interface Contact { user_id: string; full_name: string | null; email: string | null; role: string }
interface Msg { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null }

function MessagesPage() {
  const { user, loading: authLoading, role } = useAuth();
  const nav = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // Use new RPC that returns: all teachers (for learners), enrolled learners (for teachers), everyone (for admins)
      const { data, error } = await supabase.rpc("list_messageable_users");
      if (error) {
        toast.error(error.message);
        setContacts([]);
      } else {
        setContacts((data ?? []) as Contact[]);
      }
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
        if (m.sender_id === user.id || m.recipient_id === user.id || role === "admin") {
          if (active && (m.sender_id === active || m.recipient_id === active)) {
            setMessages((prev) => [...prev, m]);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, active, role]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const deleteMessage = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("direct_messages")
      .delete()
      .eq("id", id)
      .eq("recipient_id", user.id);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message deleted");
  };

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

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      (c.full_name?.toLowerCase().includes(q)) || (c.email?.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  const activeContact = useMemo(() => contacts.find((c) => c.user_id === active), [contacts, active]);
  const label = (c: Contact) => c.full_name || c.email || "User";

  const placeholderText =
    role === "learner" ? "Search a teacher by name…" :
    role === "teacher" ? "Search a learner by name…" :
    "Search any user…";

  return (
    <DashboardShell title="Messages">
      <div className="grid gap-4 md:grid-cols-[300px_1fr] md:h-[70vh]">
        <Card className="overflow-hidden max-h-[50vh] md:max-h-none flex flex-col">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholderText}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-6 w-6" />
                {contacts.length === 0
                  ? (role === "learner" ? "No teachers found yet." : "No contacts yet.")
                  : "No matches for that search."}
              </div>
            ) : (
              <ul>
                {filteredContacts.map((c) => (
                  <li key={c.user_id}>
                    <button
                      onClick={() => setActive(c.user_id)}
                      className={`flex w-full items-start gap-2 border-b p-3 text-left text-sm hover:bg-muted ${active === c.user_id ? "bg-muted" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{label(c)}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
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
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-6">
              {role === "learner"
                ? "Pick a teacher from the list (search by name) to start a conversation."
                : "Select a conversation"}
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
                    <div key={m.id} className={`group flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!mine && (
                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                          aria-label="Delete message"
                          title="Delete message"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
