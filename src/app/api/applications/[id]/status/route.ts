import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { uploadToSupabaseS3 } from "@/lib/storage/supabaseS3";
import { sendApplicationStatusEmail } from "@/lib/email/authEmails";
import { createNotifications, listAdminUserIds } from "@/lib/notifications";

const bodySchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "REQUIRES_INFO", "APPROVED", "REJECTED"]),
  subject: z.string().optional(),
  note: z.string().optional(),
  notifyApplicant: z.boolean().optional().default(false),
});

type ParsedPayload = {
  status: "PENDING" | "UNDER_REVIEW" | "REQUIRES_INFO" | "APPROVED" | "REJECTED";
  subject?: string;
  note?: string;
  notifyApplicant: boolean;
  decisionLetterFile?: File | null;
};

async function parsePayload(req: Request): Promise<ParsedPayload | null> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return null;

    const raw = {
      status: String(form.get("status") || ""),
      subject: form.get("subject") ? String(form.get("subject")) : undefined,
      note: form.get("note") ? String(form.get("note")) : undefined,
      notifyApplicant: String(form.get("notifyApplicant") || "").toLowerCase() === "true",
    };
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return null;

    const file = form.get("decisionLetter");
    return {
      ...parsed.data,
      decisionLetterFile: file instanceof File ? file : null,
    };
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return null;
  return { ...parsed.data, decisionLetterFile: null };
}

function cleanFileName(value: string) {
  return value.replace(/[^\w.\-]+/g, "_");
}

function statusLabel(status: ParsedPayload["status"]) {
  return status.replace(/_/g, " ");
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "ADMIN" && role !== "AGENT") return jsonError(403, "Forbidden", "FORBIDDEN");

  const parsed = await parsePayload(req);
  if (!parsed) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const id = ctx.params.id;
  const { status, subject, note, notifyApplicant, decisionLetterFile } = parsed;

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      applicant: { select: { email: true, firstName: true } },
    },
  });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  if (decisionLetterFile) {
    const maxBytes = 10 * 1024 * 1024;
    if (decisionLetterFile.size > maxBytes) {
      return jsonError(400, "Decision letter exceeds 10MB limit", "VALIDATION_ERROR");
    }

    const contentType = (decisionLetterFile.type || "").toLowerCase();
    const fileName = (decisionLetterFile.name || "").toLowerCase();
    const isPdf = contentType === "application/pdf" || fileName.endsWith(".pdf");
    if (!isPdf) {
      return jsonError(400, "Decision letter must be a PDF", "VALIDATION_ERROR");
    }
  }

  let letterUrl: string | null = null;
  let emailAttachment: { filename: string; content: Buffer; contentType?: string } | undefined;

  if (decisionLetterFile) {
    const safeName = cleanFileName(decisionLetterFile.name || `decision_${Date.now()}.pdf`);
    const objectPath = `applications/${id}/decision-letters/${status.toLowerCase()}_${Date.now()}_${safeName}`;

    try {
      const uploaded = await uploadToSupabaseS3({ objectPath, file: decisionLetterFile });
      letterUrl = uploaded.publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown storage error";
      console.error("Decision letter upload failed", { applicationId: id, message, error });
      if (message.includes("bucket")) {
        return jsonError(500, message, "STORAGE_BUCKET_NOT_FOUND");
      }
      return jsonError(500, "Failed to upload decision letter", "STORAGE_UPLOAD_FAILED");
    }

    try {
      emailAttachment = {
        filename: safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`,
        content: Buffer.from(await decisionLetterFile.arrayBuffer()),
        contentType: "application/pdf",
      };
    } catch {
      // If file buffer conversion fails, status update should still proceed without attachment.
      emailAttachment = undefined;
    }
  }

  const trimmedSubject = subject?.trim();
  const trimmedNote = note?.trim();
  const noteWithLetter = [
    trimmedSubject ? `Subject: ${trimmedSubject}` : null,
    trimmedNote,
    letterUrl ? `Decision letter: ${letterUrl}` : null,
  ]
    .filter((item): item is string => Boolean(item))
    .join("\n\n");
  const finalNote = noteWithLetter || undefined;
  const statusText = statusLabel(status);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApp = await tx.application.update({
      where: { id },
      data: { status },
    });

    await tx.statusHistory.create({
      data: {
        applicationId: id,
        status,
        note: finalNote,
        changedByUserId: userId,
        notifiedApplicant: notifyApplicant,
      },
    });

    if (notifyApplicant) {
      await tx.message.create({
        data: {
          applicationId: id,
          senderUserId: userId,
          content: finalNote
            ? `Status updated to ${statusText}: ${finalNote}`
            : `Status updated to ${statusText}.`,
          isRead: false,
        },
      });
    }

    const adminUserIds = await listAdminUserIds(tx);
    const recipientIds = new Set<string>([...adminUserIds, app.applicantId]);
    if (app.agentId) {
      const agent = await tx.agent.findUnique({ where: { id: app.agentId }, select: { userId: true } });
      if (agent?.userId) recipientIds.add(agent.userId);
    }
    recipientIds.delete(userId);

    await createNotifications(
      tx,
      Array.from(recipientIds).map((recipientId) => ({
        userId: recipientId,
        type: "APPLICATION_STATUS_CHANGED",
        title: `Application status updated: ${statusText}`,
        body: finalNote || `Application ${id} was updated to ${statusText}.`,
        applicationId: id,
      }))
    );

    return updatedApp;
  });

  if (notifyApplicant && app.applicant?.email) {
    try {
      await sendApplicationStatusEmail({
        to: app.applicant.email,
        firstName: app.applicant.firstName,
        applicationId: id,
        status,
        customSubject: trimmedSubject,
        note: trimmedNote,
        letterUrl,
        letterAttachment: emailAttachment,
      });
    } catch (error) {
      console.error("Failed to send status update email", {
        applicationId: id,
        email: app.applicant.email,
        error,
      });
    }
  }

  return NextResponse.json(updated);
}
