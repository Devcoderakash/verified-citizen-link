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
        content: "Search past identity verifications by name, reference, document type and outcome.",
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

  return (
    <AppShell
      title="Verification history"
      description="All identity checks recorded in this workspace"
      actions={
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ScanLine className="size-4" /> New verification
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
              placeholder="Search by citizen name, reference number or person ID"
              className="w-full rounded-lg border border-input bg-card py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType | "ALL")}
            className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            {TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "All document types" : DOCUMENT_SHORT[t]}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as VerificationStatus | "ALL")}
            className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All outcomes" : s.toLowerCase().replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <Panel className="mt-6" bodyClassName="p-0">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No matching verifications"
            description="Adjust the filters above, or run a new identity verification to add records."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3 font-medium">Citizen</th>
                  <th className="px-5 py-3 font-medium">Document</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.verification_id}
                    className={cn("border-b border-border/60 last:border-0", i % 2 ? "bg-secondary/25" : "")}
                  >
                    <td className="px-5 py-3 font-medium">
                      <Link
                        to="/result/$verificationId"
                        params={{ verificationId: r.verification_id }}
                        className="hover:text-primary hover:underline"
                      >
                        {r.citizen_name ?? "Unknown holder"}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {DOCUMENT_SHORT[r.document_type]}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {r.verification_id}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(r.created_at)}</td>
                    <td className="px-5 py-3">
                      <RiskBadge level={r.risk_level} score={Number(r.risk_score)} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.verification_status} />
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
