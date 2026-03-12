import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { createNotifications, listAdminUserIds } from "@/lib/notifications";

const postSchema = z.object({
  content: z.string().min(1),
});

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const id = ctx.params.id;
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const items = await prisma.message.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const id = ctx.params.id;
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const raw = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const msg = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        applicationId: id,
        senderUserId: userId,
        content: parsed.data.content,
        isRead: false,
      },
    });

    const adminUserIds = await listAdminUserIds(tx);
    const recipientIds = new Set<string>([...adminUserIds, app.applicantId]);
    if (app.agentId) {
      const agent = await tx.agent.findUnique({ where: { id: app.agentId }, select: { userId: true } });
      if (agent?.userId) recipientIds.add(agent.userId);
    }
    recipientIds.delete(userId);

    await createNotifications(
      tx,
      Array.from(recipientIds).map((recipientId) => ({
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: "New application message",
        body: `A new message was posted on application ${id}.`,
        applicationId: id,
      }))
    );

    return created;
  });

  return NextResponse.json(msg, { status: 201 });
}
