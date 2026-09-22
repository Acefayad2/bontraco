"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("priya@bontraco.demo");
  const [password, setPassword] = useState("bontraco-demo");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Sign-in failed. Please try again.");
        setPending(false);
        return;
      }
      const next = params.get("next");
      router.push(next && next.startsWith("/dashboard") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is it still running?");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="block text-[13px] font-medium text-[var(--fg)]">
          Work email
        </label>
        <input
          id="email" name="email" type="email" required autoComplete="username"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-[var(--line-strong)] bg-[var(--surface)]
            px-3.5 text-[14px] text-[var(--fg)] transition-colors duration-200
            focus:border-[var(--ring)]"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-[13px] font-medium text-[var(--fg)]">
          Password
        </label>
        <input
          id="password" name="password" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-[var(--line-strong)] bg-[var(--surface)]
            px-3.5 text-[14px] text-[var(--fg)] transition-colors duration-200
            focus:border-[var(--ring)]"
        />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-risk-high-bg px-3 py-2.5
          text-[13px] leading-snug text-risk-high dark:bg-risk-high/12">
          <AlertCircle className="mt-px size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <ArrowRight className="size-4" />}
      </Button>

      <p className="text-[12.5px] leading-relaxed text-[var(--fg-subtle)]">
        Demo account: <span className="font-mono">priya@bontraco.demo</span> ·{" "}
        <span className="font-mono">bontraco-demo</span>. The org and its twelve
        fictional agreements are created on first sign-in.
      </p>
    </form>
  );
}
