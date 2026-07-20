import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/patient.functions";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress · StrokeCare AI" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const fetchDash = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });

  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  const exMap = new Map(data.exercises.map((e) => [e.id, e]));
  const days: { day: string; label: string; count: number; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const items = data.weekProgress.filter((p) => p.date === iso);
    const minutes = items.reduce((sum, p) => sum + (exMap.get(p.exercise_id)?.duration_min ?? 0), 0);
    days.push({
      day: iso,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: items.length,
      minutes,
    });
  }
  const weekTotal = days.reduce((s, d) => s + d.count, 0);
  const weekMin = days.reduce((s, d) => s + d.minutes, 0);
  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) s++; else break;
    }
    return s;
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Your progress</h1>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Exercises this week" value={weekTotal.toString()} />
        <Stat label="Minutes this week" value={weekMin.toString()} />
        <Stat label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
      </div>

      <Card className="rounded-3xl p-6">
        <h2 className="text-2xl">Last 7 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-3xl p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-semibold">{value}</p>
    </Card>
  );
}
