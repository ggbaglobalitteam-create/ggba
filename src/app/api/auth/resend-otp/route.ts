import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendVerificationOtpEmail } from "@/lib/email/authEmails";

const bodySchema = z.object({
  email: z.string().email(),
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

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, firstName: true, emailVerified: true },
  });

  if (!user) return jsonError(404, "Account not found", "NOT_FOUND");
  if (user.emailVerified) return jsonError(400, "Account is already verified", "ALREADY_VERIFIED");

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: otp,
      expires,
    },
  });

  try {
    await sendVerificationOtpEmail({
      to: user.email,
      firstName: user.firstName,
      otp,
    });
  } catch (error) {
    console.error("Failed to resend verification OTP email", { email, error });
    return jsonError(500, "Could not send verification email", "EMAIL_SEND_FAILED");
  }

  return NextResponse.json({
    ok: true,
    otp: process.env.NODE_ENV === "development" ? otp : undefined,
  });
}
