import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, addMedication, deleteMedication, toggleMedTaken } from "@/lib/patient.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/medications")({
  head: () => ({ meta: [{ title: "Medications · Stroke Care" }] }),
  component: Meds,
});

function Meds() {
  const router = useRouter();
  const fetchDash = useServerFn(getDashboard);
  const addFn = useServerFn(addMedication);
  const delFn = useServerFn(deleteMedication);
  const toggleFn = useServerFn(toggleMedTaken);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("08:00");

  const addM = useMutation({
    mutationFn: () => addFn({ data: { name, dosage, reminder_time: time } }),
    onSuccess: () => { setName(""); setDosage(""); setTime("08:00"); router.invalidate(); toast.success("Medication added"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const delM = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => router.invalidate(),
  });
  const toggle = useMutation({
    mutationFn: (v: { medicationId: string; taken: boolean }) => toggleFn({ data: v }),
    onSuccess: () => router.invalidate(),
  });

  const taken = new Set(data?.medsTakenTodayIds ?? []);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Medications</h1>

      <Card className="rounded-3xl p-6">
        <h2 className="text-xl">Add a medication</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) addM.mutate(); }}
        >
          <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-1"><Label>Dosage</Label><Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 10 mg" /></div>
          <div className="space-y-1"><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <Button type="submit" className="h-12 md:mt-6" disabled={addM.isPending}><Plus className="mr-1 size-4" /> Add</Button>
        </form>
      </Card>

      <div className="grid gap-3">
        {(data?.medications ?? []).map((m) => {
          const isTaken = taken.has(m.id);
          return (
            <Card key={m.id} className={`flex items-center gap-4 rounded-2xl p-4 ${isTaken ? "bg-secondary" : ""}`}>
              <Checkbox className="size-6" checked={isTaken} onCheckedChange={(v) => toggle.mutate({ medicationId: m.id, taken: !!v })} />
              <div className="min-w-0 flex-1">
                <p className={`text-lg ${isTaken ? "text-muted-foreground line-through" : ""}`}>{m.name} {m.dosage && <span className="text-muted-foreground">· {m.dosage}</span>}</p>
                <p className="text-sm text-muted-foreground">Reminder at {m.reminder_time?.slice(0, 5)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => delM.mutate(m.id)}><Trash2 className="size-4" /></Button>
            </Card>
          );
        })}
        {(!data?.medications || data.medications.length === 0) && (
          <p className="text-muted-foreground">No medications yet. Add one above to receive daily reminders.</p>
        )}
      </div>
    </div>
  );
}
