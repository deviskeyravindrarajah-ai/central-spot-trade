import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, PlusCircle, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/explore", label: "Explore", icon: Search, exact: false },
  { to: "/post", label: "Post Ad", icon: PlusCircle, exact: false },
  { to: "/account", label: "Account", icon: User, exact: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">{children}</main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-float)]"
      >
        <ul className="grid grid-cols-4">
          {TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "fill-primary/10")} aria-hidden />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
