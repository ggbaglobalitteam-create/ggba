import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";

export async function GET() {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      applications: { select: { id: true, status: true } },
    },
  });

  const items = agents.map((a) => {
    const total = a.applications.length;
    const approved = a.applications.filter((x) => x.status === "APPROVED").length;
    const approvalRate = total > 0 ? approved / total : 0;
    return {
      id: a.id,
      userId: a.userId,
      status: a.status,
      companyName: a.companyName,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      user: a.user,
      stats: {
        totalApplications: total,
        approvedApplications: approved,
        approvalRate,
      },
    };
  });

  return NextResponse.json({ items });
}

