/**
 * The email body for a contact-form submission.
 *
 * Server-only: this is imported by the route handler and never reaches the
 * client bundle.
 *
 * Two details that matter more than they look:
 *
 *  • Every interpolated value is HTML-escaped. The message field is arbitrary
 *    text typed by a stranger, and it lands in *your* inbox — unescaped `<`
 *    would at best mangle the layout and at worst inject markup into whatever
 *    renders it.
 *
 *  • Layout is tables with inline styles. Email clients strip <style> blocks,
 *    ignore flexbox and grid, and Outlook still renders through Word. This is
 *    the boring shape that actually survives.
 */

export type ContactSubmission = {
  name: string;
  email: string;
  /** Optional — the row is omitted entirely when blank. */
  phone?: string;
  subject: string;
  message: string;
  submittedAt: Date;
};

const INK = "#14181d";
const MUTED = "#5f6875";
const LINE = "#e3e6ea";
const SIGNAL = "#d8431c"; // Darkened for contrast on white.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const formatTimestamp = (date: Date) =>
  `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;

function row(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding:0 0 4px;font:600 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:${MUTED};">${label}</td>
    </tr>
    <tr>
      <td style="padding:0 0 18px;font:400 16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">${valueHtml}</td>
    </tr>`;
}

export function renderContactEmail(submission: ContactSubmission): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml(submission.name);
  const email = escapeHtml(submission.email);
  const subject = escapeHtml(submission.subject);
  const timestamp = formatTimestamp(submission.submittedAt);

  const rawPhone = submission.phone?.trim() ?? "";
  const phone = escapeHtml(rawPhone);
  // `tel:` needs the punctuation stripped; the display keeps it readable.
  const phoneHref = rawPhone.replace(/[^\d+]/g, "");

  // Preserve the visitor's line breaks without letting their markup through.
  const message = escapeHtml(submission.message).replace(/\r?\n/g, "<br />");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>New contact form submission</title>
  </head>
  <body style="margin:0;padding:24px 12px;background:#f4f5f7;">
    <!-- Preview text shown in the inbox list, hidden in the body. -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${name} — ${subject}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:8px;">
            <tr>
              <td style="padding:28px 28px 0;">
                <div style="height:3px;width:40px;background:${SIGNAL};border-radius:2px;"></div>
                <h1 style="margin:18px 0 4px;font:600 20px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
                  New contact form submission
                </h1>
                <p style="margin:0 0 24px;font:400 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${MUTED};">
                  Sent from your portfolio on ${timestamp}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${row("Name", name)}
                  ${row(
                    "Email",
                    `<a href="mailto:${email}" style="color:${SIGNAL};text-decoration:none;">${email}</a>`
                  )}
                  ${
                    rawPhone
                      ? row(
                          "Phone",
                          `<a href="tel:${phoneHref}" style="color:${SIGNAL};text-decoration:none;">${phone}</a>`
                        )
                      : ""
                  }
                  ${row("Subject", subject)}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 28px 0;">
                <div style="border-top:1px solid ${LINE};padding-top:20px;">
                  <p style="margin:0 0 8px;font:600 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:${MUTED};">
                    Message
                  </p>
                  <div style="font:400 16px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};white-space:normal;">
                    ${message}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 28px 28px;">
                <div style="border-top:1px solid ${LINE};padding-top:16px;">
                  <p style="margin:0;font:400 13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${MUTED};">
                    Hit reply to answer ${name} directly — replies go to
                    <a href="mailto:${email}" style="color:${SIGNAL};text-decoration:none;">${email}</a>.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  // Plain-text alternative. Not decorative: a message with no text part looks
  // like spam to filters, and some clients show nothing without it.
  const text = [
    "New contact form submission",
    `Sent from your portfolio on ${timestamp}`,
    "",
    `Name:    ${submission.name}`,
    `Email:   ${submission.email}`,
    ...(rawPhone ? [`Phone:   ${rawPhone}`] : []),
    `Subject: ${submission.subject}`,
    "",
    "Message:",
    submission.message,
    "",
    `Reply directly to this email to answer ${submission.name} (${submission.email}).`,
  ].join("\n");

  return {
    subject: `Portfolio — ${submission.subject} — ${submission.name}`,
    html,
    text,
  };
}
