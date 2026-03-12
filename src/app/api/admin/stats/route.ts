import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";

export async function GET() {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalApplications,
    pendingCount,
    approvedThisMonth,
    rejectedThisMonth,
    revenueAgg,
    newRegistrationsThisWeek,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.application.count({ where: { status: "APPROVED", updatedAt: { gte: startOfMonth } } }),
    prisma.application.count({ where: { status: "REJECTED", updatedAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED", updatedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
  ]);

  return NextResponse.json({
    totalApplications,
    pendingCount,
    approvedThisMonth,
    rejectedThisMonth,
    revenueThisMonth: revenueAgg._sum.amount?.toString() ?? "0",
    newRegistrationsThisWeek,
  });
}

