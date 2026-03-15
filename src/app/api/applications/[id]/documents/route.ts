import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { uploadToSupabaseS3 } from "@/lib/storage/supabaseS3";
import { normalizeVisaConfig } from "@/lib/visaConfigSchema";
import { VISA_CONFIGS } from "@/lib/visaConfig";
import { createNotifications } from "@/lib/notifications";
import { sendDocumentsCompletedEmail } from "@/lib/email/authEmails";

const metaSchema = z.object({
  documentId: z.string().min(1),
  name: z.string().min(1).optional(),
});

const DOCS_COMPLETED_AT_KEY = "__documentsCompletedAt";

type RequiredDocument = { id: string; name: string };

type CompletionEmailPayload = {
  recipients: string[];
  applicationId: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  destinationCountry?: string | null;
  purpose?: string | null;
  completedAtIso: string;
  requiredDocuments: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function firstFilled(formData: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = formData[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function isUploadedStatus(status: string) {
  return status === "UPLOADED" || status === "VERIFIED";
}

async function resolveRequiredDocuments(visaConfigKey: string): Promise<RequiredDocument[]> {
  const override = await prisma.visaConfigOverride.findUnique({
    where: { configKey: visaConfigKey },
    select: { status: true, config: true },
  });

  const configSource = override?.status === "PUBLISHED" ? override.config : VISA_CONFIGS[visaConfigKey];
  if (!configSource) return [];

  try {
    const config = normalizeVisaConfig(configSource);
    if (config.flow?.requiresDocuments === false) return [];
    return config.documentsRequired
      .filter((item) => item.required)
      .map((item) => ({ id: item.id, name: item.name || item.id }));
  } catch (error) {
    console.error("Failed to parse visa config while checking document completion", { visaConfigKey, error });
    return [];
  }
}

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
  const app = await prisma.application.findUnique({
    where: { id },
    select: { id: true, applicantId: true, agentId: true, visaConfigKey: true },
  });
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

  const requiredDocuments = await resolveRequiredDocuments(app.visaConfigKey);

  const completion = await prisma.$transaction(async (tx) => {
    const doc = await tx.document.upsert({
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

    if (requiredDocuments.length === 0) return { doc, completionEmail: null as CompletionEmailPayload | null };

    const fullApp = await tx.application.findUnique({
      where: { id },
      select: {
        id: true,
        purpose: true,
        destinationCountry: true,
        status: true,
        formData: true,
        applicant: { select: { firstName: true, lastName: true, email: true, phone: true } },
        agent: { select: { userId: true } },
        documents: { select: { documentId: true, status: true } },
      },
    });
    if (!fullApp) return { doc, completionEmail: null as CompletionEmailPayload | null };

    const formData = asRecord(fullApp.formData);
    if (typeof formData[DOCS_COMPLETED_AT_KEY] === "string") {
      return { doc, completionEmail: null as CompletionEmailPayload | null };
    }

    const complete = requiredDocuments.every((required) =>
      fullApp.documents.some((item) => item.documentId === required.id && isUploadedStatus(item.status))
    );
    if (!complete) return { doc, completionEmail: null as CompletionEmailPayload | null };

    const completedAtIso = new Date().toISOString();
    const nextFormData = { ...formData, [DOCS_COMPLETED_AT_KEY]: completedAtIso } as Prisma.InputJsonValue;

    await tx.application.update({
      where: { id: fullApp.id },
      data: { formData: nextFormData },
    });

    await tx.statusHistory.create({
      data: {
        applicationId: fullApp.id,
        status: fullApp.status,
        note: "All required documents uploaded. Application is ready for admin review.",
        changedByUserId: userId,
        notifiedApplicant: false,
      },
    });

    const admins = await tx.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true, email: true },
    });

    const recipientIds = new Set<string>(admins.map((admin) => admin.id));
    if (fullApp.agent?.userId) recipientIds.add(fullApp.agent.userId);
    recipientIds.delete(userId);

    await createNotifications(
      tx,
      Array.from(recipientIds).map((recipientId) => ({
        userId: recipientId,
        type: "SYSTEM",
        title: "Application documents complete",
        body: `${fullApp.purpose} visa documents for ${fullApp.destinationCountry} are ready for review.`,
        applicationId: fullApp.id,
      }))
    );

    const supportEmail = (process.env.APPLICATION_SUBMISSION_EMAIL || process.env.SUPPORT_EMAIL || "support@ggbaglobal.com").trim().toLowerCase();
    const recipientEmails = new Set<string>(supportEmail ? [supportEmail] : []);
    for (const admin of admins) {
      const email = admin.email.trim().toLowerCase();
      if (email) recipientEmails.add(email);
    }

    const applicantNameFromForm = `${firstFilled(formData, ["firstName"])} ${firstFilled(formData, ["lastName"])}`.trim();
    const fallbackApplicantName = `${fullApp.applicant.firstName || ""} ${fullApp.applicant.lastName || ""}`.trim();

    return {
      doc,
      completionEmail: {
        recipients: Array.from(recipientEmails),
        applicationId: fullApp.id,
        applicantName: applicantNameFromForm || fallbackApplicantName || undefined,
        applicantEmail: firstFilled(formData, ["email"]) || fullApp.applicant.email || undefined,
        applicantPhone: firstFilled(formData, ["phone"]) || fullApp.applicant.phone || undefined,
        destinationCountry: fullApp.destinationCountry,
        purpose: fullApp.purpose,
        completedAtIso,
        requiredDocuments: requiredDocuments.map((item) => item.name),
      } satisfies CompletionEmailPayload,
    };
  });

  if (completion.completionEmail && completion.completionEmail.recipients.length > 0) {
    const emailData = completion.completionEmail;
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.URL || "").replace(/\/+$/, "");
    const adminReviewUrl = baseUrl ? `${baseUrl}/portal/admin/applications/${encodeURIComponent(emailData.applicationId)}` : null;

    await Promise.allSettled(
      emailData.recipients.map((to) =>
        sendDocumentsCompletedEmail({
          to,
          applicationId: emailData.applicationId,
          applicantName: emailData.applicantName,
          applicantEmail: emailData.applicantEmail,
          applicantPhone: emailData.applicantPhone,
          destinationCountry: emailData.destinationCountry,
          purpose: emailData.purpose,
          completedAtIso: emailData.completedAtIso,
          requiredDocuments: emailData.requiredDocuments,
          adminReviewUrl,
        })
      )
    );
  }

  return NextResponse.json(completion.doc, { status: 201 });
}
