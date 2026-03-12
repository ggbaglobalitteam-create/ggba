import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { getVisaConfigKey } from "@/lib/visaConfig";

const createSchema = z.object({
  purpose: z.string().min(1),
  destinationCountry: z.string().min(1),
  configKey: z.string().min(1).optional(),
});

const adminQuerySchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "REQUIRES_INFO", "APPROVED", "REJECTED"]).optional(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);

  if (role === "APPLICANT") {
    const apps = await prisma.application.findMany({
      where: { applicantId: userId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ items: apps });
  }

  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent) return NextResponse.json({ items: [] });

    const apps = await prisma.application.findMany({
      where: { agentId: agent.id },
      orderBy: { updatedAt: "desc" },
      include: { applicant: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } },
    });
    return NextResponse.json({ items: apps });
  }

  // ADMIN (basic list; filters/pagination to be added)
  if (role === "ADMIN") {
    const parsed = adminQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
    });
    if (!parsed.success) return jsonError(400, "Invalid query", "VALIDATION_ERROR");
    const { status } = parsed.data;
    const items = await prisma.application.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { applicant: { select: { id: true, email: true, firstName: true, lastName: true } }, agent: true },
    });
    return NextResponse.json({ items });
  }

  return jsonError(403, "Forbidden", "FORBIDDEN");
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!userId || (role !== "APPLICANT" && role !== "AGENT")) {
    return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const raw = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const { purpose, destinationCountry, configKey } = parsed.data;
  const visaConfigKey = configKey || getVisaConfigKey(purpose, destinationCountry);

  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!agent) return jsonError(403, "Forbidden", "FORBIDDEN");
    if (agent.status !== "APPROVED") {
      return jsonError(403, "Only approved agents can create applications", "AGENT_NOT_APPROVED");
    }

    const created = await prisma.$transaction(async (tx) => {
      const placeholderApplicant = await tx.user.create({
        data: {
          role: "APPLICANT",
          firstName: "New",
          lastName: "Applicant",
          email: `lead-${crypto.randomUUID()}@placeholder.ggba.local`,
        },
        select: { id: true },
      });

      return tx.application.create({
        data: {
          applicantId: placeholderApplicant.id,
          agentId: agent.id,
          purpose,
          destinationCountry,
          visaConfigKey,
          formData: {},
          status: "PENDING",
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  }

  const created = await prisma.application.create({
    data: {
      applicantId: userId,
      purpose,
      destinationCountry,
      visaConfigKey,
      formData: {},
      status: "PENDING",
    },
  });

  return NextResponse.json(created, { status: 201 });
}
