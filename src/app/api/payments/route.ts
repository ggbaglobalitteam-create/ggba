import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";

const bodySchema = z.object({
  applicationId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("EUR"),
  method: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const app = await prisma.application.findUnique({ where: { id: parsed.data.applicationId } });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");
  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");

  const created = await prisma.payment.create({
    data: {
      applicationId: parsed.data.applicationId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      method: parsed.data.method,
      status: "PENDING",
    },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const items = await prisma.payment.findMany({
    where: search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { transactionId: { contains: search, mode: "insensitive" } },
            { applicationId: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      application: {
        select: {
          id: true,
          applicant: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  return NextResponse.json({ items });
}
