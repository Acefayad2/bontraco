"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpDown, ChevronDown, Filter, LayoutGrid, List, X, Download, Check,
} from "lucide-react";
import { Button, Badge, Avatar, Meter } from "@/components/ui/primitives";
import { StatusBadge, RiskBadge } from "@/components/ui/status";
import { money, formatDate, daysUntil } from "@/lib/data";
import type { Contract } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "expiryDate" | "value" | "riskScore" | "title";

const statusFilters = [
  { key: "all", label: "All" },
  { key: "in_review", label: "In review" },
  { key: "awaiting_signature", label: "Awaiting signature" },
  { key: "executed", label: "Executed" },
  { key: "expiring", label: "Expiring" },
  { key: "expired", label: "Expired" },
  { key: "draft", label: "Draft" },
] as const;

const riskFilters = ["all", "high", "medium", "low"] as const;

function SortHead({
  k, children, className, active, dir, onSort,
}: {
  k: SortKey;
  children: React.ReactNode;
  className?: string;
  active: boolean;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-2.5 text-left font-medium", className)}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        onClick={() => onSort(k)}
        className="inline-flex cursor-pointer items-center gap-1 rounded transition-colors
          duration-200 hover:text-[var(--fg)]"
      >
        {children}
        <ArrowUpDown className={cn("size-3", active ? "text-[var(--accent)]" : "opacity-40")} />
      </button>
    </th>
  );
}

