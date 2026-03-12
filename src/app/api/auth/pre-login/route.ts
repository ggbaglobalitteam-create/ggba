import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendVerificationOtpEmail } from "@/lib/email/authEmails";

const bodySchema = z.object({
  identifier: z.string().min(3),
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

  const identifier = parsed.data.identifier.trim();
  const isEmail = identifier.includes("@");
  const normalizedEmail = identifier.toLowerCase();

  const user = isEmail
    ? await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { email: true, firstName: true, role: true, emailVerified: true, suspended: true },
      })
    : await prisma.user.findFirst({
        where: { phone: identifier },
        select: { email: true, firstName: true, role: true, emailVerified: true, suspended: true },
      });

  if (!user || user.suspended) {
    return NextResponse.json({ requiresVerification: false });
  }

  if (user.emailVerified || user.role === "ADMIN") {
    return NextResponse.json({ requiresVerification: false });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
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
    console.error("Failed to send pre-login verification OTP email", { identifier, email: user.email, error });
    return jsonError(500, "Could not send verification email", "EMAIL_SEND_FAILED");
  }

  return NextResponse.json({
    requiresVerification: true,
    email: user.email,
    role: String(user.role || "").toLowerCase(),
    otp: process.env.NODE_ENV === "development" ? otp : undefined,
  });
}
