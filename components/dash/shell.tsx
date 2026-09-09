"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  LayoutDashboard, FileText, ListChecks, CalendarClock,
  BarChart3, Sparkles, Settings, ShieldAlert,
} from "lucide-react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Logo } from "@/components/ui/logo";

const mobileNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/contracts", label: "Contracts", icon: FileText },
  { href: "/dashboard/obligations", label: "Obligations", icon: ListChecks },
  { href: "/dashboard/renewals", label: "Renewals", icon: CalendarClock },
  { href: "/dashboard/risk", label: "Risk register", icon: ShieldAlert },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/assistant", label: "Ask Bontraco", icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-[var(--bg)]">
      <Sidebar />

      {navOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[264px] border-r border-[var(--line)]
            bg-[var(--surface)] p-3 shadow-[var(--shadow-lg)]">
            <div className="mb-3 flex h-11 items-center justify-between px-1">
              <Logo />
              <button
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md
                  text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
              >
                <X className="size-5" />
              </button>
            </div>
            <ul className="space-y-0.5">
              {mobileNav.map((i) => {
                const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={() => setNavOpen(false)}
                      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5
                        text-[14px] font-medium transition-colors duration-200 ${
                          active
                            ? "bg-[var(--surface-2)] text-[var(--fg)]"
                            : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
                        }`}
                    >
                      <i.icon className="size-[18px]" />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setNavOpen(true)} />
        <main id="main" className="flex-1">{children}</main>
      </div>
    </div>
  );
}