export function ContractsTable({ contracts }: { contracts: Contract[] }) {
  const [status, setStatus] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("riskScore");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<"table" | "cards">("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    let r = contracts.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (risk !== "all" && c.risk !== risk) return false;
      if (q && ![c.title, c.counterparty, c.ref, c.type, c.owner].join(" ")
        .toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      const m = dir === "asc" ? 1 : -1;
      if (sort === "title") return a.title.localeCompare(b.title) * m;
      if (sort === "expiryDate") return a.expiryDate.localeCompare(b.expiryDate) * m;
      return ((a[sort] as number) - (b[sort] as number)) * m;
    });
    return r;
  }, [contracts, status, risk, q, sort, dir]);

  function toggleSort(k: SortKey) {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setDir(k === "title" || k === "expiryDate" ? "asc" : "desc"); }
  }

  function toggleRow(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const activeFilters = (status !== "all" ? 1 : 0) + (risk !== "all" ? 1 : 0);

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-4 py-3 sm:px-6 lg:px-8">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by title, counterparty, owner…"
            aria-label="Filter contracts"
            className="h-9 w-full min-w-[240px] rounded-md border border-[var(--line)] bg-[var(--surface)]
              px-3 text-[13.5px] placeholder:text-[var(--fg-subtle)] transition-colors
              duration-200 focus:border-[var(--ring)] sm:w-[280px]"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1
                text-[var(--fg-subtle)] hover:text-[var(--fg)]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1.5 text-[12.5px] font-medium",
                "transition-colors duration-200",
                status === f.key
                  ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                  : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative md:hidden">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="h-9 cursor-pointer appearance-none rounded-md border border-[var(--line)]
              bg-[var(--surface)] pl-3 pr-8 text-[13px]"
          >
            {statusFilters.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5
            -translate-y-1/2 text-[var(--fg-subtle)]" />
        </div>

        <div className="relative">
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            aria-label="Filter by risk"
            className="h-9 cursor-pointer appearance-none rounded-md border border-[var(--line)]
              bg-[var(--surface)] pl-8 pr-8 text-[13px]"
          >
            {riskFilters.map((r) => (
              <option key={r} value={r}>{r === "all" ? "All risk" : `${r} risk`}</option>
            ))}
          </select>
          <Filter className="pointer-events-none absolute left-2.5 top-1/2 size-3.5
            -translate-y-1/2 text-[var(--fg-subtle)]" />
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5
            -translate-y-1/2 text-[var(--fg-subtle)]" />
        </div>

        {activeFilters > 0 && (
          <button
            onClick={() => { setStatus("all"); setRisk("all"); }}
            className="cursor-pointer text-[12.5px] font-medium text-[var(--accent)] hover:underline"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="tabular hidden text-[12.5px] text-[var(--fg-muted)] sm:inline">
            {rows.length} of {contracts.length}
          </span>
          <div className="flex overflow-hidden rounded-md border border-[var(--line)]">
            {([["table", List], ["cards", LayoutGrid]] as const).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={`${v} view`}
                aria-pressed={view === v}
                className={cn(
                  "inline-flex size-8 cursor-pointer items-center justify-center transition-colors duration-200",
                  view === v
                    ? "bg-[var(--surface-2)] text-[var(--fg)]"
                    : "text-[var(--fg-subtle)] hover:text-[var(--fg)]",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bulk bar ────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-[var(--line)] bg-brand-50 px-4
          py-2.5 sm:px-6 lg:px-8 dark:bg-brand-500/10">
          <span className="text-[13px] font-medium text-brand-900 dark:text-brand-100">
            {selected.size} selected
          </span>
          <Button size="sm" variant="outline"><Download className="size-3.5" />Export</Button>
          <Button size="sm" variant="outline">Reassign owner</Button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto cursor-pointer text-[12.5px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      {view === "table" ? (
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[1040px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]
                text-[11.5px] uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
                <th scope="col" className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                    aria-label="Select all contracts"
                    className="size-3.5 cursor-pointer accent-[var(--accent)]"
                  />
                </th>
                <SortHead k="title" active={sort === "title"} dir={dir} onSort={toggleSort}>Contract</SortHead>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Counterparty</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Status</th>
                <SortHead k="riskScore" active={sort === "riskScore"} dir={dir} onSort={toggleSort}>Risk</SortHead>
                <SortHead k="value" className="text-right" active={sort === "value"} dir={dir} onSort={toggleSort}>Value</SortHead>
                <SortHead k="expiryDate" active={sort === "expiryDate"} dir={dir} onSort={toggleSort}>Expiry</SortHead>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const d = daysUntil(c.expiryDate);
                const isSel = selected.has(c.id);
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "group border-b border-[var(--line)] transition-colors duration-150",
                      isSel ? "bg-brand-50 dark:bg-brand-500/8" : "hover:bg-[var(--surface-2)]",
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleRow(c.id)}
                        aria-label={`Select ${c.title}`}
                        className="size-3.5 cursor-pointer accent-[var(--accent)]"
                      />
                    </td>
                    <td className="max-w-[300px] px-4 py-3">
                      <Link
                        href={`/dashboard/contracts/${c.id}`}
                        className="block cursor-pointer truncate font-medium text-[var(--fg)]
                          transition-colors duration-200 hover:text-[var(--accent)]"
                      >
                        {c.title}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{c.ref}</span>
                        <Badge tone="neutral" className="!py-0 !text-[10px]">{c.type}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block truncate text-[var(--fg)]">{c.counterparty}</span>
                      <span className="text-[11.5px] text-[var(--fg-subtle)]">{c.department}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={cn("tabular w-6 text-right font-semibold",
                          c.risk === "high" ? "text-risk-high"
                            : c.risk === "medium" ? "text-risk-med" : "text-risk-low")}>
                          {c.riskScore}
                        </span>
                        <Meter
                          value={c.riskScore} className="w-16"
                          tone={c.risk === "high" ? "high" : c.risk === "medium" ? "medium" : "low"}
                          label={`Risk score for ${c.title}`}
                        />
                      </div>
                    </td>
                    <td className="tabular px-4 py-3 text-right font-medium">
                      {money(c.value, true)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="tabular block">{formatDate(c.expiryDate)}</span>
                      <span className={cn("text-[11.5px]",
                        d < 0 ? "text-risk-high" : d < 45 ? "text-risk-med" : "text-[var(--fg-subtle)]")}>
                        {d < 0 ? `${Math.abs(d)} days ago` : `in ${d} days`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Avatar initials={c.ownerInitials} className="size-6 text-[10px]" />
                        <span className="truncate text-[12.5px] text-[var(--fg-muted)]">{c.owner}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3 lg:p-8">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/contracts/${c.id}`}
              className="group flex cursor-pointer flex-col rounded-[var(--radius-card)] border
                border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]
                transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{c.ref}</span>
                <StatusBadge status={c.status} />
              </div>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                {c.title}
              </h3>
              <p className="mt-1 text-[12.5px] text-[var(--fg-muted)]">{c.counterparty}</p>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="tabular text-[18px] font-semibold">{money(c.value, true)}</span>
                <RiskBadge risk={c.risk} score={c.riskScore} />
              </div>
              <div className="mt-3">
                <Meter
                  value={c.riskScore}
                  tone={c.risk === "high" ? "high" : c.risk === "medium" ? "medium" : "low"}
                  label={`Risk score for ${c.title}`}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3">
                <Avatar initials={c.ownerInitials} className="size-6 text-[10px]" />
                <span className="truncate text-[12px] text-[var(--fg-muted)]">{c.owner}</span>
                <span className="tabular ml-auto text-[12px] text-[var(--fg-subtle)]">
                  {formatDate(c.expiryDate)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-full
            bg-[var(--surface-2)] text-[var(--fg-subtle)]">
            <Filter className="size-5" />
          </span>
          <h3 className="mt-4 text-[15px] font-semibold">No contracts match these filters</h3>
          <p className="mt-1.5 max-w-[42ch] text-[13px] text-[var(--fg-muted)]">
            Try widening the status or risk filter, or clear the search term.
          </p>
          <Button
            variant="outline" size="sm" className="mt-5"
            onClick={() => { setStatus("all"); setRisk("all"); setQ(""); }}
          >
            <Check className="size-3.5" />
            Reset all filters
          </Button>
        </div>
      )}
    </div>
  );
}
