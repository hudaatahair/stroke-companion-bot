import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, updateProfile } from "@/lib/patient.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · StrokeCare AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const fetchDash = useServerFn(getDashboard);
  const updateFn = useServerFn(updateProfile);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash() });

  const [form, setForm] = useState({
    full_name: "", age: "", recovery_stage: "early",
    affected_side: "left", mobility_level: "limited", daily_goal: 5,
  });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        full_name: data.profile.full_name ?? "",
        age: data.profile.age?.toString() ?? "",
        recovery_stage: data.profile.recovery_stage ?? "early",
        affected_side: data.profile.affected_side ?? "left",
        mobility_level: data.profile.mobility_level ?? "limited",
        daily_goal: data.profile.daily_goal ?? 5,
      });
    }
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: {
      full_name: form.full_name,
      age: form.age ? Number(form.age) : null,
      recovery_stage: form.recovery_stage,
      affected_side: form.affected_side,
      mobility_level: form.mobility_level,
      daily_goal: Number(form.daily_goal),
    } }),
    onSuccess: () => { router.invalidate(); toast.success("Profile saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Your profile</h1>
      <Card className="rounded-3xl p-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="Age"><Input type="number" min={1} max={120} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
          <Field label="Recovery stage">
            <Select value={form.recovery_stage} onValueChange={(v) => setForm({ ...form, recovery_stage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="early">Early (0–3 months)</SelectItem>
                <SelectItem value="intermediate">Intermediate (3–12 months)</SelectItem>
                <SelectItem value="advanced">Advanced (12+ months)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Affected side">
            <Select value={form.affected_side} onValueChange={(v) => setForm({ ...form, affected_side: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mobility level">
            <Select value={form.mobility_level} onValueChange={(v) => setForm({ ...form, mobility_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="good">Good</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Daily exercise goal">
            <Input type="number" min={1} max={20} value={form.daily_goal} onChange={(e) => setForm({ ...form, daily_goal: Number(e.target.value) })} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" size="lg" className="h-12" disabled={save.isPending}>Save profile</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
