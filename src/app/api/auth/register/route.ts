import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendVerificationOtpEmail } from "@/lib/email/authEmails";

const EMAIL_EXISTS_MESSAGE =
  "This email address is already in use or registered. Please sign-in with your login credentials. If unable, contact support!";

const bodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["applicant", "agent"]).default("applicant"),
  phone: z.string().min(3).optional(),
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

  const { firstName, lastName, password, role, phone } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonError(409, EMAIL_EXISTS_MESSAGE, "EMAIL_EXISTS");

  const hashed = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      password: hashed,
      role: role === "agent" ? "AGENT" : "APPLICANT",
      agent:
        role === "agent"
          ? {
              create: {
                status: "PENDING",
              },
            }
          : undefined,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  // Generate OTP and store in VerificationToken for 10 minutes.
  // In production you would send this OTP via email/SMS.
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
      to: email,
      firstName,
      otp,
    });
  } catch (error) {
    console.error("Failed to send verification OTP email", { email, error });
    return jsonError(500, "Could not send verification email", "EMAIL_SEND_FAILED");
  }

  return NextResponse.json(
    {
      user: created,
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    },
    { status: 201 }
  );
}
