import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  FileBarChart2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/govverify/format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/verify", label: "New Verification", icon: ScanLine },
  { to: "/history", label: "Verification History", icon: History },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
  { to: "/system", label: "System", icon: Settings2 },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { session, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !session) void navigate({ to: "/", replace: true });
  }, [ready, session, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading secure workspace…
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border/70 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/20 ring-1 ring-sidebar-border">
            <ShieldCheck className="size-5 text-sidebar-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">GovVerify</p>
            <p className="text-[11px] font-medium text-sidebar-foreground/70">
              Identity Verification Portal
            </p>
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-1.5 rounded-md bg-sidebar-accent/50 px-2.5 py-1 text-[11px] font-medium text-sidebar-foreground/80">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>Local Prototype • Synthetic DB</span>
        </div>
      </div>

      <div className="px-3 pt-3 pb-1">
        <p className="px-3 text-[10px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
          Navigation
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-1">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-xs ring-1 ring-sidebar-border/80"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                )}
              />
              <span className="truncate">{item.label}</span>
              {active ? (
                <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border/80 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold ring-1 ring-sidebar-border">
            {initials(session.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold">{session.name}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/70">
              {session.role} · {session.staffId}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            void navigate({ to: "/", replace: true });
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-sidebar-border/60 bg-transparent px-3 py-2 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-3.5" />
          Sign out session
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
          <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-md border border-border bg-background p-2 transition-colors hover:bg-secondary lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {title}
              </h1>
              {description ? (
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground sm:flex">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-foreground/80">Registry Online</span>
              </div>
              {actions}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-border/80 bg-card/40 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          GovVerify Prototype · Government Identity Verification &amp; Risk Assessment System ·
          Running on synthetic reference datasets
        </footer>
      </div>
    </div>
  );
}
