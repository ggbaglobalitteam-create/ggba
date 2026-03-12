import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { createNotifications, listAdminUserIds } from "@/lib/notifications";

const patchSchema = z.object({
  companyName: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  businessRegistrationNo: z.string().min(1).optional(),
  taxId: z.string().min(1).optional(),
  directorId: z.string().min(1).optional(),
});

async function findAgent(id: string) {
  return (
    (await prisma.agent.findUnique({ where: { id }, include: { user: true } })) ??
    (await prisma.agent.findUnique({ where: { userId: id }, include: { user: true } }))
  );
}

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isProfileSubmitted(agent: {
  companyName: string | null;
  address: string | null;
  businessRegistrationNo: string | null;
  taxId: string | null;
  directorId: string | null;
}) {
  return (
    hasValue(agent.companyName) &&
    hasValue(agent.address) &&
    hasValue(agent.businessRegistrationNo) &&
    hasValue(agent.taxId) &&
    hasValue(agent.directorId)
  );
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const id = ctx.params.id;
  const agent = await findAgent(id);
  if (!agent) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "AGENT" && agent.userId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role !== "ADMIN" && role !== "AGENT") return jsonError(403, "Forbidden", "FORBIDDEN");

  return NextResponse.json({
    id: agent.id,
    userId: agent.userId,
    status: agent.status,
    companyName: agent.companyName,
    address: agent.address,
    businessRegistrationNo: agent.businessRegistrationNo,
    taxId: agent.taxId,
    directorId: agent.directorId,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
    user: {
      id: agent.user.id,
      email: agent.user.email,
      firstName: agent.user.firstName,
      lastName: agent.user.lastName,
      phone: agent.user.phone,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (role !== "AGENT" || !userId) return jsonError(403, "Forbidden", "FORBIDDEN");

  const id = ctx.params.id;
  const agent = await findAgent(id);
  if (!agent) return jsonError(404, "Not found", "NOT_FOUND");
  if (agent.userId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const wasAlreadySubmitted = isProfileSubmitted(agent);
  const shouldNotifyAdmins = agent.status !== "PENDING" || !wasAlreadySubmitted;

  const updated = await prisma.agent.update({
    where: { id: agent.id },
    data: {
      ...parsed.data,
      status: "PENDING",
    },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } },
  });

  if (shouldNotifyAdmins) {
    const adminUserIds = await listAdminUserIds(prisma);
    await createNotifications(
      prisma,
      adminUserIds.map((adminUserId) => ({
        userId: adminUserId,
        type: "SYSTEM",
        title: "Agent profile submitted for review",
        body: `${updated.companyName || `${updated.user.firstName} ${updated.user.lastName}`.trim() || "An agent"} updated their profile and is pending review.`,
      }))
    );
  }

  return NextResponse.json(updated);
}
