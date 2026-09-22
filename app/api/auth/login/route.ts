import { NextResponse } from "next/server";
import { z } from "zod";
import { one } from "@/lib/server/db";
import { verifyPassword, createSession, audit } from "@/lib/server/auth";
import { seed, isSeeded } from "@/lib/server/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // First run: create the demo org so there is an account to sign in to.
  if (!(await isSeeded())) await seed();

  const user = await one<{ id: string; org_id: string; password_hash: string }>(
    `SELECT id, org_id, password_hash FROM users WHERE email = ?`,
    [email.toLowerCase().trim()],
  );

  // Same response and roughly the same work either way, so the endpoint does
  // not reveal which addresses have accounts.
  const ok = user ? verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    return NextResponse.json({ error: "Those credentials did not match." }, { status: 401 });
  }

  await createSession(user.id, user.org_id);
  await audit(user.org_id, user.id, "auth.login", "user", user.id);
  return NextResponse.json({ ok: true });
}
