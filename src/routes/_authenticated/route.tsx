import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HeartPulse, LayoutDashboard, Dumbbell, LineChart, Pill, MessageCircle, User, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Shell,
});

const NAV = [
  { to: "/dashboard", label: "Today", icon: LayoutDashboard },
  { to: "/exercises", label: "Exercises", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/coach", label: "AI Coach", icon: MessageCircle },
  { to: "/caregiver", label: "Caregiver", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function Shell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </div>
          <span className="text-lg font-semibold">Stroke Care</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-base transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}>
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Button variant="ghost" className="h-12 w-full justify-start gap-3 text-base" onClick={signOut}>
            <LogOut className="size-5" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="size-4" />
          </div>
          <span className="font-semibold">Stroke Care</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="size-4" /></Button>
      </div>

      <main className="min-w-0 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-sidebar md:hidden">
        {NAV.slice(0, 6).map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} className={cn(
              "flex flex-col items-center gap-1 py-2 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}>
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
