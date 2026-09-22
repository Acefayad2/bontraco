import { NextResponse } from "next/server";
import { destroySession, getSession, audit } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (session) await audit(session.orgId, session.userId, "auth.logout", "user", session.userId);
  await destroySession();
  return NextResponse.json({ ok: true });
}
