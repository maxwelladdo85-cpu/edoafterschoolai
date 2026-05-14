import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  course_id: string;
  author_id: string;
  parent_id: string | null;
  title: string | null;
  body: string;
  created_at: string;
}
interface Profile { id: string; full_name: string | null; email: string | null }

export function CourseForum({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Post[];
    setPosts(list);
    const ids = Array.from(new Set(list.map((p) => p.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p));
      setAuthors(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const submit = async () => {
    if (!user || !body.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("forum_posts").insert({
      course_id: courseId, author_id: user.id, parent_id: null,
      title: title.trim() || null, body: body.trim(),
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setTitle(""); setBody("");
    toast.success("Question posted");
    load();
  };

  const submitReply = async (parentId: string) => {
    if (!user || !replyBody.trim()) return;
    const { error } = await supabase.from("forum_posts").insert({
      course_id: courseId, author_id: user.id, parent_id: parentId,
      body: replyBody.trim(),
    });
    if (error) return toast.error(error.message);
    setReplyTo(null); setReplyBody("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("forum_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const threads = posts.filter((p) => !p.parent_id);
  const repliesFor = (id: string) => posts.filter((p) => p.parent_id === id);
  const authorLabel = (id: string) => authors[id]?.full_name || authors[id]?.email || "User";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Discussion Forum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Ask a question or share something with the class…" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex justify-end">
            <Button size="sm" onClick={submit} disabled={posting || !body.trim()}>
              {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : threads.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No discussions yet. Be the first to post.</p>
        ) : (
          <ul className="space-y-3">
            {threads.map((t) => (
              <li key={t.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {t.title && <p className="font-semibold">{t.title}</p>}
                    <p className="text-xs text-muted-foreground">
                      {authorLabel(t.author_id)} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {user?.id === t.author_id && (
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{t.body}</p>

                <div className="mt-3 space-y-2 border-l-2 pl-3">
                  {repliesFor(t.id).map((r) => (
                    <div key={r.id} className="text-sm">
                      <p className="text-xs text-muted-foreground">
                        <Badge variant="secondary" className="mr-1">{authorLabel(r.author_id)}</Badge>
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </p>
                      <p className="whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                  {replyTo === t.id ? (
                    <div className="space-y-2">
                      <Textarea placeholder="Write a reply…" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); setReplyBody(""); }}>Cancel</Button>
                        <Button size="sm" onClick={() => submitReply(t.id)} disabled={!replyBody.trim()}>Reply</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setReplyTo(t.id)}>
                      <Reply className="mr-1 h-3 w-3" /> Reply
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
