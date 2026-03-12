import { NextResponse } from "next/server";

import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { prisma } from "@/lib/prisma";

async function findAgent(id: string) {
  return (
    (await prisma.agent.findUnique({ where: { id }, include: { user: true } })) ??
    (await prisma.agent.findUnique({ where: { userId: id }, include: { user: true } }))
  );
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const agent = await findAgent(ctx.params.id);
  if (!agent) return jsonError(404, "Not found", "NOT_FOUND");
  if (role === "AGENT" && agent.userId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role !== "AGENT" && role !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");
  if (agent.status !== "APPROVED") return jsonError(409, "Certificate unavailable", "CERTIFICATE_UNAVAILABLE");

  const styledCertificateUrl = new URL(
    `/certificate/agent/${encodeURIComponent(agent.id)}?download=1`,
    req.url
  );

  return NextResponse.redirect(styledCertificateUrl, { status: 307 });
}
