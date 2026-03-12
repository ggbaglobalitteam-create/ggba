import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";
import { createNotifications } from "@/lib/notifications";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

async function findAgent(id: string) {
  return (
    (await prisma.agent.findUnique({ where: { id } })) ??
    (await prisma.agent.findUnique({ where: { userId: id } }))
  );
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const id = ctx.params.id;
  const existing = await findAgent(id);
  if (!existing) return jsonError(404, "Not found", "NOT_FOUND");

  const updated = await prisma.agent.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  await createNotifications(prisma, [
    {
      userId: updated.user.id,
      type: "SYSTEM",
      title: `Agent profile ${parsed.data.status.toLowerCase()}`,
      body: `Your agent profile status is now ${parsed.data.status.toLowerCase()}.`,
    },
  ]);

  return NextResponse.json(updated);
}
