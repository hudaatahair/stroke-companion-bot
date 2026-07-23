import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM_PROMPT = `You are Stroke Care, an intelligent rehabilitation assistant for stroke patients.

Responsibilities:
- Encourage patients positively.
- Explain rehabilitation exercises using very simple language.
- Suggest safe modifications for elderly patients.
- Never diagnose diseases.
- Never prescribe medication.
- Recommend contacting a healthcare professional whenever symptoms appear severe.
- Provide short, supportive, and practical advice.
- Personalize advice based on the patient's recovery stage and completed exercises.
- Motivate patients who miss rehabilitation sessions.
- Keep responses under 150 words unless the user requests more detail.`;

export const getChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages").select("id, role, content, created_at")
      .eq("user_id", context.userId).order("created_at", { ascending: true }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI not configured");

    // Fetch profile + last messages + today's progress for personalization
    const today = new Date().toISOString().slice(0, 10);
    const [profileRes, historyRes, progressRes, exercisesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("chat_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: true }).limit(20),
      supabase.from("progress").select("exercise_id").eq("user_id", userId).eq("date", today),
      supabase.from("exercises").select("id"),
    ]);

    const profile = profileRes.data;
    const completed = progressRes.data?.length ?? 0;
    const total = exercisesRes.data?.length ?? 0;

    const contextBlock = profile
      ? `Patient context — Age: ${profile.age ?? "unknown"}; Recovery stage: ${profile.recovery_stage}; Affected side: ${profile.affected_side}; Mobility: ${profile.mobility_level}; Completed exercises today: ${completed} of ${total}.`
      : `Patient context — new patient, profile not set.`;

    const messages = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
      ...(historyRes.data ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    // Save user message first
    await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: data.message });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({ model: "google/gemini-3.6-flash", messages }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("The AI coach is busy right now. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits to continue.");
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content?.trim() ?? "I'm here to help. Could you tell me a bit more?";

    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: reply });

    return { reply };
  });

export const dailyMotivation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { message: "Welcome back. Let's take today one gentle step at a time." };

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const [profileRes, yProg] = await Promise.all([
      supabase.from("profiles").select("full_name, recovery_stage, affected_side").eq("id", userId).maybeSingle(),
      supabase.from("progress").select("exercise_id").eq("user_id", userId).eq("date", yesterday),
    ]);

    const profile = profileRes.data;
    const yCount = yProg.data?.length ?? 0;

    const prompt = `Write a short (max 2 sentences) warm morning motivational message for a stroke patient.
Name: ${profile?.full_name || "friend"}. Recovery stage: ${profile?.recovery_stage || "early"}. Affected side: ${profile?.affected_side || "left"}. Yesterday they completed ${yCount} exercise(s). Be encouraging, personal, and specific. No emojis.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error("ai");
      const json = await res.json() as { choices?: { message?: { content?: string } }[] };
      return { message: json.choices?.[0]?.message?.content?.trim() ?? "Welcome back. Small steps add up." };
    } catch {
      return { message: "Welcome back. Small steps add up — let's begin gently today." };
    }
  });
