export function PageHeader({
  title, description, actions,
}: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--line)] px-4 py-6 sm:px-6
      md:flex-row md:items-end md:justify-between lg:px-8">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--fg)]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-[70ch] text-[13.5px] leading-[1.6] text-[var(--fg-muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
