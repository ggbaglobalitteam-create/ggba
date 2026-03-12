import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
};

let transporter: { sendMail: (payload: unknown) => Promise<unknown> } | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required email env var: ${name}`);
  }
  return value.trim();
}

function getTransporter() {
  if (transporter) return transporter;

  const host = required("SMTP_HOST");
  const port = Number(required("SMTP_PORT"));
  const user = required("SMTP_USER");
  const pass = required("SMTP_PASS");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter!;
}

export async function sendEmail(payload: MailPayload) {
  const supportEmail = "support@ggbaglobal.com";
  const from = process.env.EMAIL_FROM || supportEmail;
  const replyTo = payload.replyTo || process.env.EMAIL_REPLY_TO || supportEmail;
  const tx = getTransporter();
  await tx.sendMail({
    from,
    replyTo,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    attachments: payload.attachments,
  });
}
