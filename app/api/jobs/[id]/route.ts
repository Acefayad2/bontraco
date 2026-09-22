import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { getJob } from "@/lib/server/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await ctx.params;
  const job = await getJob(session.orgId, id);
  if (!job) return NextResponse.json({ error: "No such job." }, { status: 404 });
  return NextResponse.json(job);
}
