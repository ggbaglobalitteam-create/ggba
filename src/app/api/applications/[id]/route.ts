import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { getVisaConfigKey } from "@/lib/visaConfig";
import { uploadToSupabaseS3 } from "@/lib/storage/supabaseS3";
import { createApplicationPdf } from "@/lib/pdf/applicationPdf";
import { createNotifications, listAdminUserIds } from "@/lib/notifications";

const SUBMITTED_AT_KEY = "__submittedAt";

const patchSchema = z.object({
  action: z.enum(["SUBMIT"]).optional(),
  purpose: z.string().trim().min(1).optional(),
  destinationCountry: z.string().trim().min(1).optional(),
  configKey: z.string().trim().min(1).optional(),
  resetForm: z.boolean().optional(),
});

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isSubmitted(formData: unknown): boolean {
  const data = asRecord(formData);
  return typeof data[SUBMITTED_AT_KEY] === "string";
}

function cleanFileName(value: string) {
  return value.replace(/[^\w.\-]+/g, "_");
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const id = ctx.params.id;

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      documents: true,
      payments: true,
      appointments: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      applicant: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      agent: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
    },
  });

  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  return NextResponse.json(app);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "APPLICANT" && role !== "AGENT") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const id = ctx.params.id;
  const existing = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      applicantId: true,
      agentId: true,
      formData: true,
      status: true,
      purpose: true,
      destinationCountry: true,
      visaConfigKey: true,
    },
  });
  if (!existing) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && existing.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || existing.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const currentFormData = asRecord(existing.formData);
  const alreadySubmitted = isSubmitted(existing.formData);

  if (parsed.data.action === "SUBMIT") {
    if (alreadySubmitted) return NextResponse.json(existing);

    const submittedAt = new Date().toISOString();
    const nextFormData = { ...currentFormData, [SUBMITTED_AT_KEY]: submittedAt } as Prisma.InputJsonValue;
    const note =
      role === "AGENT"
        ? "Application submitted by agent."
        : "Application submitted by applicant.";

    const pdfBuffer = createApplicationPdf({
      applicationId: existing.id,
      purpose: existing.purpose,
      destinationCountry: existing.destinationCountry,
      submittedAtIso: submittedAt,
      formData: nextFormData,
    });
    const safeFileName = cleanFileName(`application_${existing.id}_submitted_form.pdf`);
    const objectPath = `applications/${existing.id}/submitted-form/${Date.now()}_${safeFileName}`;
    const generatedPdfBytes = new Uint8Array(pdfBuffer);
    const generatedPdfFile = new File([generatedPdfBytes], safeFileName, { type: "application/pdf" });

    let uploadedPdfUrl: string | null = null;
    try {
      const uploaded = await uploadToSupabaseS3({
        objectPath,
        file: generatedPdfFile,
      });
      uploadedPdfUrl = uploaded.publicUrl;
    } catch (error) {
      // Submission should not be blocked by optional storage/PDF setup issues.
      console.error("Submitted form PDF upload failed", { applicationId: existing.id, error });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: existing.id },
        data: { formData: nextFormData },
      });
      await tx.statusHistory.create({
        data: {
          applicationId: existing.id,
          status: existing.status,
          note,
          changedByUserId: userId,
          notifiedApplicant: false,
        },
      });

      await tx.document.upsert({
        where: {
          applicationId_documentId: {
            applicationId: existing.id,
            documentId: "submitted-form-pdf",
          },
        },
        update: {
          name: "Submitted Application Form (PDF)",
          status: "VERIFIED",
          fileUrl: uploadedPdfUrl,
          verificationNote: uploadedPdfUrl
            ? "Auto-generated at submission time."
            : "Submission completed, but PDF upload failed during generation.",
        },
        create: {
          applicationId: existing.id,
          documentId: "submitted-form-pdf",
          name: "Submitted Application Form (PDF)",
          status: "VERIFIED",
          fileUrl: uploadedPdfUrl,
          verificationNote: uploadedPdfUrl
            ? "Auto-generated at submission time."
            : "Submission completed, but PDF upload failed during generation.",
        },
      });

      const adminUserIds = await listAdminUserIds(tx);
      const recipients = new Set<string>(adminUserIds);
      if (existing.agentId) {
        const agent = await tx.agent.findUnique({
          where: { id: existing.agentId },
          select: { userId: true },
        });
        if (agent?.userId) recipients.add(agent.userId);
      }
      recipients.delete(userId);
      await createNotifications(
        tx,
        Array.from(recipients).map((recipientId) => ({
          userId: recipientId,
          type: "APPLICATION_SUBMITTED",
          title: "New application submitted",
          body: `${existing.purpose} visa for ${existing.destinationCountry} is ready for review.`,
          applicationId: existing.id,
        }))
      );

      return app;
    });

    return NextResponse.json(updated);
  }

  const hasGatewayUpdate =
    parsed.data.purpose !== undefined ||
    parsed.data.destinationCountry !== undefined ||
    parsed.data.configKey !== undefined ||
    parsed.data.resetForm !== undefined;

  if (!hasGatewayUpdate) {
    return jsonError(400, "No updates provided", "VALIDATION_ERROR");
  }

  if (alreadySubmitted) {
    return jsonError(409, "Submitted applications cannot be edited", "FORM_LOCKED");
  }

  const finalPurpose = parsed.data.purpose?.trim() ?? existing.purpose;
  const finalCountry = parsed.data.destinationCountry?.trim() ?? existing.destinationCountry;
  const finalConfigKey =
    parsed.data.configKey?.trim() || getVisaConfigKey(finalPurpose, finalCountry);

  const updated = await prisma.application.update({
    where: { id: existing.id },
    data: {
      purpose: finalPurpose,
      destinationCountry: finalCountry,
      visaConfigKey: finalConfigKey,
      ...(parsed.data.resetForm ? { formData: {} as Prisma.InputJsonValue } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "APPLICANT" && role !== "AGENT" && role !== "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const id = ctx.params.id;
  const existing = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      applicantId: true,
      agentId: true,
      formData: true,
      status: true,
    },
  });
  if (!existing) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && existing.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || existing.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  if (isSubmitted(existing.formData)) {
    if (role !== "ADMIN") {
      return jsonError(409, "Submitted applications cannot be cancelled", "CANCEL_LOCKED");
    }
    if (existing.status !== "REJECTED") {
      return jsonError(
        409,
        "Only discarded/rejected submitted applications can be removed by admin",
        "APPLICATION_IN_USE"
      );
    }
  }

  await prisma.application.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}
