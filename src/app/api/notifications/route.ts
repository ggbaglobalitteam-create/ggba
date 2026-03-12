import { NextResponse } from "next/server";
import { z } from "zod";

import { isMissingNotificationTableError, isPoolExhaustedError, notificationTableExists } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  unreadOnly: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
});

const patchSchema = z
  .object({
    action: z.enum(["MARK_READ", "MARK_ALL_READ"]),
    id: z.string().min(1).optional(),
  })
  .refine((value) => value.action === "MARK_ALL_READ" || Boolean(value.id), {
    message: "id is required for MARK_READ",
  });

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  const userId = getSessionUserId(session);
  if (!userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: searchParams.get("limit") || undefined,
    unreadOnly: searchParams.get("unreadOnly") || undefined,
  });
  if (!parsed.success) return jsonError(400, "Invalid query", "VALIDATION_ERROR");

  const limit = parsed.data.limit ?? 20;
  const unreadOnly = parsed.data.unreadOnly ?? false;

  if (!(await notificationTableExists(prisma))) {
    return NextResponse.json({ items: [], unreadCount: 0 });
  }

  const where = {
    userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    if (isMissingNotificationTableError(error) || isPoolExhaustedError(error)) {
      return NextResponse.json({ items: [], unreadCount: 0 });
    }
    throw error;
  }
}

export async function PATCH(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  const userId = getSessionUserId(session);
  if (!userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  if (!(await notificationTableExists(prisma))) {
    return NextResponse.json({ success: true, unreadCount: 0 });
  }

  try {
    const now = new Date();
    if (parsed.data.action === "MARK_ALL_READ") {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: now },
      });
    } else {
      await prisma.notification.updateMany({
        where: { id: parsed.data.id, userId, isRead: false },
        data: { isRead: true, readAt: now },
      });
    }

    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    if (isMissingNotificationTableError(error) || isPoolExhaustedError(error)) {
      return NextResponse.json({ success: true, unreadCount: 0 });
    }
    throw error;
  }
}
