import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CLASS_GROUPS } from "@/lib/classes";

export function AssignClassButton({ courseId, defaultClass }: { courseId: string; defaultClass?: string | null }) {
  const [open, setOpen] = useState(false);
  const [cls, setCls] = useState(defaultClass ?? "");
  const [busy, setBusy] = useState(false);

  const assign = async () => {
    const value = cls.trim();
    if (!value) return toast.error("Enter a class");
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("enroll_class_in_course", { p_course_id: courseId, p_class_level: value });
      if (error) throw error;
      const n = (data as number) ?? 0;
      toast.success(n === 0 ? `No new students in "${value}" — already enrolled or none found` : `Enrolled ${n} student${n === 1 ? "" : "s"} from ${value}`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to assign");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary"><UserPlus className="mr-1 h-3.5 w-3.5" />Assign to class</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign course to a class</DialogTitle>
          <DialogDescription>Every learner whose class matches will be enrolled. Already-enrolled students are skipped.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Class</Label>
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {CLASS_GROUPS.map((g) => (
                <SelectGroup key={g.label}>
                  <SelectLabel>{g.label}</SelectLabel>
                  {g.classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Every learner whose profile class matches will be enrolled.</p>
        </div>
        <DialogFooter>
          <Button onClick={assign} disabled={busy}>
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning…</> : "Enroll class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
