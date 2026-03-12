import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";

export async function GET() {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const items = await prisma.application.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: {
      applicant: { select: { id: true, email: true, firstName: true, lastName: true } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    items: items.map((a) => ({
      id: a.id,
      visaConfigKey: a.visaConfigKey,
      destinationCountry: a.destinationCountry,
      purpose: a.purpose,
      status: a.status,
      updatedAt: a.updatedAt,
      applicant: a.applicant,
      lastStatusChange: a.statusHistory[0] ?? null,
    })),
  });
}

