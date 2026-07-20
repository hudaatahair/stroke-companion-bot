import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, toggleExerciseDone } from "@/lib/patient.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exercises/$id")({
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const fetchDash = useServerFn(getDashboard);
  const toggleFn = useServerFn(toggleExerciseDone);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });

  const ex = data?.exercises.find((e) => e.id === id);
  const done = data?.completedTodayIds.includes(id) ?? false;

  const toggle = useMutation({
    mutationFn: (v: boolean) => toggleFn({ data: { exerciseId: id, done: v } }),
    onSuccess: () => { router.invalidate(); toast.success(done ? "Unmarked." : "Great job! Exercise completed."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!ex) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Link to="/exercises" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to library
      </Link>
      <div>
        <p className="text-sm capitalize text-muted-foreground">{ex.category} · {ex.time_of_day} · {ex.duration_min} min · {ex.difficulty}</p>
        <h1 className="mt-1 text-4xl">{ex.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{ex.description}</p>
      </div>

      <Card className="rounded-3xl p-6">
        <h2 className="text-2xl">How to do it</h2>
        <p className="mt-3 whitespace-pre-line text-lg leading-relaxed">{ex.instructions}</p>
      </Card>

      <Button
        size="lg"
        className="h-14 w-full text-base"
        variant={done ? "secondary" : "default"}
        onClick={() => toggle.mutate(!done)}
        disabled={toggle.isPending}
      >
        <CheckCircle2 className="mr-2 size-5" />
        {done ? "Completed — undo" : "Mark as completed"}
      </Button>
    </div>
  );
}
