import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { sendAppointmentBookedEmail } from "@/lib/email/authEmails";
import { sendEmail } from "@/lib/email/smtp";
import { formatApplicationRef } from "@/lib/displayId";
import { createNotifications, listAdminUserIds } from "@/lib/notifications";

const SUBMITTED_AT_KEY = "__submittedAt";

const postSchema = z.object({
  slotId: z.string().trim().min(1),
  slotDate: z.string().trim().min(1),
  slotTime: z.string().trim().min(1),
  slotTitle: z.string().trim().min(1).optional(),
});

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function firstString(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
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
    select: { id: true, applicantId: true, agentId: true },
  });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }
  if (role === "ADMIN") return jsonError(403, "Forbidden", "FORBIDDEN");

  const items = await prisma.appointment.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");
  if (role !== "APPLICANT" && role !== "AGENT") return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const id = ctx.params.id;
  const app = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      visaConfigKey: true,
      applicantId: true,
      agentId: true,
      formData: true,
      applicant: { select: { email: true, firstName: true, lastName: true, phone: true } },
    },
  });
  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const formData = asRecord(app.formData);
  if (typeof formData[SUBMITTED_AT_KEY] !== "string") {
    return jsonError(409, "Submit application form before booking appointment", "FORM_NOT_SUBMITTED");
  }

  const applicantName =
    `${firstString(formData, ["firstName"])} ${firstString(formData, ["lastName"])}`.trim() ||
    `${app.applicant.firstName || ""} ${app.applicant.lastName || ""}`.trim() ||
    "Applicant";
  const applicantEmail = firstString(formData, ["email"]) || app.applicant.email;
  const applicantPhone = firstString(formData, ["phone"]) || app.applicant.phone || "";
  const passportNumber = firstString(formData, ["passportNumber", "passportNo", "passport_number"]);
  const nationality = firstString(formData, ["nationality", "citizenship", "countryOfCitizenship"]);

  try {
    const displayApplicationId = formatApplicationRef(app.id);
    const created = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          applicationId: app.id,
          visaConfigKey: app.visaConfigKey,
          slotId: parsed.data.slotId,
          slotDate: parsed.data.slotDate,
          slotTime: parsed.data.slotTime,
          slotTitle: parsed.data.slotTitle,
          applicantName,
          applicantEmail,
          applicantPhone: applicantPhone || null,
          passportNumber: passportNumber || null,
          nationality: nationality || null,
          confirmationEmail: applicantEmail || null,
        },
      });

      await tx.message.create({
        data: {
          applicationId: app.id,
          senderUserId: userId,
          content: [
            `Appointment booked for ${parsed.data.slotDate} at ${parsed.data.slotTime}.`,
            `Passport: ${passportNumber || "N/A"}.`,
            `Nationality: ${nationality || "N/A"}.`,
            "For support, contact support@ggbaglobal.com.",
          ].join(" "),
          isRead: false,
        },
      });

      const adminIds = await listAdminUserIds(tx);
      const recipientIds = new Set<string>([...adminIds, app.applicantId]);
      if (app.agentId) {
        const assignedAgent = await tx.agent.findUnique({ where: { id: app.agentId }, select: { userId: true } });
        if (assignedAgent?.userId) recipientIds.add(assignedAgent.userId);
      }
      recipientIds.delete(userId);

      await createNotifications(
        tx,
        Array.from(recipientIds).map((recipientId) => ({
          userId: recipientId,
          type: "SYSTEM",
          title: "Appointment booked",
          body: `Booked for ${parsed.data.slotDate} ${parsed.data.slotTime}. Passport: ${passportNumber || "N/A"}, Nationality: ${nationality || "N/A"}.`,
          applicationId: app.id,
        }))
      );

      return appointment;
    });

    if (applicantEmail) {
      try {
        await sendAppointmentBookedEmail({
          to: applicantEmail,
          firstName: app.applicant.firstName,
          applicationId: app.id,
          slotDate: created.slotDate,
          slotTime: created.slotTime,
          passportNumber: created.passportNumber,
          nationality: created.nationality,
        });
      } catch (error) {
        console.error("Failed to send appointment confirmation email to applicant", {
          applicationId: app.id,
          email: applicantEmail,
          error,
        });
      }
    }

    try {
      await sendEmail({
        to: "support@ggbaglobal.com",
        subject: `New appointment booked (${displayApplicationId})`,
        text: [
          `Application ID: ${displayApplicationId}`,
          `Date: ${created.slotDate}`,
          `Time: ${created.slotTime}`,
          `Applicant: ${created.applicantName}`,
          `Email: ${created.applicantEmail}`,
          `Phone: ${created.applicantPhone || "N/A"}`,
          `Passport Number: ${created.passportNumber || "N/A"}`,
          `Nationality: ${created.nationality || "N/A"}`,
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <p><strong>New appointment booked</strong></p>
            <p><strong>Application ID:</strong> ${displayApplicationId}</p>
            <p><strong>Date:</strong> ${created.slotDate}</p>
            <p><strong>Time:</strong> ${created.slotTime}</p>
            <p><strong>Applicant:</strong> ${created.applicantName}</p>
            <p><strong>Email:</strong> ${created.applicantEmail}</p>
            <p><strong>Phone:</strong> ${created.applicantPhone || "N/A"}</p>
            <p><strong>Passport Number:</strong> ${created.passportNumber || "N/A"}</p>
            <p><strong>Nationality:</strong> ${created.nationality || "N/A"}</p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send support appointment email", { applicationId: app.id, error });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(409, "Selected slot is already booked. Please choose another slot.", "SLOT_UNAVAILABLE");
    }
    throw error;
  }
}
