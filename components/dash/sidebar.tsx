"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, FileText, ListChecks, CalendarClock,
  BarChart3, Sparkles, Settings, PanelLeftClose, PanelLeft,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import type { ShellUser } from "./shell";

function navItems(user: ShellUser) {
  return [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/contracts", label: "Contracts", icon: FileText },
    { href: "/dashboard/obligations", label: "Obligations", icon: ListChecks,
      badge: user.overdueObligations > 0 ? String(user.overdueObligations) : undefined },
    { href: "/dashboard/renewals", label: "Renewals", icon: CalendarClock },
    { href: "/dashboard/risk", label: "Risk register", icon: ShieldAlert,
      badge: user.openFindings > 0 ? String(user.openFindings) : undefined },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ];
}

const secondary = [
  { href: "/dashboard/assistant", label: "Ask Bontraco", icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const nav = navItems(user);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[var(--line)]",
        "bg-[var(--surface)] transition-[width] duration-300 lg:flex",
        collapsed ? "w-[68px]" : "w-[236px]",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-[var(--line)]",
        collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" className="cursor-pointer" aria-label="Bontraco home">
          <Logo showWord={!collapsed} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto thin-scroll p-3" aria-label="Dashboard">
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                    "text-[13.5px] font-medium transition-colors duration-200",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-[var(--surface-2)] text-[var(--fg)]"
                      : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--pop)]"
                    />
                  )}
                  <item.icon className="size-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="tabular ml-auto rounded-full bg-risk-high-bg px-1.5 py-0.5
                          text-[10.5px] font-semibold text-risk-high dark:bg-risk-high/15">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={cn("my-4 border-t border-[var(--line)]", collapsed && "mx-2")} />

        <ul className="space-y-0.5">
          {secondary.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                    "text-[13.5px] font-medium transition-colors duration-200",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-[var(--surface-2)] text-[var(--fg)]"
                      : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
                  )}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
              Playbook
            </span>
            <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold
              text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              v{user.playbookVersion}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-[var(--fg-muted)]">
            {user.playbookName} · 11 positions · scored on every upload
          </p>
        </div>
      )}

      <div className="border-t border-[var(--line)] p-3">
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2",
            "text-[13px] font-medium text-[var(--fg-subtle)] transition-colors duration-200",
            "hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
