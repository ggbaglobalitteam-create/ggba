import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";

export async function PATCH(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const id = ctx.params.id;
  const updated = await prisma.payment.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json(updated);
}

