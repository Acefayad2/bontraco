import Link from "next/link";
import { CircleAlert, CircleCheck, Clock, Plus, Repeat } from "lucide-react";
import { PageHeader } from "@/components/dash/page-header";
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge, Avatar } from "@/components/ui/primitives";
import { obligations, formatDate, daysUntil } from "@/lib/data";

export const metadata = { title: "Obligations" };

const groups = [
  { key: "overdue", label: "Overdue", tone: "high" as const, note: "Past the committed date" },
  { key: "due_soon", label: "Due within 14 days", tone: "medium" as const, note: "Action needed this fortnight" },
  { key: "upcoming", label: "Upcoming", tone: "neutral" as const, note: "Tracked, not yet actionable" },
];

const recurrenceLabel = {
  one_time: "One-time", monthly: "Monthly", quarterly: "Quarterly", annual: "Annual",
};

export default function ObligationsPage() {
  const overdue = obligations.filter((o) => o.status === "overdue").length;

  return (
    <>
      <PageHeader
        title="Obligations"
        description="Post-signature duties Bontraco extracted from executed agreements — notice windows, reporting, true-ups and certificates — each routed to a named owner."
        actions={<Button size="sm"><Plus className="size-3.5" />Add obligation</Button>}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {overdue > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-risk-high/25
            bg-risk-high-bg px-4 py-3.5 dark:bg-risk-high/10">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-risk-high" />
            <div>
              <p className="text-[13.5px] font-medium text-risk-high">
                {overdue} obligations are past their committed date
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--fg-muted)]">
                The Aperture notice window lapsed on 31 August, which means the SOW now runs to
                its natural end date and the Kestrel PO gap stays open until bridging terms are issued.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {groups.map((g) => {
            const items = obligations
              .filter((o) => o.status === g.key)
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
            if (items.length === 0) return null;
            return (
              <Card key={g.key}>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2.5">
                      {g.label}
                      <Badge tone={g.tone}>{items.length}</Badge>
                    </CardTitle>
                    <CardDescription>{g.note}</CardDescription>
                  </div>
                </CardHeader>
                <ul className="divide-y divide-[var(--line)]">
                  {items.map((o) => {
                    const d = daysUntil(o.dueDate);
                    return (
                      <li key={o.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                        <span className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center
                          rounded-lg ${o.status === "overdue"
                            ? "bg-risk-high-bg text-risk-high dark:bg-risk-high/15"
                            : o.status === "due_soon"
                              ? "bg-risk-med-bg text-risk-med dark:bg-risk-med/15"
                              : "bg-[var(--surface-2)] text-[var(--fg-subtle)]"}`}>
                          {o.status === "overdue" ? <CircleAlert className="size-4" /> : <Clock className="size-4" />}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium leading-snug">{o.description}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1
                            text-[12.5px] text-[var(--fg-muted)]">
                            <Link
                              href={`/dashboard/contracts/${o.contractId}`}
                              className="cursor-pointer underline decoration-[var(--line-strong)]
                                underline-offset-2 transition-colors duration-200 hover:text-[var(--fg)]"
                            >
                              {o.contractTitle}
                            </Link>
                            <span className="text-[var(--fg-subtle)]">·</span>
                            <span>{o.counterparty}</span>
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                          <Badge tone="neutral"><Repeat className="size-3" />{recurrenceLabel[o.recurrence]}</Badge>
                          <Badge tone="neutral">{o.category}</Badge>
                          <span className="flex items-center gap-2">
                            <Avatar initials={o.owner.split(" ").map((p) => p[0]).join("")} className="size-6 text-[10px]" />
                            <span className="hidden text-[12.5px] text-[var(--fg-muted)] md:inline">{o.owner}</span>
                          </span>
                          <div className="w-[104px] text-right">
                            <div className="tabular text-[13px] font-medium">{formatDate(o.dueDate)}</div>
                            <div className={`tabular text-[11.5px] ${
                              d < 0 ? "text-risk-high" : d < 15 ? "text-risk-med" : "text-[var(--fg-subtle)]"
                            }`}>
                              {d < 0 ? `${Math.abs(d)} days late` : `in ${d} days`}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <CircleCheck className="size-3.5" />
                            Complete
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
