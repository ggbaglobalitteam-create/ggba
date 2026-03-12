import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";

const SUBMITTED_AT_KEY = "__submittedAt";

const bodySchema = z.object({
  currentStep: z.number().int().min(0),
  stepData: z.record(z.string(), z.unknown()),
});

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!userId || (role !== "APPLICANT" && role !== "AGENT")) return jsonError(403, "Forbidden", "FORBIDDEN");

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "Invalid request body", "VALIDATION_ERROR");

  const { currentStep, stepData } = parsed.data;
  const id = ctx.params.id;

  const existing = await prisma.application.findUnique({
    where: { id },
    select: { id: true, applicantId: true, agentId: true, formData: true },
  });
  if (!existing) return jsonError(404, "Not found", "NOT_FOUND");
  if (role === "APPLICANT" && existing.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || existing.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const existingData =
    existing.formData && typeof existing.formData === "object"
      ? (existing.formData as Record<string, unknown>)
      : {};
  if (typeof existingData[SUBMITTED_AT_KEY] === "string") {
    return jsonError(409, "Submitted applications cannot be edited", "FORM_LOCKED");
  }
  const merged = { ...existingData, ...stepData, currentStep } as Record<string, unknown>;

  const updated = await prisma.application.update({
    where: { id },
    data: { formData: merged as Prisma.InputJsonValue },
  });

  // Agent flow keeps applicant as a placeholder user initially; sync profile fields as they are entered.
  if (role === "AGENT") {
    const firstNameRaw = merged["firstName"];
    const lastNameRaw = merged["lastName"];
    const emailRaw = merged["email"];
    const phoneRaw = merged["phone"];

    const firstName = typeof firstNameRaw === "string" ? firstNameRaw.trim() : "";
    const lastName = typeof lastNameRaw === "string" ? lastNameRaw.trim() : "";
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";

    const applicantUpdate: { firstName?: string; lastName?: string; email?: string; phone?: string | null } = {};
    if (firstName) applicantUpdate.firstName = firstName;
    if (lastName) applicantUpdate.lastName = lastName;
    if (email) applicantUpdate.email = email;
    if (phone) applicantUpdate.phone = phone;

    if (Object.keys(applicantUpdate).length > 0) {
      try {
        await prisma.user.update({
          where: { id: existing.applicantId },
          data: applicantUpdate,
        });
      } catch (error) {
        // Duplicate email should not block form progress for agents.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error;
        }
        if (applicantUpdate.email) {
          const withoutEmail = { ...applicantUpdate };
          delete withoutEmail.email;
          if (Object.keys(withoutEmail).length > 0) {
            await prisma.user.update({
              where: { id: existing.applicantId },
              data: withoutEmail,
            });
          }
        }
      }
    }
  }

  return NextResponse.json(updated);
}
