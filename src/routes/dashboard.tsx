import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HeartPulse, LogOut, Activity, Brain, Pill, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  errorComponent: DashboardError,
});

function DashboardError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Dashboard failed to load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please sign in again to access your dashboard.
        </p>
        <div className="mt-6">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate({ to: "/auth" });
          return;
        }
        setUser(data.session.user);
      } catch (err) {
        console.error("Failed to load user:", err);
        toast.error("Failed to load your profile");
        navigate({ to: "/auth" });
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
      toast.success("Signed out successfully");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block animate-spin rounded-full border-4 border-primary border-r-transparent h-12 w-12"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <HeartPulse className="size-5" />
            </div>
            <span className="text-lg font-semibold">Stroke Care</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Welcome back!</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Continue your stroke recovery journey with personalized exercises and coaching.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Activity,
              title: "Today's Exercises",
              description: "3 sessions planned",
              color: "bg-blue-100 text-blue-700",
            },
            {
              icon: Brain,
              title: "AI Coach",
              description: "Ask for guidance",
              color: "bg-purple-100 text-purple-700",
            },
            {
              icon: Pill,
              title: "Medications",
              description: "2 reminders today",
              color: "bg-green-100 text-green-700",
            },
            {
              icon: TrendingUp,
              title: "Progress",
              description: "7-day streak",
              color: "bg-orange-100 text-orange-700",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                className="rounded-2xl border bg-card p-6 text-left transition-colors hover:bg-accent"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </button>
            );
          })}
        </div>

        {/* Quick Start Section */}
        <div className="mt-12 rounded-3xl border bg-card p-8">
          <h2 className="text-2xl font-bold">Get started</h2>
          <p className="mt-2 text-muted-foreground">
            Set up your profile and start tracking your recovery progress.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 px-6 text-base">
              Create your profile
            </Button>
            <Button size="lg" variant="secondary" className="h-12 px-6 text-base">
              Learn the basics
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
