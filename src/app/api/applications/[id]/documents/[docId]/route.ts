import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";

const bodySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "PENDING", "UPLOADED"]),
  note: z.string().optional(),
});

export async function PATCH(req: Request, ctx: { params: { id: string; docId: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "ADMIN" && role !== "AGENT") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const { id, docId } = ctx.params;
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const updated = await prisma.document.update({
    where: { applicationId_documentId: { applicationId: id, documentId: docId } },
    data: {
      status: parsed.data.status,
      verificationNote: parsed.data.note ?? null,
    },
  });

  return NextResponse.json(updated);
}

