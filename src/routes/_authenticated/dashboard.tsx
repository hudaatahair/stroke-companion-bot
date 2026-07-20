import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, toggleExerciseDone } from "@/lib/patient.functions";
import { dailyMotivation } from "@/lib/coach.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Sun, Sunset, Moon, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Today · StrokeCare AI" }] }),
  component: Dashboard,
});

const TIME_META = {
  morning: { label: "Morning", icon: Sun },
  afternoon: { label: "Afternoon", icon: Sunset },
  evening: { label: "Evening", icon: Moon },
  any: { label: "Anytime", icon: Sparkles },
} as const;

function Dashboard() {
  const router = useRouter();
  const fetchDash = useServerFn(getDashboard);
  const fetchMotivation = useServerFn(dailyMotivation);
  const toggleFn = useServerFn(toggleExerciseDone);

  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });
  const { data: motivation } = useQuery({ queryKey: ["motivation"], queryFn: () => fetchMotivation(), staleTime: 3600_000 });

  const toggle = useMutation({
    mutationFn: (v: { exerciseId: string; done: boolean }) => toggleFn({ data: v }),
    onSuccess: () => router.invalidate(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading your day…</div>;

  const completed = new Set(data.completedTodayIds);
  const goal = data.profile?.daily_goal ?? 5;
  const doneCount = completed.size;
  const pct = Math.min(100, Math.round((doneCount / Math.max(goal, 1)) * 100));

  const byTime = {
    morning: data.exercises.filter((e) => e.time_of_day === "morning"),
    afternoon: data.exercises.filter((e) => e.time_of_day === "afternoon"),
    evening: data.exercises.filter((e) => e.time_of_day === "evening"),
  };

  const firstName = (data.profile?.full_name ?? "").split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Good day,</p>
        <h1 className="text-4xl md:text-5xl">Hello, {firstName}</h1>
      </div>

      <Card className="rounded-3xl border-none bg-primary p-6 text-primary-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 size-5 shrink-0" />
          <div>
            <p className="text-sm opacity-80">Daily motivation</p>
            <p className="mt-1 text-lg">{motivation?.message ?? "Loading…"}</p>
          </div>
        </div>
      </Card>

      <Card className="rounded-3xl p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Today's goal</p>
            <p className="text-3xl font-semibold">{doneCount} / {goal} exercises</p>
          </div>
          <Link to="/progress"><Button variant="ghost">View progress <ArrowRight className="ml-1 size-4" /></Button></Link>
        </div>
        <Progress value={pct} className="mt-4 h-3" />
      </Card>

      {(["morning", "afternoon", "evening"] as const).map((slot) => {
        const meta = TIME_META[slot];
        const items = byTime[slot];
        if (items.length === 0) return null;
        return (
          <section key={slot}>
            <div className="mb-3 flex items-center gap-2">
              <meta.icon className="size-5 text-primary" />
              <h2 className="text-2xl">{meta.label}</h2>
            </div>
            <div className="grid gap-3">
              {items.map((ex) => {
                const done = completed.has(ex.id);
                return (
                  <Card key={ex.id} className={`flex items-center gap-4 rounded-2xl p-4 transition ${done ? "bg-secondary" : ""}`}>
                    <Checkbox
                      checked={done}
                      onCheckedChange={(v) => toggle.mutate({ exerciseId: ex.id, done: !!v })}
                      className="size-6"
                    />
                    <Link to="/exercises/$id" params={{ id: ex.id }} className="min-w-0 flex-1">
                      <p className={`text-lg ${done ? "line-through text-muted-foreground" : ""}`}>{ex.title}</p>
                      <p className="text-sm text-muted-foreground">{ex.category} · {ex.duration_min} min · {ex.difficulty}</p>
                    </Link>
                    <ArrowRight className="size-5 text-muted-foreground" />
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
