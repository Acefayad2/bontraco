import { cn } from "@/lib/utils";

/** Bontraco mark: a document corner-fold cut by a signature stroke. */
export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden focusable="false">
        <path
          d="M6 3.5h12.5L26 11v17.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
          className="fill-ink-900 dark:fill-white"
        />
        <path d="M18.5 3.5 26 11h-6.5a1 1 0 0 1-1-1V3.5Z" className="fill-brand-300 dark:fill-brand-400" />
        <path
          d="M10.5 22.5c2.6-5.4 4-8.1 4.2-8.1.3 0 .3 3.2.1 9.6 0 .5.2.7.5.4 1.3-1.4 2.6-2.6 3.9-3.6"
          fill="none"
          className="stroke-flag-600 dark:stroke-flag-400"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWord && (
        <span className="text-[17px] font-semibold tracking-[-0.025em] text-[var(--fg)]">
          Bontraco
        </span>
      )}
    </span>
  );
}
