import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Button ─────────────────────────────────────────────────── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "pop";
  size?: "sm" | "md" | "lg";
};

const buttonVariants = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-brand-700 active:bg-brand-800 shadow-[var(--shadow-sm)]",
  secondary:
    "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-[var(--shadow-sm)] dark:bg-white dark:text-ink-900",
  outline:
    "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--fg)] hover:bg-[var(--surface-2)] hover:border-[var(--fg-subtle)]",
  ghost: "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
  danger: "bg-risk-high text-white hover:brightness-110",
  pop: "bg-[var(--pop)] text-[var(--pop-fg)] hover:brightness-110 shadow-[var(--shadow-sm)]",
};

const buttonSizes = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-lg",
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap cursor-pointer",
        "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
        "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant], buttonSizes[size], className,
      )}
      {...props}
    />
  );
}

/* ── Card ───────────────────────────────────────────────────── */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)]",
        "shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--line)]", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[16px] font-semibold tracking-[-0.015em]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[13.5px] text-[var(--fg-muted)] leading-relaxed mt-1", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

/* ── Badge ──────────────────────────────────────────────────── */
type BadgeTone = "neutral" | "high" | "medium" | "low" | "info" | "accent";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--line-strong)]",
  high: "bg-risk-high-bg text-risk-high border-risk-high/25 dark:bg-risk-high/15",
  medium: "bg-risk-med-bg text-risk-med border-risk-med/25 dark:bg-risk-med/15",
  low: "bg-risk-low-bg text-risk-low border-risk-low/25 dark:bg-risk-low/15",
  info: "bg-info-bg text-info border-info/25 dark:bg-info/15",
  accent: "bg-brand-50 text-brand-700 border-brand-600/25 dark:bg-brand-500/15 dark:text-brand-300",
};

export function Badge({
  tone = "neutral", className, dot = false, ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-[11px] font-medium tracking-[0.01em] whitespace-nowrap",
        badgeTones[tone], className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {props.children}
    </span>
  );
}

/* ── Section label ──────────────────────────────────────────── */
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
        className,
      )}
      {...props}
    />
  );
}

/* ── Progress meter ─────────────────────────────────────────── */
export function Meter({
  value, tone = "accent", className, label,
}: { value: number; tone?: "accent" | "high" | "medium" | "low"; className?: string; label?: string }) {
  const colors = {
    accent: "bg-[var(--accent)]",
    high: "bg-risk-high",
    medium: "bg-risk-med",
    low: "bg-risk-low",
  };
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "progress"}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", colors[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ── Avatar ─────────────────────────────────────────────────── */
export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
        "bg-ink-800 text-[11px] font-semibold text-white select-none",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
