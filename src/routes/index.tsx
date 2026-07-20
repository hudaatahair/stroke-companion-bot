import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Activity, Brain, HeartPulse, Pill, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </div>
          <span className="text-lg font-semibold">Stroke Care</span>
        </div>
        <Link to="/auth"><Button size="lg">Sign in</Button></Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 md:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            <Sparkles className="size-4" /> AI-powered rehabilitation
          </span>
          <h1 className="mt-6 text-5xl leading-tight md:text-7xl">
            A gentle, intelligent companion for stroke recovery.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Stroke Care guides survivors through daily exercises, tracks
            progress, remembers medications, and offers supportive coaching
            whenever you need it — day or night.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth"><Button size="lg" className="h-12 px-6 text-base">Start your recovery plan</Button></Link>
            <a href="#features"><Button size="lg" variant="secondary" className="h-12 px-6 text-base">Learn more</Button></a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-4">
        {[
          { icon: Activity, title: "Daily plan", body: "Morning, afternoon and evening exercises tailored to your stage." },
          { icon: Brain, title: "AI coach", body: "Ask anything about your recovery and get calm, practical guidance." },
          { icon: HeartPulse, title: "Progress", body: "See streaks, weekly minutes, and improvements over time." },
          { icon: Pill, title: "Medications", body: "Simple reminders so nothing gets forgotten." },
        ].map((f) => (
          <div key={f.title} className="rounded-3xl border bg-card p-6">
            <div className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-2xl">{f.title}</h3>
            <p className="mt-2 text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          Stroke Care is a supportive companion and does not replace medical care.
        </div>
      </footer>
    </div>
  );
}
