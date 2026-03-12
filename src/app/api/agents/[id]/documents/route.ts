import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { uploadToSupabaseS3 } from "@/lib/storage/supabaseS3";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/jpg"]);

const metaSchema = z.object({
  type: z.enum(["BUSINESS_REGISTRATION", "TAX_PAN", "IDENTITY_DOCUMENT"]),
  label: z.string().trim().min(1),
});

const patchSchema = z.object({
  type: z.enum(["BUSINESS_REGISTRATION", "TAX_PAN", "IDENTITY_DOCUMENT"]),
  status: z.enum(["PENDING", "UPLOADED", "VERIFIED", "REJECTED"]),
});

async function findAgent(id: string) {
  return (
    (await prisma.agent.findUnique({ where: { id }, select: { id: true, userId: true } })) ??
    (await prisma.agent.findUnique({ where: { userId: id }, select: { id: true, userId: true } }))
  );
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "AGENT" && role !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const agent = await findAgent(ctx.params.id);
  if (!agent) return jsonError(404, "Agent not found", "NOT_FOUND");
  if (role === "AGENT" && agent.userId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");

  const items = await prisma.agentDocument.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "AGENT" && role !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const agent = await findAgent(ctx.params.id);
  if (!agent) return jsonError(404, "Agent not found", "NOT_FOUND");
  if (role === "AGENT" && agent.userId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError(400, "Invalid form data", "VALIDATION_ERROR");

  const type = String(form.get("type") || "");
  const label = String(form.get("label") || "");
  const file = form.get("file");
  const parsed = metaSchema.safeParse({ type, label });
  if (!parsed.success) return jsonError(400, "Invalid form data", "VALIDATION_ERROR");
  if (!(file instanceof File)) return jsonError(400, "Missing file", "VALIDATION_ERROR");
  if (file.size > 5 * 1024 * 1024) return jsonError(400, "File exceeds 5MB limit", "VALIDATION_ERROR");
  if (file.type && !allowedTypes.has(file.type)) return jsonError(400, "Invalid file type", "VALIDATION_ERROR");

  const existing = await prisma.agentDocument.findUnique({
    where: { agentId_type: { agentId: agent.id, type: parsed.data.type } },
  });
  if (role === "AGENT" && existing && existing.status !== "REJECTED") {
    return jsonError(
      409,
      "This document is locked after submission. You can upload a revised file only if admin rejects it.",
      "DOCUMENT_LOCKED"
    );
  }

  const safeFileName = file.name.replace(/[^\w.\-]+/g, "_");
  const objectPath = `agents/${agent.id}/verification/${parsed.data.type}/${Date.now()}_${safeFileName}`;

  let publicUrl: string | null = null;
  try {
    const uploaded = await uploadToSupabaseS3({ objectPath, file });
    publicUrl = uploaded.publicUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage error";
    console.error("Agent document upload failed", { agentId: agent.id, type: parsed.data.type, message, error });
    if (message.includes("bucket")) return jsonError(500, message, "STORAGE_BUCKET_NOT_FOUND");
    return jsonError(500, "Failed to upload file", "STORAGE_UPLOAD_FAILED");
  }

  if (!publicUrl) return jsonError(500, "Upload URL generation failed", "STORAGE_UPLOAD_FAILED");

  const doc = await prisma.agentDocument.upsert({
    where: { agentId_type: { agentId: agent.id, type: parsed.data.type } },
    create: {
      agentId: agent.id,
      type: parsed.data.type,
      label: parsed.data.label,
      fileName: file.name,
      fileUrl: publicUrl,
      status: "UPLOADED",
    },
    update: {
      label: parsed.data.label,
      fileName: file.name,
      fileUrl: publicUrl,
      status: "UPLOADED",
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const agent = await findAgent(ctx.params.id);
  if (!agent) return jsonError(404, "Agent not found", "NOT_FOUND");

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const updated = await prisma.agentDocument.update({
    where: { agentId_type: { agentId: agent.id, type: parsed.data.type } },
    data: { status: parsed.data.status },
  }).catch(() => null);

  if (!updated) return jsonError(404, "Agent document not found", "NOT_FOUND");

  return NextResponse.json(updated);
}
