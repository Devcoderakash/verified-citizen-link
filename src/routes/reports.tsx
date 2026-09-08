import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, FileBarChart2, PieChart, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/govverify/app-shell";
import { EmptyState, Panel, StatCard } from "@/components/govverify/panels";
import { listVerifications } from "@/lib/govverify/db";
import { RISK_LABEL, STATUS_LABEL } from "@/lib/govverify/format";
import {
  DOCUMENT_SHORT,
  type DocumentType,
  type RiskLevel,
  type VerificationStatus,
} from "@/lib/govverify/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Verification Analytics & Reports | GovVerify" },
      {
        name: "description",
        content:
          "Aggregated analytics for the GovVerify prototype: verification outcomes, risk-level distribution, document-type mix and the most common risk signals.",
      },
      { property: "og:title", content: "Verification Analytics & Reports | GovVerify" },
      {
        property: "og:description",
        content: "Outcome, risk-level and document-type analytics across recorded verifications.",
      },
    ],
  }),
  component: ReportsPage,
});

const DOC_TYPES: DocumentType[] = ["AADHAAR", "PAN", "VOTER_ID", "DRIVING_LICENCE"];
const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES: VerificationStatus[] = ["VERIFIED", "REVIEW_REQUIRED", "HIGH_RISK", "NO_RECORD"];

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="capitalize">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-700", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["verifications"],
    queryFn: () => listVerifications(200),
  });
  const rows = data ?? [];
  const total = rows.length;

  const reasonCounts = new Map<string, number>();
  for (const r of rows) {
    for (const reason of r.risk_reasons ?? []) {
      reasonCounts.set(reason.label, (reasonCounts.get(reason.label) ?? 0) + 1);
    }
  }
  const topReasons = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const flagged = rows.filter((r) => r.verification_status !== "VERIFIED").length;
  const avgRisk = total ? Math.round(rows.reduce((s, r) => s + Number(r.risk_score), 0) / total) : 0;

  return (
    <AppShell title="Reports & analytics" description="Aggregated outcomes across recorded verifications">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : total === 0 ? (
        <Panel>
          <EmptyState
            icon={FileBarChart2}
            title="No data to report yet"
            description="Analytics appear once verifications have been recorded in this workspace."
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Verifications analysed" value={total} icon={FileBarChart2} />
            <StatCard
              label="Flagged outcomes"
              value={flagged}
              icon={TrendingUp}
              tone={flagged ? "warning" : "success"}
              hint="Anything other than verified"
            />
            <StatCard
              label="Average risk score"
              value={avgRisk}
              icon={BarChart3}
              tone={avgRisk > 50 ? "danger" : avgRisk > 25 ? "warning" : "success"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Outcome distribution" icon={PieChart}>
              <div className="space-y-4">
                {STATUSES.map((s) => (
                  <Bar
                    key={s}
                    label={STATUS_LABEL[s]}
                    value={rows.filter((r) => r.verification_status === s).length}
                    total={total}
                    tone={
                      s === "VERIFIED"
                        ? "bg-success"
                        : s === "HIGH_RISK"
                          ? "bg-danger"
                          : s === "REVIEW_REQUIRED"
                            ? "bg-warning"
                            : "bg-muted-foreground"
                    }
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Risk level distribution" icon={BarChart3}>
              <div className="space-y-4">
                {RISK_LEVELS.map((l) => (
                  <Bar
                    key={l}
                    label={RISK_LABEL[l]}
                    value={rows.filter((r) => r.risk_level === l).length}
                    total={total}
                    tone={
                      l === "LOW"
                        ? "bg-success"
                        : l === "MEDIUM"
                          ? "bg-warning"
                          : "bg-danger"
                    }
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Document types verified" icon={FileBarChart2}>
              <div className="space-y-4">
                {DOC_TYPES.map((t) => (
                  <Bar
                    key={t}
                    label={DOCUMENT_SHORT[t]}
                    value={rows.filter((r) => r.document_type === t).length}
                    total={total}
                    tone="bg-primary"
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Most common risk signals" icon={TrendingUp}>
              {topReasons.length ? (
                <ul className="space-y-2">
                  {topReasons.map(([label, count]) => (
                    <li
                      key={label}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm"
                    >
                      <span>{label}</span>
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No risk signals have been raised in the recorded verifications.
                </p>
              )}
            </Panel>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            All figures derive from synthetic prototype activity and carry no official significance.
          </p>
        </div>
      )}
    </AppShell>
  );
}
