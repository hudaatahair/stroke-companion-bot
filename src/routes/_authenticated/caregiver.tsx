import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/patient.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Pill } from "lucide-react";

export const Route = createFileRoute("/_authenticated/caregiver")({
  head: () => ({ meta: [{ title: "Caregiver · Stroke Care" }] }),
  component: Caregiver,
});

function Caregiver() {
  const fetchDash = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });
  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  const done = new Set(data.completedTodayIds);
  const meds = new Set(data.medsTakenTodayIds);
  const missedEx = data.exercises.filter((e) => !done.has(e.id));
  const missedMeds = data.medications.filter((m) => !meds.has(m.id));

  const exMap = new Map(data.exercises.map((e) => [e.id, e]));
  const dailyCounts = new Map<string, number>();
  data.weekProgress.forEach((p) => dailyCounts.set(p.date, (dailyCounts.get(p.date) ?? 0) + 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl">Caregiver view</h1>
        <p className="text-muted-foreground">Patient: {data.profile?.full_name || "—"}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Completed today" value={`${done.size} / ${data.exercises.length}`} tone="success" />
        <StatCard label="Missed today" value={missedEx.length.toString()} tone={missedEx.length > 0 ? "warn" : "success"} />
        <StatCard label="Meds pending" value={missedMeds.length.toString()} tone={missedMeds.length > 0 ? "warn" : "success"} />
      </div>

      <Card className="rounded-3xl p-6">
        <h2 className="text-2xl">Today's exercises</h2>
        <div className="mt-3 space-y-2">
          {data.exercises.map((ex) => {
            const ok = done.has(ex.id);
            return (
              <div key={ex.id} className="flex items-center gap-3">
                {ok ? <CheckCircle2 className="size-5 text-[color:var(--color-success)]" /> : <AlertCircle className="size-5 text-muted-foreground" />}
                <span className={ok ? "line-through text-muted-foreground" : ""}>{ex.title}</span>
                <Badge variant="secondary" className="ml-auto capitalize">{ex.time_of_day}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-3xl p-6">
        <h2 className="flex items-center gap-2 text-2xl"><Pill className="size-5" /> Medication status</h2>
        <div className="mt-3 space-y-2">
          {data.medications.length === 0 && <p className="text-muted-foreground">No medications configured.</p>}
          {data.medications.map((m) => {
            const ok = meds.has(m.id);
            return (
              <div key={m.id} className="flex items-center gap-3">
                {ok ? <CheckCircle2 className="size-5 text-[color:var(--color-success)]" /> : <AlertCircle className="size-5 text-muted-foreground" />}
                <span className={ok ? "line-through text-muted-foreground" : ""}>{m.name} {m.dosage && `· ${m.dosage}`}</span>
                <span className="ml-auto text-sm text-muted-foreground">{m.reminder_time?.slice(0, 5)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-3xl p-6">
        <h2 className="text-2xl">Weekly summary</h2>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(Date.now() - (6 - i) * 86400000);
            const iso = d.toISOString().slice(0, 10);
            const c = dailyCounts.get(iso) ?? 0;
            const mins = data.weekProgress.filter((p) => p.date === iso)
              .reduce((s, p) => s + (exMap.get(p.exercise_id)?.duration_min ?? 0), 0);
            return (
              <div key={iso} className="rounded-2xl bg-secondary p-3 text-center">
                <p className="text-xs text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</p>
                <p className="mt-1 text-2xl font-semibold">{c}</p>
                <p className="text-xs text-muted-foreground">{mins} min</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "success" | "warn" }) {
  return (
    <Card className="rounded-3xl p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 text-4xl font-semibold ${tone === "warn" ? "text-[color:var(--color-destructive)]" : "text-[color:var(--color-success)]"}`}>{value}</p>
    </Card>
  );
}
