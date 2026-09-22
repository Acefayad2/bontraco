"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Bell, ChevronRight, Menu, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/primitives";
import type { Contract } from "@/lib/types";
import type { ShellUser } from "./shell";

const labels: Record<string, string> = {
  dashboard: "Overview",
  contracts: "Contracts",
  obligations: "Obligations",
  renewals: "Renewals",
  risk: "Risk register",
  analytics: "Analytics",
  assistant: "Ask Bontraco",
  settings: "Settings",
};

export function Topbar({
  user, contracts, onOpenMobileNav,
}: { user: ShellUser; contracts: Contract[]; onOpenMobileNav?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const segments = pathname.split("/").filter(Boolean);

  const results = q.trim().length > 0
    ? contracts.filter((c) =>
        [c.title, c.counterparty, c.ref, c.type].join(" ").toLowerCase().includes(q.toLowerCase()),
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    }
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--line)]
      bg-[var(--surface)]/90 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md
          text-[var(--fg-muted)] hover:bg-[var(--surface-2)] lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
        {segments.map((s, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const last = i === segments.length - 1;
          const label = labels[s] ?? contracts.find((c) => c.id === s)?.ref ?? s;
          return (
            <span key={href} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-[var(--fg-subtle)]" />}
              {last ? (
                <span className="truncate font-medium text-[var(--fg)]">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="cursor-pointer truncate text-[var(--fg-muted)] transition-colors
                    duration-200 hover:text-[var(--fg)]"
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div ref={boxRef} className="relative ml-auto w-full max-w-[380px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fg-subtle)]" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search contracts, clauses, counterparties…"
          aria-label="Search"
          className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] pl-9 pr-16
            text-[13.5px] text-[var(--fg)] placeholder:text-[var(--fg-subtle)]
            transition-colors duration-200 focus:border-[var(--ring)] focus:bg-[var(--surface)]"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2
          rounded border border-[var(--line-strong)] bg-[var(--surface-2)] px-1.5 py-0.5
          font-mono text-[10px] text-[var(--fg-subtle)] sm:block">
          ⌘K
        </kbd>

        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border
            border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
            <ul>
              {results.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/contracts/${c.id}`}
                    onClick={() => { setOpen(false); setQ(""); }}
                    className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5
                      transition-colors duration-150 hover:bg-[var(--surface-2)]"
                  >
                    <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{c.ref}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.title}</span>
                    <span className="shrink-0 truncate text-[12px] text-[var(--fg-muted)]">
                      {c.counterparty}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          aria-label={`Notifications — ${user.openFindings} open findings`}
          className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-md
            text-[var(--fg-muted)] transition-colors duration-200
            hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-risk-high ring-2 ring-[var(--surface)]" />
        </button>
        <span className="ml-2 hidden items-center gap-2.5 sm:flex">
          <span className="text-right leading-tight">
            <span className="block text-[12.5px] font-medium text-[var(--fg)]">{user.name}</span>
            <span className="block text-[11px] text-[var(--fg-subtle)]">{user.email}</span>
          </span>
          <Avatar initials={user.initials} />
        </span>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
          }}
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md
            text-[var(--fg-muted)] transition-colors duration-200
            hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        >
          <LogOut className="size-[18px]" />
        </button>
      </div>
    </header>
  );
}
