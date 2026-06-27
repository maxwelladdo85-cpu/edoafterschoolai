import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, BookOpenCheck, ClipboardCheck, Flame, Trophy, Star, Sparkles, CalendarCheck2, Lightbulb, Users2, TrendingUp, Medal } from "lucide-react";

const BADGE_META: Record<string, { label: string; icon: any; desc: string }> = {
  first_lesson: { label: "First Lesson", icon: BookOpenCheck, desc: "Completed your first lesson" },
  first_quiz: { label: "First Quiz Passed", icon: ClipboardCheck, desc: "Passed your first quiz" },
  first_course: { label: "First Course", icon: Trophy, desc: "Completed an entire course" },
  streak_7: { label: "7-Day Streak", icon: Flame, desc: "Learned 7 days in a row" },
  gold_star: { label: "Gold Star", icon: Star, desc: "Awarded by your teacher" },
  super_star: { label: "Super Star", icon: Sparkles, desc: "Awarded by your teacher" },
  hard_worker: { label: "Hard Worker", icon: Medal, desc: "Awarded by your teacher" },
  perfect_attendance: { label: "Perfect Attendance", icon: CalendarCheck2, desc: "Awarded by your teacher" },
  top_scorer: { label: "Top Scorer", icon: Trophy, desc: "Awarded by your teacher" },
  creative_thinker: { label: "Creative Thinker", icon: Lightbulb, desc: "Awarded by your teacher" },
  team_player: { label: "Team Player", icon: Users2, desc: "Awarded by your teacher" },
  most_improved: { label: "Most Improved", icon: TrendingUp, desc: "Awarded by your teacher" },
};

export function BadgesPanel({ learnerId }: { learnerId: string }) {
  const { user } = useAuth();
  const id = learnerId || user?.id;
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("badges").select("code, awarded_at").eq("learner_id", id).order("awarded_at");
      setCodes((data ?? []).map((b: any) => b.code));
      setLoading(false);
    })();
  }, [id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Badges</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(BADGE_META).map(([code, meta]) => {
              const earned = codes.includes(code);
              const Icon = meta.icon;
              return (
                <div key={code} className={`rounded-lg border p-3 text-center transition ${earned ? "bg-primary/10 border-primary" : "opacity-50"}`}>
                  <Icon className={`mx-auto mb-2 h-7 w-7 ${earned ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                </div>
              );
            })}
            {codes.filter((c) => !BADGE_META[c]).map((c) => (
              <div key={c} className="rounded-lg border p-3 text-center bg-gold/10 border-gold">
                <Award className="mx-auto mb-2 h-7 w-7 text-gold" />
                <p className="text-sm font-semibold capitalize">{c.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">Awarded by your teacher</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
