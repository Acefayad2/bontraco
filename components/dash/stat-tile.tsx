import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label, value, sub, delta, deltaTone = "neutral", icon: Icon, className,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  deltaTone?: "up-good" | "down-good" | "up-bad" | "down-bad" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const up = deltaTone.startsWith("up");
  const good = deltaTone.endsWith("good");
  return (
    <div className={cn("group px-5 py-5 lg:px-6", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-[15px] text-[var(--fg-subtle)]" />}
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
          {label}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="tabular text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--fg)]">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "tabular inline-flex items-center gap-0.5 text-[12px] font-medium",
              deltaTone === "neutral"
                ? "text-[var(--fg-muted)]"
                : good ? "text-risk-low" : "text-risk-high",
            )}
          >
            {deltaTone !== "neutral" &&
              (up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />)}
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-2 text-[12.5px] leading-snug text-[var(--fg-muted)]">{sub}</p>}
    </div>
  );
}
