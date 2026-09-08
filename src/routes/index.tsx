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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar px-12 py-14 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary/15 ring-1 ring-sidebar-border">
            <ShieldCheck className="size-6 text-sidebar-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">GovVerify</p>
            <p className="text-xs text-sidebar-foreground/60">
              Government Identity Verification &amp; Risk Assessment
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Verify citizen identity documents with a clear, auditable workflow.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-sidebar-foreground/75">
            {[
              "Aadhaar, PAN, Voter ID and Driving Licence support",
              "Field-by-field comparison against reference records",
              "Cross-document consistency checks for the same citizen",
              "Transparent, weighted risk scoring with stated reasons",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sidebar-primary" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-md text-xs text-sidebar-foreground/50">
          Prototype system operating entirely on synthetic demonstration data. Not connected to UIDAI,
          the Income Tax Department, the Election Commission, Parivahan or any live government database.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-info-soft">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">GovVerify</p>
              <p className="text-xs text-muted-foreground">Verification Portal</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Officer sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Authorised verification staff only. All activity in this prototype is logged.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="staffId" className="text-sm font-medium">
                Staff ID
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="staffId"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="GV-1042"
                  autoComplete="username"
                  className="w-full rounded-lg border border-input bg-card py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-input bg-card py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            {error ? (
              <p className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                <AlertCircle className="size-4 shrink-0" /> {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Sign in securely
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-border bg-secondary/50 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-medium">
              <Info className="size-3.5 text-primary" /> Demonstration credentials
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {DEMO_CREDENTIALS.staffId} / {DEMO_CREDENTIALS.password}
            </p>
            <button
              type="button"
              onClick={() => {
                setStaffId(DEMO_CREDENTIALS.staffId);
                setPassword(DEMO_CREDENTIALS.password);
              }}
              className="mt-2 text-xs font-medium text-primary underline underline-offset-2"
            >
              Fill demo credentials
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            Prototype on synthetic data — not connected to any government database.
          </p>
        </div>
      </div>
    </div>
  );
}
