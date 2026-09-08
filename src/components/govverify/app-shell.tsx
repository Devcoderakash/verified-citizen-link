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
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/15 ring-1 ring-sidebar-border">
          <ShieldCheck className="size-5 text-sidebar-primary" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">GovVerify</p>
          <p className="text-[11px] text-sidebar-foreground/60">Verification Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">
            {initials(session.name)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{session.name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">{session.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            void navigate({ to: "/", replace: true });
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4.5" />
          Sign out
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
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-md border border-border p-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
              {description ? (
                <p className="truncate text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {actions}
              <div className="hidden items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 md:flex">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(session.name)}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{session.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {session.role} · {session.staffId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          GovVerify Prototype • Synthetic Data Environment • Not connected to government databases
        </footer>
      </div>
    </div>
  );
}
