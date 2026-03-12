import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendVerificationSuccessEmail } from "@/lib/email/authEmails";

const bodySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

function jsonError(status: number, error: string, code?: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const otp = parsed.data.otp;
  const email = parsed.data.email.trim().toLowerCase();

  const token = await prisma.verificationToken.findUnique({
    where: { token: otp },
  });

  if (!token || token.identifier !== email) {
    return jsonError(400, "Invalid OTP", "INVALID_OTP");
  }
  if (token.expires < new Date()) {
    return jsonError(400, "OTP expired", "OTP_EXPIRED");
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
      select: { email: true, firstName: true },
    }),
    prisma.verificationToken.delete({
      where: { token: otp },
    }),
  ]);

  try {
    await sendVerificationSuccessEmail({
      to: user.email,
      firstName: user.firstName,
    });
  } catch (error) {
    console.error("Failed to send verification success email", { email, error });
  }

  return NextResponse.json({ ok: true });
}
