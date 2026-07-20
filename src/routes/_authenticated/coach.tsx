import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getChatHistory, sendChatMessage } from "@/lib/coach.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "AI Coach · StrokeCare AI" }] }),
  component: Coach,
});

const SUGGESTIONS = [
  "My hand feels weak today.",
  "I missed yesterday's exercises.",
  "How do I make arm exercises easier?",
  "I'm feeling discouraged.",
];

function Coach() {
  const qc = useQueryClient();
  const historyFn = useServerFn(getChatHistory);
  const sendFn = useServerFn(sendChatMessage);
  const { data: history } = useQuery({ queryKey: ["chat"], queryFn: () => historyFn() });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = useMutation({
    mutationFn: (message: string) => sendFn({ data: { message } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chat"] }); setInput(""); inputRef.current?.focus(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [history, send.isPending]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit(text: string) {
    const t = text.trim();
    if (!t || send.isPending) return;
    send.mutate(t);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col md:h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-4xl">AI Coach</h1>
        <p className="text-muted-foreground">Ask anything about your exercises, symptoms, or motivation.</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {(!history || history.length === 0) && (
          <Card className="rounded-3xl border-none bg-primary p-6 text-primary-foreground">
            <Sparkles className="mb-3 size-6" />
            <p className="text-lg">Hello. I'm your rehabilitation coach. I'm here whenever you need support or guidance — even at 3 a.m.</p>
          </Card>
        )}
        {history?.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "assistant" ? (
              <div className="max-w-[85%] whitespace-pre-line text-lg leading-relaxed">{m.content}</div>
            ) : (
              <div className="max-w-[85%] rounded-3xl rounded-br-md bg-primary px-5 py-3 text-primary-foreground">{m.content}</div>
            )}
          </div>
        ))}
        {send.isPending && <div className="text-muted-foreground italic">Coach is thinking…</div>}
      </div>

      {(!history || history.length === 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Button key={s} variant="secondary" size="sm" className="rounded-full" onClick={() => submit(s)}>{s}</Button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="mt-4 flex items-end gap-2 rounded-3xl border bg-card p-2">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
          placeholder="Ask your coach anything…"
          className="min-h-12 max-h-40 resize-none border-none bg-transparent text-base shadow-none focus-visible:ring-0"
          rows={1}
        />
        <Button type="submit" size="icon" className="size-12 shrink-0 rounded-2xl" disabled={send.isPending || !input.trim()}>
          <Send className="size-5" />
        </Button>
      </form>
    </div>
  );
}
