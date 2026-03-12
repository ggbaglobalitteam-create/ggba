import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { VISA_CONFIGS } from "@/lib/visaConfig";
import { getSessionRole, jsonError, requireSession } from "@/lib/api/routeUtils";
import { normalizeVisaConfig, parseVisaKey } from "@/lib/visaConfigSchema";

const patchSchema = z.object({
  config: z.unknown().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  country: z.string().trim().min(1).optional(),
  purpose: z.string().trim().min(1).optional(),
  deleted: z.boolean().optional(),
});

const DELETED_META_VALUE = "__DELETED__";

function isCatalogDeleted(item?: { country: string | null; purpose: string | null } | null) {
  if (!item) return false;
  return item.country === DELETED_META_VALUE && item.purpose === DELETED_META_VALUE;
}

function resolveMeta(key: string, item?: { country: string | null; purpose: string | null }) {
  const parsed = parseVisaKey(key);
  return {
    country: item?.country?.trim() || parsed.country,
    purpose: item?.purpose?.trim() || parsed.purpose,
  };
}

export async function GET(_req: Request, ctx: { params: { key: string } }) {
  const key = ctx.params.key;
  const item = await prisma.visaConfigOverride.findUnique({ where: { configKey: key } });
  if (isCatalogDeleted(item)) return jsonError(404, "Not found", "NOT_FOUND");
  if (item) {
    let config;
    try {
      config = normalizeVisaConfig(item.config);
    } catch {
      return jsonError(500, "Stored visa config is invalid", "INVALID_STORED_CONFIG");
    }
    const meta = resolveMeta(key, item);
    return NextResponse.json({ ...item, ...meta, config, source: "OVERRIDE" });
  }

  const fallback = VISA_CONFIGS[key];
  if (!fallback) return jsonError(404, "Not found", "NOT_FOUND");
  const meta = resolveMeta(key);
  return NextResponse.json({
    configKey: key,
    ...meta,
    config: normalizeVisaConfig(fallback),
    status: "PUBLISHED",
    source: "DEFAULT",
  });
}

export async function PATCH(req: Request, ctx: { params: { key: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const key = ctx.params.key;
  const existing = await prisma.visaConfigOverride.findUnique({ where: { configKey: key } });
  const hasMetaUpdate = parsed.data.country !== undefined || parsed.data.purpose !== undefined;

  if (parsed.data.deleted) {
    const fallback = VISA_CONFIGS[key];
    const initialConfig =
      (fallback ? normalizeVisaConfig(fallback) : undefined) ||
      (existing ? normalizeVisaConfig(existing.config) : undefined);

    if (!initialConfig) {
      return jsonError(404, "Config key not found", "NOT_FOUND");
    }

    const deleted = existing
      ? await prisma.visaConfigOverride.update({
          where: { configKey: key },
          data: {
            status: "DRAFT",
            country: DELETED_META_VALUE,
            purpose: DELETED_META_VALUE,
            config: normalizeVisaConfig(existing.config) as Prisma.InputJsonValue,
          },
        })
      : await prisma.visaConfigOverride.create({
          data: {
            configKey: key,
            config: initialConfig as Prisma.InputJsonValue,
            status: "DRAFT",
            country: DELETED_META_VALUE,
            purpose: DELETED_META_VALUE,
          },
        });

    return NextResponse.json({
      ...deleted,
      country: "",
      purpose: "",
      source: "OVERRIDE",
      deleted: true,
    });
  }

  let normalizedConfig: Prisma.InputJsonValue | undefined = undefined;
  if (parsed.data.config !== undefined) {
    try {
      normalizedConfig = normalizeVisaConfig(parsed.data.config) as Prisma.InputJsonValue;
    } catch {
      return jsonError(400, "Invalid visa config structure", "INVALID_CONFIG");
    }
  }

  let updated;
  if (existing) {
    updated = await prisma.visaConfigOverride.update({
        where: { configKey: key },
        data: {
          ...(normalizedConfig !== undefined ? { config: normalizedConfig } : {}),
          ...(parsed.data.status ? { status: parsed.data.status } : {}),
          ...(parsed.data.country !== undefined ? { country: parsed.data.country } : {}),
          ...(parsed.data.purpose !== undefined ? { purpose: parsed.data.purpose } : {}),
        },
      });
  } else {
    if (normalizedConfig === undefined && !parsed.data.status && !hasMetaUpdate) {
      return jsonError(400, "Config is required when creating override", "CONFIG_REQUIRED");
    }

    let initialConfig: Prisma.InputJsonValue | undefined = normalizedConfig;
    const fallback = VISA_CONFIGS[key];
    if (initialConfig === undefined) {
      if (!fallback) return jsonError(400, "Config is required when creating override", "CONFIG_REQUIRED");
      initialConfig = normalizeVisaConfig(fallback) as Prisma.InputJsonValue;
    }

    updated = await prisma.visaConfigOverride.create({
        data: {
          configKey: key,
          config: initialConfig,
          status: parsed.data.status || (fallback ? "PUBLISHED" : "DRAFT"),
          country: parsed.data.country,
          purpose: parsed.data.purpose,
        },
      });
  }

  let normalizedStoredConfig;
  try {
    normalizedStoredConfig = normalizeVisaConfig(updated.config);
  } catch {
    return jsonError(500, "Stored visa config is invalid", "INVALID_STORED_CONFIG");
  }
  const meta = resolveMeta(key, updated);
  return NextResponse.json({ ...updated, ...meta, config: normalizedStoredConfig, source: "OVERRIDE" });
}

export async function DELETE(_req: Request, ctx: { params: { key: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (getSessionRole(session) !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const key = ctx.params.key;
  await prisma.visaConfigOverride.deleteMany({ where: { configKey: key } });
  return NextResponse.json({ ok: true });
}
