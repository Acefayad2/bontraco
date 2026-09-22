import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-[400px]">
          <Link href="/" className="cursor-pointer" aria-label="Bontraco home">
            <Logo />
          </Link>
          <h1 className="display mt-10 text-[34px] text-[var(--fg)]">Sign in</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--fg-muted)]">
            This is a demonstration environment. The credentials below are filled in
            for you and the portfolio behind them is fictional.
          </p>
          <LoginForm />
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-[var(--line)] bg-[var(--surface-2)] lg:block">
        <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <blockquote className="display max-w-[22ch] text-[32px] leading-[1.15] text-[var(--fg)]">
            Know what you are signing.
            <br />
            <span className="underscore">Before</span> you sign it.
          </blockquote>
          <p className="mt-8 max-w-[44ch] text-[14.5px] leading-relaxed text-[var(--fg-muted)]">
            Once you are in, upload a PDF from the contracts page. Bontraco reads it,
            extracts the clauses, scores each one against the Vendor Playbook, and
            writes the findings back with the page they came from.
          </p>
        </div>
      </div>
    </div>
  );
}
