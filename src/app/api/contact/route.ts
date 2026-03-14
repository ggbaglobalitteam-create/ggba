import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/api/routeUtils";
import { sendEmail } from "@/lib/email/smtp";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(1).max(50),
  message: z.string().trim().max(5000).optional().default(""),
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    return jsonError(400, "Please fill in all required contact fields.", "VALIDATION_ERROR");
  }

  const { name, email, phone, message } = parsed.data;
  const supportEmail = "support@ggbaglobal.com";
  const safeMessage = message || "No message provided.";

  try {
    await sendEmail({
      to: supportEmail,
      subject: `New contact form submission from ${name}`,
      replyTo: email,
      text: [
        "New contact form submission",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Message: ${safeMessage}`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <p><strong>New contact form submission</strong></p>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Message:</strong><br />${escapeHtml(safeMessage).replace(/\n/g, "<br />")}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send contact form email", { error, email });
    return jsonError(500, "Unable to send your message right now.", "EMAIL_SEND_FAILED");
  }
}
