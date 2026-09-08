import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/govverify/app-shell";
import { RiskBadge, StatusBadge } from "@/components/govverify/badges";
import { EmptyState, Panel, StatCard } from "@/components/govverify/panels";
import { listVerifications } from "@/lib/govverify/db";
import { formatDateTime } from "@/lib/govverify/format";
import { DOCUMENT_SHORT } from "@/lib/govverify/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Verification Dashboard | GovVerify" },
      {
        name: "description",
        content:
          "Live overview of identity verification activity: totals, verified documents, flagged cases and average risk score across the GovVerify prototype workspace.",
      },
      { property: "og:title", content: "Verification Dashboard | GovVerify" },
      {
        property: "og:description",
        content: "Overview of identity verification activity and risk outcomes.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["verifications"],
    queryFn: () => listVerifications(200),
  });

  const rows = data ?? [];
  const total = rows.length;
  const verified = rows.filter((r) => r.verification_status === "VERIFIED").length;
  const flagged = rows.filter(
    (r) => r.verification_status === "HIGH_RISK" || r.verification_status === "REVIEW_REQUIRED",
  ).length;
  const avgRisk = total ? Math.round(rows.reduce((s, r) => s + Number(r.risk_score), 0) / total) : 0;

  return (
    <AppShell
      title={`Welcome back, ${session?.name ?? "Officer"}`}
      description="Identity verification activity in this prototype workspace"
      actions={
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ScanLine className="size-4" /> New verification
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total verifications" value={total} icon={Activity} hint="All recorded checks" />
        <StatCard label="Verified" value={verified} icon={CheckCircle2} tone="success" hint="Consistent with records" />
        <StatCard label="Flagged for review" value={flagged} icon={AlertTriangle} tone="warning" hint="Manual review advised" />
        <StatCard
          label="Average risk score"
          value={avgRisk}
          icon={ShieldAlert}
          tone={avgRisk > 50 ? "danger" : avgRisk > 25 ? "warning" : "success"}
          hint="Weighted prototype heuristic"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Recent verifications"
          description="Latest checks performed in this workspace"
          icon={FileSearch}
          bodyClassName="p-0"
          actions={
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No verifications yet"
              description="Start your first identity check to populate the dashboard with results and risk outcomes."
              action={
                <Link
                  to="/verify"
                  className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <ScanLine className="size-4" /> Start verification
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.slice(0, 6).map((r) => (
                <li key={r.verification_id}>
                  <Link
                    to="/result/$verificationId"
                    params={{ verificationId: r.verification_id }}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.citizen_name ?? "Unknown holder"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {DOCUMENT_SHORT[r.document_type]} · {r.verification_id} ·{" "}
                        {formatDateTime(r.created_at)}
                      </p>
                    </div>
                    <RiskBadge level={r.risk_level} score={Number(r.risk_score)} />
                    <StatusBadge status={r.verification_status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Quick actions" icon={ScanLine}>
            <div className="space-y-2">
              <Link
                to="/verify"
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-info-soft"
              >
                Verify a document <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
              <Link
                to="/history"
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-info-soft"
              >
                Search verification history <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
              <Link
                to="/reports"
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-info-soft"
              >
                Review analytics <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            </div>
          </Panel>

          <Panel title="Prototype scope" icon={ShieldAlert}>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>• Reference data is synthetic and stored in this project only.</li>
              <li>• No live government API or database is contacted.</li>
              <li>• Face verification and tamper detection are not implemented.</li>
              <li>• Risk scores are a transparent heuristic, not an official judgement.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
