import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, audit } from "@/lib/server/auth";
import { setClauseAccepted } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ accepted: z.boolean() });

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Expected { accepted: boolean }." }, { status: 400 });

  const { id } = await ctx.params;
  const changed = await setClauseAccepted(session.orgId, id, parsed.data.accepted);
  if (changed === 0) return NextResponse.json({ error: "No such finding." }, { status: 404 });

  await audit(session.orgId, session.userId, "clause.resolution", "clause", id, parsed.data);
  return NextResponse.json({ ok: true });
}
