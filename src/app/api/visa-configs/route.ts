import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";
import { VISA_CONFIG_KEYS } from "@/lib/visaConfig";
import { normalizeVisaConfig, parseVisaKey } from "@/lib/visaConfigSchema";

const createSchema = z.object({
  configKey: z.string().min(1),
  config: z.unknown(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  country: z.string().trim().min(1).optional(),
  purpose: z.string().trim().min(1).optional(),
});

const DELETED_META_VALUE = "__DELETED__";

function isCatalogDeleted(item?: { country: string | null; purpose: string | null } | null) {
  if (!item) return false;
  return item.country === DELETED_META_VALUE && item.purpose === DELETED_META_VALUE;
}

export async function GET() {
  const session = await requireSession();
  const isAdmin = !!session && getSessionRole(session) === "ADMIN";

  const overrides = await prisma.visaConfigOverride.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const overrideMap = new Map(overrides.map((item) => [item.configKey, item]));
  const getMeta = (
    configKey: string,
    override?: { country: string | null; purpose: string | null },
    allowOverrideMeta = true
  ) => {
    const parsed = parseVisaKey(configKey);
    return {
      country: allowOverrideMeta ? override?.country?.trim() || parsed.country : parsed.country,
      purpose: allowOverrideMeta ? override?.purpose?.trim() || parsed.purpose : parsed.purpose,
    };
  };

  const catalog = VISA_CONFIG_KEYS.map((configKey) => {
    const override = overrideMap.get(configKey);
    if (isCatalogDeleted(override)) return null;

    const useOverride = override?.status === "PUBLISHED";
    const meta = getMeta(configKey, override, isAdmin || useOverride);
    return {
      configKey,
      country: meta.country,
      purpose: meta.purpose,
      source: useOverride ? "OVERRIDE" : "DEFAULT",
      status: useOverride ? "PUBLISHED" : "PUBLISHED",
      updatedAt: override?.updatedAt || null,
      hasDraftOverride: override?.status === "DRAFT",
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  // Include override-only keys that are not part of static defaults.
  for (const override of overrides) {
    if (isCatalogDeleted(override)) continue;
    if (VISA_CONFIG_KEYS.includes(override.configKey)) continue;
    const meta = getMeta(override.configKey, override);
    catalog.push({
      configKey: override.configKey,
      country: meta.country,
      purpose: meta.purpose,
      source: "OVERRIDE",
      status: override.status,
      updatedAt: override.updatedAt,
      hasDraftOverride: override.status === "DRAFT",
    });
  }

  catalog.sort((a, b) => a.configKey.localeCompare(b.configKey));

  if (isAdmin) return NextResponse.json({ items: overrides, catalog });
  return NextResponse.json({ catalog });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  let normalizedConfig: Prisma.InputJsonValue;
  try {
    normalizedConfig = normalizeVisaConfig(parsed.data.config) as Prisma.InputJsonValue;
  } catch {
    return jsonError(400, "Invalid visa config structure", "INVALID_CONFIG");
  }

  let created;
  try {
    created = await prisma.visaConfigOverride.create({
      data: {
        configKey: parsed.data.configKey,
        country: parsed.data.country,
        purpose: parsed.data.purpose,
        config: normalizedConfig,
        status: parsed.data.status,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(409, "Config key already exists", "CONFIG_EXISTS");
    }
    throw error;
  }

  return NextResponse.json(created, { status: 201 });
}
