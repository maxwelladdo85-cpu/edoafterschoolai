import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Award, Users, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CLASS_GROUPS } from "@/lib/classes";
import { toast } from "sonner";

const STICKERS: { code: string; label: string; emoji: string }[] = [
  { code: "gold_star", label: "Gold Star", emoji: "⭐" },
  { code: "super_star", label: "Super Star", emoji: "🌟" },
  { code: "hard_worker", label: "Hard Worker", emoji: "💪" },
  { code: "perfect_attendance", label: "Perfect Attendance", emoji: "📅" },
  { code: "top_scorer", label: "Top Scorer", emoji: "🏆" },
  { code: "creative_thinker", label: "Creative Thinker", emoji: "💡" },
  { code: "team_player", label: "Team Player", emoji: "🤝" },
  { code: "most_improved", label: "Most Improved", emoji: "📈" },
];

interface Learner { user_id: string; full_name: string | null; email: string | null }

export function TeacherStickersPanel() {
  const [classLevel, setClassLevel] = useState<string>("");
  const [sticker, setSticker] = useState<string>(STICKERS[0].code);
  const [customSticker, setCustomSticker] = useState("");
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [individualBusy, setIndividualBusy] = useState<string | null>(null);
  const [classBusy, setClassBusy] = useState(false);

  const effectiveCode = useMemo(
    () => (customSticker.trim() ? customSticker.trim().toLowerCase().replace(/\s+/g, "_") : sticker),
    [customSticker, sticker]
  );

  useEffect(() => {
    if (!classLevel) { setLearners([]); return; }
    (async () => {
      setLoadingLearners(true);
      const { data, error } = await supabase.rpc("list_learners_in_class", { p_class_level: classLevel });
      if (error) toast.error(error.message);
      setLearners((data ?? []) as Learner[]);
      setLoadingLearners(false);
    })();
  }, [classLevel]);

  const awardToLearner = async (learnerId: string) => {
    if (!effectiveCode) return toast.error("Choose a sticker first");
    setIndividualBusy(learnerId);
    const { error } = await supabase.rpc("teacher_award_badge", { p_learner: learnerId, p_code: effectiveCode });
    setIndividualBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Sticker awarded");
  };

  const awardToClass = async () => {
    if (!classLevel) return toast.error("Select a class");
    if (!effectiveCode) return toast.error("Choose a sticker");
    setClassBusy(true);
    const { data, error } = await supabase.rpc("teacher_award_badge_to_class", {
      p_class_level: classLevel, p_code: effectiveCode,
    });
    setClassBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Awarded "${effectiveCode}" to ${data ?? 0} learner(s) in ${classLevel}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
            <Sparkles className="h-4 w-4" />
          </span>
          Stickers & Rewards
        </CardTitle>
        <p className="text-sm text-muted-foreground">Award stickers to a whole class or to individual learners.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Class</Label>
            <Select value={classLevel} onValueChange={setClassLevel}>
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
          </div>
          <div className="space-y-1">
            <Label>Sticker</Label>
            <Select value={sticker} onValueChange={(v) => { setSticker(v); setCustomSticker(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STICKERS.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.emoji} {s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Custom sticker name (optional)</Label>
          <Input
            placeholder="e.g. Reading Champion"
            value={customSticker}
            onChange={(e) => setCustomSticker(e.target.value)}
            maxLength={40}
          />
          <p className="text-xs text-muted-foreground">
            Will be saved as <code className="font-mono">{effectiveCode || "—"}</code>.
          </p>
        </div>

        <Tabs defaultValue="class">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="class"><Users className="mr-2 h-4 w-4" /> Whole Class</TabsTrigger>
            <TabsTrigger value="individual"><User className="mr-2 h-4 w-4" /> Individual</TabsTrigger>
          </TabsList>

          <TabsContent value="class" className="mt-4">
            <Button onClick={awardToClass} disabled={!classLevel || classBusy} className="gap-2">
              {classBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
              Award to entire {classLevel || "class"}
            </Button>
          </TabsContent>

          <TabsContent value="individual" className="mt-4 space-y-3">
            {!classLevel ? (
              <p className="text-sm text-muted-foreground">Select a class to see learners.</p>
            ) : loadingLearners ? (
              <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading learners…</div>
            ) : learners.length === 0 ? (
              <p className="text-sm text-muted-foreground">No learners found in {classLevel}.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {learners.map((l) => (
                  <li key={l.user_id} className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.full_name || l.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={individualBusy === l.user_id}
                      onClick={() => awardToLearner(l.user_id)}
                    >
                      {individualBusy === l.user_id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Award className="mr-2 h-4 w-4" /> Award</>}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
