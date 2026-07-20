import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const [profileRes, exercisesRes, progressTodayRes, progressWeekRes, medsRes, medLogsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("exercises").select("*").order("time_of_day"),
      supabase.from("progress").select("exercise_id").eq("user_id", userId).eq("date", today),
      supabase.from("progress").select("date, exercise_id").eq("user_id", userId).gte("date", weekAgo),
      supabase.from("medications").select("*").eq("user_id", userId).order("reminder_time"),
      supabase.from("medication_logs").select("medication_id").eq("user_id", userId).eq("date", today),
    ]);

    return {
      profile: profileRes.data,
      exercises: exercisesRes.data ?? [],
      completedTodayIds: (progressTodayRes.data ?? []).map((r) => r.exercise_id as string),
      weekProgress: progressWeekRes.data ?? [],
      medications: medsRes.data ?? [],
      medsTakenTodayIds: (medLogsRes.data ?? []).map((r) => r.medication_id as string),
    };
  });

export const toggleExerciseDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { exerciseId: string; done: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    if (data.done) {
      const { error } = await supabase.from("progress").upsert(
        { user_id: userId, exercise_id: data.exerciseId, date: today },
        { onConflict: "user_id,exercise_id,date" },
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("progress").delete()
        .eq("user_id", userId).eq("exercise_id", data.exerciseId).eq("date", today);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    full_name?: string; age?: number | null; recovery_stage?: string;
    affected_side?: string; mobility_level?: string; daily_goal?: number;
    view_mode?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addMedication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; dosage?: string; reminder_time: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("medications").insert({ ...data, user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMedication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("medications").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleMedTaken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { medicationId: string; taken: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    if (data.taken) {
      const { error } = await supabase.from("medication_logs").upsert(
        { user_id: userId, medication_id: data.medicationId, date: today },
        { onConflict: "medication_id,date" },
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("medication_logs").delete()
        .eq("user_id", userId).eq("medication_id", data.medicationId).eq("date", today);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
