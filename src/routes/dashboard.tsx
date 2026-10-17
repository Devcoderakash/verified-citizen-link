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
  const avgRisk = total
    ? Math.round(rows.reduce((s, r) => s + Number(r.risk_score), 0) / total)
    : 0;
  const clearanceRate = total ? Math.round((verified / total) * 100) : 0;
  const flagRate = total ? Math.round((flagged / total) * 100) : 0;

  return (
    <AppShell
      title={`Verification Operations Dashboard`}
      description={`Session active for Officer ${session?.name ?? "Authorized Staff"} (${session?.staffId ?? "GV-1042"})`}
      actions={
        <Link
          to="/verify"
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          <ScanLine className="size-4" />
          <span>New Verification</span>
        </Link>
      }
    >
      {/* Workstation Status Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          <span className="font-semibold text-foreground">Reference Registry Active</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            150 Synthetic Citizen Records (600 Multi-Document Entries)
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono">Tesseract Neural OCR Engine v7.0</span>
          <span>•</span>
          <span className="font-semibold text-foreground">Air-Gapped Mode</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Inspections"
          value={total}
          icon={Activity}
          hint="All recorded document checks"
        />
        <StatCard
          label="Clearance Rate"
          value={`${clearanceRate}%`}
          icon={CheckCircle2}
          tone="success"
          hint={`${verified} verified consistent`}
        />
        <StatCard
          label="Flagged for Audit"
          value={`${flagRate}%`}
          icon={AlertTriangle}
          tone="warning"
          hint={`${flagged} cases requiring manual review`}
        />
        <StatCard
          label="Average Risk Index"
          value={avgRisk}
          icon={ShieldAlert}
          tone={avgRisk > 50 ? "danger" : avgRisk > 25 ? "warning" : "success"}
          hint="Automated weighted scoring"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Recent Verification Records"
          description="Latest credential inspections processed in this workstation"
          icon={FileSearch}
          bodyClassName="p-0"
          actions={
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
            >
              <span>View All Records ({total})</span>
              <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No Verifications Recorded Yet"
              description="Upload a government ID or choose a demonstration scenario to execute the verification pipeline."
              action={
                <Link
                  to="/verify"
                  className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <ScanLine className="size-4" /> Start First Verification
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.slice(0, 6).map((r) => (
                <li key={r.verification_id}>
                  <Link
                    to="/result/$verificationId"
                    params={{ verificationId: r.verification_id }}
                    className="flex flex-wrap items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/60 text-xs font-semibold text-muted-foreground">
                      {r.citizen_name ? r.citizen_name.slice(0, 2).toUpperCase() : "ID"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {r.citizen_name ?? "Unknown Citizen"}
                        </p>
                        <span className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {DOCUMENT_SHORT[r.document_type]}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        Ref: {r.verification_id} · {formatDateTime(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <RiskBadge level={r.risk_level} score={Number(r.risk_score)} />
                      <StatusBadge status={r.verification_status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Operational Workflows" icon={ScanLine}>
            <div className="space-y-2.5">
              <Link
                to="/verify"
                className="group flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm font-medium transition-all hover:border-primary/40 hover:bg-secondary/40"
              >
                <div>
                  <p className="font-semibold text-foreground">Inspect Document</p>
                  <p className="text-xs text-muted-foreground">Run OCR &amp; database match</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
              <Link
                to="/history"
                className="group flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm font-medium transition-all hover:border-primary/40 hover:bg-secondary/40"
              >
                <div>
                  <p className="font-semibold text-foreground">Search Archive</p>
                  <p className="text-xs text-muted-foreground">Filter by citizen name or ref</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
              <Link
                to="/reports"
                className="group flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm font-medium transition-all hover:border-primary/40 hover:bg-secondary/40"
              >
                <div>
                  <p className="font-semibold text-foreground">Audit Analytics</p>
                  <p className="text-xs text-muted-foreground">Inspect discrepancy patterns</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </div>
          </Panel>

          <Panel title="Prototype Boundaries" icon={ShieldAlert}>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  Operating on 150 synthetic citizen profiles generated for demonstration.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>Client-side OCR processing with zero external data transmission.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>
                  Facial biometric recognition and physical hologram inspection are not active in
                  this prototype.
                </span>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
