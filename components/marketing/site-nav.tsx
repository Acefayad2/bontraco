"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/primitives";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#how", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300
        ${scrolled
          ? "border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-6">
        <Link href="/" className="cursor-pointer" aria-label="Bontraco home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="cursor-pointer rounded-md px-3 py-2 text-[13.5px] font-medium
                text-[var(--fg-muted)] transition-colors duration-200
                hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/dashboard"
            className="hidden cursor-pointer rounded-md px-3 py-2 text-[13.5px] font-medium
              text-[var(--fg-muted)] transition-colors duration-200 hover:text-[var(--fg)] sm:block"
          >
            Sign in
          </Link>
          <Link href="/dashboard" className="hidden sm:block">
            <Button size="sm" className="group">
              Open the dashboard
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md
              text-[var(--fg)] hover:bg-[var(--surface-2)] md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--line)] bg-[var(--bg)] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md px-3 py-3 text-[15px] font-medium
                  text-[var(--fg)] hover:bg-[var(--surface-2)]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex items-center gap-3 border-t border-[var(--line)] pt-4">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">Open the dashboard</Button>
              </Link>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
