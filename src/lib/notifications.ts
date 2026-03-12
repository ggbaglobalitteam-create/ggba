import { Prisma, PrismaClient, UserRole } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

declare global {
  // eslint-disable-next-line no-var
  var __notificationTableExists: boolean | undefined;
}

export type NotificationInput = {
  userId: string;
  type: "APPLICATION_SUBMITTED" | "APPLICATION_STATUS_CHANGED" | "NEW_MESSAGE" | "SYSTEM";
  title: string;
  body?: string;
  applicationId?: string;
};

export async function notificationTableExists(db: DbClient): Promise<boolean> {
  if (global.__notificationTableExists === false) return false;

  try {
    const result = await db.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'Notification'
      ) AS "exists"
    `;
    const exists = Boolean(result[0]?.exists);
    global.__notificationTableExists = exists;
    return exists;
  } catch (error) {
    if (isPoolExhaustedError(error)) return false;
    throw error;
  }
}

export async function createNotifications(db: DbClient, notifications: NotificationInput[]) {
  if (!notifications.length) return;
  if (!(await notificationTableExists(db))) return;

  const unique = new Map<string, NotificationInput>();
  for (const item of notifications) {
    const key = `${item.userId}|${item.type}|${item.applicationId || ""}|${item.title}|${item.body || ""}`;
    if (!unique.has(key)) unique.set(key, item);
  }

  try {
    await db.notification.createMany({
      data: Array.from(unique.values()).map((item) => ({
        userId: item.userId,
        type: item.type,
        title: item.title,
        body: item.body,
        applicationId: item.applicationId,
        isRead: false,
      })),
    });
  } catch (error) {
    if (isMissingNotificationTableError(error)) {
      global.__notificationTableExists = false;
      return;
    }
    if (isPoolExhaustedError(error)) return;
    throw error;
  }
}

export async function listAdminUserIds(db: DbClient): Promise<string[]> {
  const admins = await db.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });
  return admins.map((item) => item.id);
}

export function isMissingNotificationTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    error.meta?.modelName === "Notification"
  );
}

export function isPoolExhaustedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("MaxClientsInSessionMode");
}
