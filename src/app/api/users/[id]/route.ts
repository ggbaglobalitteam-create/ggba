import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";

const patchSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(3).optional().nullable(),
  password: z.string().min(6).optional(),
  role: z.enum(["APPLICANT", "AGENT", "ADMIN"]).optional(),
  suspended: z.boolean().optional(),
});

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  suspended: true,
  emailVerified: true,
  createdAt: true,
  agent: { select: { id: true, status: true, companyName: true } },
  applicantApplications: {
    where: { agentId: { not: null } },
    select: { id: true },
    take: 1,
  },
} as const;

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const item = await prisma.user.findUnique({
    where: { id: ctx.params.id },
    select: userSelect,
  });

  if (!item) return jsonError(404, "Not found", "NOT_FOUND");

  const { applicantApplications, ...rest } = item;
  const fullUser = await prisma.user.findUnique({
    where: { id: ctx.params.id },
    select: { password: true },
  });

  return NextResponse.json({
    ...rest,
    hasPassword: Boolean(fullUser?.password),
    hasAgentManagedApplications: applicantApplications.length > 0,
  });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const id = ctx.params.id;
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, emailVerified: true, password: true, agent: { select: { id: true } } },
  });
  if (!existing) return jsonError(404, "Not found", "NOT_FOUND");

  const hashedPassword = parsed.data.password ? await bcrypt.hash(parsed.data.password, 10) : undefined;
  let updated;
  try {
    updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.firstName ? { firstName: parsed.data.firstName } : {}),
        ...(parsed.data.lastName ? { lastName: parsed.data.lastName } : {}),
        ...(parsed.data.email ? { email: parsed.data.email } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(hashedPassword
          ? {
              password: hashedPassword,
              emailVerified: existing.emailVerified ?? new Date(),
            }
          : {}),
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.suspended !== undefined ? { suspended: parsed.data.suspended } : {}),
      },
      select: userSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(409, "Email already exists", "EMAIL_EXISTS");
    }
    throw error;
  }

  // Ensure AGENT role users always have an agent profile to avoid UI/API inconsistency.
  if (parsed.data.role === "AGENT" && !existing.agent) {
    await prisma.agent.create({
      data: {
        userId: id,
        status: "PENDING",
      },
    });

    updated = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  if (!updated) return jsonError(500, "Failed to load updated user", "USER_UPDATE_FAILED");

  const managedByAgent = await prisma.application.findFirst({
    where: { applicantId: id, agentId: { not: null } },
    select: { id: true },
  });

  const { applicantApplications, ...rest } = updated;

  return NextResponse.json({
    ...rest,
    hasPassword: Boolean(hashedPassword || existing.password),
    hasAgentManagedApplications: Boolean(managedByAgent),
  });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const sessionUserId = getSessionUserId(session);
  const id = ctx.params.id;
  if (sessionUserId && sessionUserId === id) {
    return jsonError(409, "You cannot delete your own admin user", "SELF_DELETE_BLOCKED");
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      suspended: true,
      role: true,
      _count: { select: { applicantApplications: true } },
      agent: {
        select: {
          id: true,
          _count: { select: { applications: true } },
        },
      },
    },
  });
  if (!existing) return jsonError(404, "Not found", "NOT_FOUND");

  if (!existing.suspended) {
    return jsonError(409, "Only inactive/suspended users can be removed", "USER_ACTIVE");
  }

  const applicantAppsCount = existing._count.applicantApplications;
  const agentAppsCount = existing.agent?._count.applications ?? 0;
  if (applicantAppsCount > 0 || agentAppsCount > 0) {
    return jsonError(409, "User is still in use by applications", "USER_IN_USE");
  }

  await prisma.user.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}
