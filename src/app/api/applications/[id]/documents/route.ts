import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { uploadToSupabaseS3 } from "@/lib/storage/supabaseS3";

const metaSchema = z.object({
  documentId: z.string().min(1),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "APPLICANT" && role !== "AGENT" && role !== "ADMIN") {
    return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const id = ctx.params.id;
  const app = await prisma.application.findUnique({ where: { id }, select: { id: true, applicantId: true, agentId: true } });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError(400, "Invalid form data", "VALIDATION_ERROR");

  const documentId = String(form.get("documentId") || "");
  const name = form.get("name") ? String(form.get("name")) : undefined;
  const file = form.get("file");

  const parsed = metaSchema.safeParse({ documentId, name });
  if (!parsed.success) return jsonError(400, "Invalid form data", "VALIDATION_ERROR");

  if (!(file instanceof File)) return jsonError(400, "Missing file", "VALIDATION_ERROR");
  if (file.size > 5 * 1024 * 1024) return jsonError(400, "File exceeds 5MB limit", "VALIDATION_ERROR");

  const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/jpg"]);
  if (file.type && !allowedTypes.has(file.type)) {
    return jsonError(400, "Invalid file type", "VALIDATION_ERROR");
  }

  const safeDocId = parsed.data.documentId.replace(/[^\w.\-]+/g, "_");
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const objectPath = `applications/${id}/${safeDocId}/${Date.now()}_${safeName}`;

  let fileUrl: string | null = null;
  try {
    const uploaded = await uploadToSupabaseS3({ objectPath, file });
    fileUrl = uploaded.publicUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage error";
    console.error("Document upload failed", { applicationId: id, documentId: parsed.data.documentId, message, error });
    if (message.includes("bucket")) {
      return jsonError(500, message, "STORAGE_BUCKET_NOT_FOUND");
    }
    return jsonError(500, "Failed to upload file", "STORAGE_UPLOAD_FAILED");
  }

  const doc = await prisma.document.upsert({
    where: { applicationId_documentId: { applicationId: id, documentId: parsed.data.documentId } },
    create: {
      applicationId: id,
      documentId: parsed.data.documentId,
      name: parsed.data.name || parsed.data.documentId,
      status: "UPLOADED",
      fileUrl,
    },
    update: {
      name: parsed.data.name || undefined,
      status: "UPLOADED",
      fileUrl,
      verificationNote: null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
