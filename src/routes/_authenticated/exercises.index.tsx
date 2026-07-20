import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/patient.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/exercises/")({
  head: () => ({ meta: [{ title: "Exercise library · Stroke Care" }] }),
  component: Library,
});

const CATS = ["all", "arm", "hand", "leg", "balance", "speech"] as const;

function Library() {
  const fetchDash = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");

  const items = (data?.exercises ?? []).filter((e) => cat === "all" || e.category === cat);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Exercise library</h1>
      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <Button key={c} size="sm" variant={cat === c ? "default" : "secondary"} onClick={() => setCat(c)} className="capitalize">
            {c}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((ex) => (
          <Link key={ex.id} to="/exercises/$id" params={{ id: ex.id }}>
            <Card className="h-full rounded-2xl p-5 transition hover:border-primary">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl">{ex.title}</h3>
                <Badge variant="secondary" className="capitalize">{ex.difficulty}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground capitalize">{ex.category} · {ex.duration_min} min · {ex.time_of_day}</p>
              <p className="mt-3 text-sm">{ex.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
