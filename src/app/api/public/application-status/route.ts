import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api/routeUtils";

const requestSchema = z.object({
  passportNumber: z.string().trim().min(3).max(50),
});

type PublicApplicationStatusRow = {
  id: string;
  status: string;
  destinationCountry: string;
  purpose: string;
  createdAt: Date;
  updatedAt: Date;
  latestStatusAt: Date | null;
  latestNote: string | null;
};

function normalizePassport(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const normalizedPassport = normalizePassport(parsed.data.passportNumber);
  if (!normalizedPassport) return jsonError(400, "Passport number is required", "VALIDATION_ERROR");

  const rows = await prisma.$queryRaw<PublicApplicationStatusRow[]>(Prisma.sql`
    SELECT
      a."id",
      a."status"::text AS "status",
      a."destinationCountry",
      a."purpose",
      a."createdAt",
      a."updatedAt",
      latest."createdAt" AS "latestStatusAt",
      latest."note" AS "latestNote"
    FROM "Application" a
    LEFT JOIN LATERAL (
      SELECT sh."createdAt", sh."note"
      FROM "StatusHistory" sh
      WHERE sh."applicationId" = a."id"
      ORDER BY sh."createdAt" DESC
      LIMIT 1
    ) latest ON TRUE
    WHERE UPPER(REGEXP_REPLACE(COALESCE(
      a."formData"->>'passportNumber',
      a."formData"->>'passportNo',
      a."formData"->>'passport_number',
      ''
    ), '[^A-Za-z0-9]', '', 'g')) = ${normalizedPassport}
    ORDER BY a."createdAt" DESC
    LIMIT 1
  `);

  const match = rows[0];
  if (!match) return jsonError(404, "No application found for that passport number", "NOT_FOUND");

  return NextResponse.json({
    id: match.id,
    status: match.status,
    destinationCountry: match.destinationCountry,
    purpose: match.purpose,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    latestStatusAt: match.latestStatusAt,
    latestNote: match.latestNote,
  });
}
