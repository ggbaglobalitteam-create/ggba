import { sendEmail } from "@/lib/email/smtp";
import { formatApplicationRef } from "@/lib/displayId";

function appName() {
  return process.env.APP_NAME || "GGBA Global";
}

export async function sendVerificationOtpEmail(params: { to: string; firstName?: string | null; otp: string }) {
  const { to, firstName, otp } = params;
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";
  const name = appName();
  await sendEmail({
    to,
    subject: `${name} verification code`,
    text: `${greeting}\n\nYour ${name} verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <p>${greeting}</p>
        <p>Your <strong>${name}</strong> verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">${otp}</p>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendVerificationSuccessEmail(params: { to: string; firstName?: string | null }) {
  const { to, firstName } = params;
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";
  const name = appName();
  await sendEmail({
    to,
    subject: `${name} account verified`,
    text: `${greeting}\n\nYour email has been verified successfully. You can now sign in to your account.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <p>${greeting}</p>
        <p>Your email has been verified successfully.</p>
        <p>You can now sign in to your <strong>${name}</strong> account.</p>
      </div>
    `,
  });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type AppStatusEmailStatus = "PENDING" | "UNDER_REVIEW" | "REQUIRES_INFO" | "APPROVED" | "REJECTED";

function statusLabel(status: AppStatusEmailStatus) {
  return status.replace(/_/g, " ");
}

export async function sendApplicationStatusEmail(params: {
  to: string;
  firstName?: string | null;
  applicationId: string;
  status: AppStatusEmailStatus;
  customSubject?: string | null;
  note?: string | null;
  letterUrl?: string | null;
  letterAttachment?: { filename: string; content: Buffer; contentType?: string };
}) {
  const { to, firstName, applicationId, status, customSubject, note, letterUrl, letterAttachment } = params;
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";
  const name = appName();
  const statusText = statusLabel(status);
  const subjectText = customSubject?.trim() || "";
  const noteText = note?.trim() || "";
  const emailSubject = subjectText || `${name} application update: ${statusText}`;

  const textLines = [
    greeting,
    "",
    `Your application ${applicationId} status has been updated to: ${statusText}.`,
    subjectText ? `Subject: ${subjectText}` : "",
    noteText ? `Note: ${noteText}` : "",
    letterUrl ? `Decision letter: ${letterUrl}` : "",
    "",
    `You can also view this update in your ${name} dashboard notifications.`,
  ].filter(Boolean);

  const safeSubject = subjectText ? escapeHtml(subjectText) : "";
  const safeNote = noteText ? escapeHtml(noteText) : "";
  const safeLetterUrl = letterUrl ? escapeHtml(letterUrl) : "";

  await sendEmail({
    to,
    subject: emailSubject,
    text: textLines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <p>${escapeHtml(greeting)}</p>
        <p>Your application <strong>${escapeHtml(applicationId)}</strong> status is now <strong>${escapeHtml(statusText)}</strong>.</p>
        ${safeSubject ? `<p><strong>Subject:</strong> ${safeSubject}</p>` : ""}
        ${safeNote ? `<p><strong>Note:</strong> ${safeNote}</p>` : ""}
        ${
          safeLetterUrl
            ? `<p><strong>Decision letter:</strong> <a href="${safeLetterUrl}" target="_blank" rel="noreferrer">${safeLetterUrl}</a></p>`
            : ""
        }
        <p>You can also view this update in your ${escapeHtml(name)} dashboard notifications.</p>
      </div>
    `,
    attachments: letterAttachment ? [letterAttachment] : undefined,
  });
}

export async function sendAppointmentBookedEmail(params: {
  to: string;
  firstName?: string | null;
  applicationId: string;
  slotDate: string;
  slotTime: string;
  passportNumber?: string | null;
  nationality?: string | null;
}) {
  const { to, firstName, applicationId, slotDate, slotTime, passportNumber, nationality } = params;
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";
  const name = appName();
  const supportEmail = "support@ggbaglobal.com";
  const passport = passportNumber?.trim() || "N/A";
  const nation = nationality?.trim() || "N/A";
  const displayApplicationId = formatApplicationRef(applicationId);
  const subject = `${name} appointment confirmation (${displayApplicationId})`;

  await sendEmail({
    to,
    subject,
    text: [
      greeting,
      "",
      `Your appointment is confirmed for ${slotDate} at ${slotTime}.`,
      `Application ID: ${displayApplicationId}`,
      `Passport Number: ${passport}`,
      `Nationality: ${nation}`,
      "",
      `For support, contact ${supportEmail}.`,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <p>${escapeHtml(greeting)}</p>
        <p>Your appointment is confirmed for <strong>${escapeHtml(slotDate)}</strong> at <strong>${escapeHtml(slotTime)}</strong>.</p>
        <p><strong>Application ID:</strong> ${escapeHtml(displayApplicationId)}</p>
        <p><strong>Passport Number:</strong> ${escapeHtml(passport)}</p>
        <p><strong>Nationality:</strong> ${escapeHtml(nation)}</p>
        <p>For support, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      </div>
    `,
  });
}
