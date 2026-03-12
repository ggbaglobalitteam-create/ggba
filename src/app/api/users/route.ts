import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";

const querySchema = z.object({
  role: z.enum(["APPLICANT", "AGENT", "ADMIN"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  search: z.string().optional(),
});

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(3).optional().nullable(),
  role: z.enum(["APPLICANT", "AGENT", "ADMIN"]).default("APPLICANT"),
  suspended: z.boolean().optional().default(false),
  agentStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
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
} as const;

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    role: searchParams.get("role") || undefined,
    status: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
  });
  if (!parsed.success) return jsonError(400, "Invalid query", "VALIDATION_ERROR");

  const { role, status, search } = parsed.data;

  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (status) where.suspended = status === "suspended";
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: userSelect,
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  const password = await bcrypt.hash(data.password, 10);

  try {
    const created = await prisma.user.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
        password,
        phone: data.phone ?? null,
        role: data.role,
        suspended: data.suspended,
        agent:
          data.role === "AGENT"
            ? {
                create: {
                  status: data.agentStatus ?? (data.suspended ? "PENDING" : "APPROVED"),
                },
              }
            : undefined,
      },
      select: userSelect,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(409, "Email already exists", "EMAIL_EXISTS");
    }
    throw error;
  }
}
