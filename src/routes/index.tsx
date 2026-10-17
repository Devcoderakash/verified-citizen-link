import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Info, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_CREDENTIALS, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GovVerify — Staff Sign In | Identity Verification Portal" },
      {
        name: "description",
        content:
          "Secure staff sign-in for GovVerify, a prototype government identity verification and risk assessment workspace running on synthetic demonstration data.",
      },
      { property: "og:title", content: "GovVerify — Staff Sign In" },
      {
        property: "og:description",
        content:
          "Prototype government identity verification and risk assessment portal for authorised verification officers.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session) void navigate({ to: "/dashboard", replace: true });
  }, [ready, session, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    window.setTimeout(() => {
      const result = signIn(staffId, password);
      setBusy(false);
      if (!result.ok) setError(result.error ?? "Sign in failed.");
      else void navigate({ to: "/dashboard", replace: true });
    }, 450);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      {/* Official Government Branding Column */}
      <div className="relative hidden flex-col justify-between bg-sidebar px-10 py-12 text-sidebar-foreground lg:col-span-5 lg:flex xl:px-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-sidebar-primary/20 ring-1 ring-sidebar-border">
              <ShieldCheck className="size-6 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                GovVerify
              </p>
              <p className="text-xs font-medium text-sidebar-foreground/70">
                Government Identity Verification System
              </p>
            </div>
          </div>

          <div className="mt-12">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-3 py-1 text-xs font-medium text-sidebar-primary">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span>Civil Registry Workstation · v2.4</span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-sidebar-foreground xl:text-3xl">
              Verification &amp; Risk Assessment System
            </h2>
            <p className="mt-3 text-sm text-sidebar-foreground/75 leading-relaxed">
              Automated in-browser OCR, reference record reconciliation, and cross-document
              correlation for government-issued citizen credentials.
            </p>

            <div className="mt-8 space-y-3.5 border-t border-sidebar-border/70 pt-6 text-sm text-sidebar-foreground/80">
              {[
                {
                  title: "Multi-Document OCR",
                  desc: "Aadhaar, PAN, Voter ID and Driving Licence extraction",
                },
                {
                  title: "Synthetic Reference Reconciliation",
                  desc: "150 pre-indexed citizen identities with 600 document records",
                },
                {
                  title: "Cross-Document Matrix",
                  desc: "Multi-credential consistency check across linked records",
                },
                {
                  title: "Transparent Risk Engine",
                  desc: "Weighted signal scoring with auditable discrepancy logs",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-1 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary">
                    <span className="size-1.5 rounded-full bg-sidebar-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-sidebar-foreground">{item.title}</p>
                    <p className="text-xs text-sidebar-foreground/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-sidebar-border/70 bg-sidebar-accent/30 p-3.5 text-xs text-sidebar-foreground/60">
          <p className="font-semibold text-sidebar-foreground/80">Prototype Demonstration Notice</p>
          <p className="mt-1 text-[11px] leading-relaxed">
            Operates exclusively on synthetic demonstration data. Not connected to UIDAI, the Income
            Tax Department, the Election Commission, Parivahan or live government APIs.
          </p>
        </div>
      </div>

      {/* Officer Sign In Column */}
      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-12 lg:col-span-7">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-border">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold tracking-tight text-foreground">GovVerify</p>
              <p className="text-xs text-muted-foreground">Verification Portal Prototype</p>
            </div>
          </div>

          <div className="border-b border-border pb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Officer Access Portal
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your authorized verification officer credentials to access the workspace.
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="staffId"
                className="block text-xs font-semibold tracking-wide text-foreground uppercase"
              >
                Staff Officer ID
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="staffId"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. GV-1042"
                  autoComplete="username"
                  required
                  className="w-full rounded-md border border-input bg-card py-2.5 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wide text-foreground uppercase"
              >
                Secure Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-md border border-input bg-card py-2.5 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            {error ? (
              <p className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger">
                <AlertCircle className="size-4 shrink-0" /> {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              <span>Sign In to Workstation</span>
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Info className="size-3.5 text-primary" /> Evaluation Credentials
              </span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Synthetic Officer
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono text-xs text-muted-foreground">
              <div className="rounded border border-border/80 bg-secondary/50 px-2.5 py-1.5">
                <span className="block text-[10px] font-sans text-muted-foreground/80 uppercase">
                  ID
                </span>
                <span className="text-foreground font-semibold">{DEMO_CREDENTIALS.staffId}</span>
              </div>
              <div className="rounded border border-border/80 bg-secondary/50 px-2.5 py-1.5">
                <span className="block text-[10px] font-sans text-muted-foreground/80 uppercase">
                  Pass
                </span>
                <span className="text-foreground font-semibold">{DEMO_CREDENTIALS.password}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStaffId(DEMO_CREDENTIALS.staffId);
                setPassword(DEMO_CREDENTIALS.password);
              }}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <span>Auto-fill Demo Credentials</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Official civil identity verification workstation · All sessions logged locally
          </p>
        </div>
      </div>
    </div>
  );
}
