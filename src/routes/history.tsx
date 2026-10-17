import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { History, ScanLine, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/govverify/app-shell";
import { RiskBadge, StatusBadge } from "@/components/govverify/badges";
import { EmptyState, Panel } from "@/components/govverify/panels";
import { listVerifications } from "@/lib/govverify/db";
import { formatDateTime } from "@/lib/govverify/format";
import { DOCUMENT_SHORT, type DocumentType, type VerificationStatus } from "@/lib/govverify/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Verification History | GovVerify" },
      {
        name: "description",
        content:
          "Search and filter every identity verification performed in the GovVerify prototype by citizen name, reference number, document type and outcome.",
      },
      { property: "og:title", content: "Verification History | GovVerify" },
      {
        property: "og:description",
        content:
          "Search past identity verifications by name, reference, document type and outcome.",
      },
    ],
  }),
  component: HistoryPage,
});

const TYPE_FILTERS: (DocumentType | "ALL")[] = [
  "ALL",
  "AADHAAR",
  "PAN",
  "VOTER_ID",
  "DRIVING_LICENCE",
];
const STATUS_FILTERS: (VerificationStatus | "ALL")[] = [
  "ALL",
  "VERIFIED",
  "REVIEW_REQUIRED",
  "HIGH_RISK",
  "NO_RECORD",
];

function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["verifications"],
    queryFn: () => listVerifications(200),
  });
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DocumentType | "ALL">("ALL");
  const [status, setStatus] = useState<VerificationStatus | "ALL">("ALL");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (type !== "ALL" && r.document_type !== type) return false;
      if (status !== "ALL" && r.verification_status !== status) return false;
      if (!q) return true;
      return (
        (r.citizen_name ?? "").toLowerCase().includes(q) ||
        r.verification_id.toLowerCase().includes(q) ||
        (r.person_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query, type, status]);

  const hasFilters = query || type !== "ALL" || status !== "ALL";

  return (
    <AppShell
      title="Verification Audit Archive"
      description="Inspect and search all recorded identity checks performed in this workspace"
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
      <Panel bodyClassName="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by citizen name, reference number or person ID…"
              className="w-full rounded-md border border-input bg-card py-2 pr-3 pl-9 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType | "ALL")}
              className="cursor-pointer rounded-md border border-input bg-card px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t} value={t}>
                  {t === "ALL" ? "All Document Types" : DOCUMENT_SHORT[t]}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VerificationStatus | "ALL")}
              className="cursor-pointer rounded-md border border-input bg-card px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All Statuses" : s.toLowerCase().replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setType("ALL");
                  setStatus("ALL");
                }}
                className="cursor-pointer rounded-md border border-border bg-secondary/80 px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
          <span>
            Displaying <strong className="font-semibold text-foreground">{rows.length}</strong> of{" "}
            <strong className="font-semibold text-foreground">{(data ?? []).length}</strong> total
            inspections
          </span>
          <span className="font-mono text-[11px]">Indexed in Local Cache</span>
        </div>
      </Panel>

      <Panel className="mt-6" bodyClassName="p-0">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Matching Verification Records"
            description="Adjust your search query or filter selections above, or execute a new verification."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-secondary/20 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  <th className="px-5 py-3.5">Citizen Identity</th>
                  <th className="px-5 py-3.5">Document Type</th>
                  <th className="px-5 py-3.5">Inspection Ref</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Risk Score</th>
                  <th className="px-5 py-3.5">Outcome</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r) => (
                  <tr
                    key={r.verification_id}
                    className="group transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-5 py-3 font-medium">
                      <Link
                        to="/result/$verificationId"
                        params={{ verificationId: r.verification_id }}
                        className="flex items-center gap-2.5 font-semibold text-foreground group-hover:text-primary"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                          {r.citizen_name ? r.citizen_name.slice(0, 2).toUpperCase() : "ID"}
                        </div>
                        <span className="truncate">{r.citizen_name ?? "Unknown Citizen"}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <span className="rounded border border-border bg-secondary/60 px-2 py-0.5 text-xs font-mono">
                        {DOCUMENT_SHORT[r.document_type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {r.verification_id}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <RiskBadge level={r.risk_level} score={Number(r.risk_score)} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.verification_status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/result/$verificationId"
                        params={{ verificationId: r.verification_id }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        <span>Dossier</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
