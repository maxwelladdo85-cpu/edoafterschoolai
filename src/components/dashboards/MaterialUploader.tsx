import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ContentType = "video" | "pdf" | "audio" | "doc";

function detectType(file: File): ContentType | null {
  const m = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  if (m.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(n)) return "video";
  if (m.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(n)) return "audio";
  if (m === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (
    m.includes("msword") ||
    m.includes("officedocument.wordprocessingml") ||
    /\.(doc|docx)$/.test(n)
  ) return "doc";
  return null;
}

export function MaterialUploader({ courseId, onUploaded }: { courseId: string; onUploaded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setTitle(""); setFile(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Pick a file to upload");
    const type = detectType(file);
    if (!type) return toast.error("Unsupported file. Use video, audio, PDF, or Word doc.");
    if (file.size > 250 * 1024 * 1024) return toast.error("Max file size is 250 MB");

    setBusy(true);
    try {
      // Ensure a "Materials" module exists for this course
      let { data: mod } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId)
        .eq("title", "Materials")
        .maybeSingle();
      if (!mod) {
        const { data: created, error: mErr } = await supabase
          .from("modules")
          .insert({ course_id: courseId, title: "Materials", position: 0 })
          .select("id")
          .single();
        if (mErr) throw mErr;
        mod = created;
      }

      // Upload to storage: course-materials/{courseId}/{timestamp}-{filename}
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${courseId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("course-materials")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("course-materials").getPublicUrl(path);

      // Determine next lesson position
      const { count } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("module_id", mod!.id);

      const { error: lErr } = await supabase.from("lessons").insert({
        module_id: mod!.id,
        title: title.trim() || file.name,
        position: count ?? 0,
        content_type: type,
        content_url: pub.publicUrl,
      });
      if (lErr) throw lErr;

      toast.success("Material uploaded");
      reset();
      setOpen(false);
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary"><Upload className="mr-1 h-3.5 w-3.5" />Upload material</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload course material</DialogTitle>
          <DialogDescription>Add a video, PDF, Word document, or audio for learners to engage with.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson 1 — Introduction" maxLength={150} />
          </div>
          <div className="space-y-1">
            <Label>File</Label>
            <Input
              type="file"
              accept="video/*,audio/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            <p className="text-xs text-muted-foreground">Supported: MP4, WebM, MP3, WAV, PDF, DOC/DOCX. Max 250 MB.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
