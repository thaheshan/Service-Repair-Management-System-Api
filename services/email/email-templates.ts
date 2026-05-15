const ACCENT = "#4F46E5";
const TEXT = "#374151";
const MUTED = "#6b7280";

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(inner: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SRM</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px 28px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
              <div style="font-size:18px;font-weight:700;color:${ACCENT};letter-spacing:-0.02em;">Service Repair Management</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 32px 28px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:${TEXT};font-size:15px;line-height:1.55;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px 28px;border-top:1px solid #e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;color:${MUTED};">
              This message was sent by your repair shop's Service Repair Management system. If you did not expect this email, you can ignore it.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
      <tr>
        <td style="border-radius:8px;background:${ACCENT};">
          <a href="${safeHref}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px 0;font-size:13px;color:${MUTED};word-break:break-all;">Or copy this link:<br><span style="color:${TEXT};">${safeHref}</span></p>`;
}

export function verificationEmailHtml(opts: {
  recipientName: string;
  verifyUrl: string;
  expiryMinutes: number;
}): string {
  const name = escapeHtml(opts.recipientName);
  const inner = `
    <p style="margin:0 0 16px 0;">Hi ${name},</p>
    <p style="margin:0 0 16px 0;">Thanks for registering. Please verify your email address to activate your account.</p>
    ${button("Verify email address", opts.verifyUrl)}
    <p style="margin:16px 0 0 0;font-size:14px;color:${MUTED};">This verification link expires in <strong style="color:${TEXT};">${opts.expiryMinutes} minutes</strong>. After that, request a new verification email from your shop dashboard.</p>
  `;
  return layout(inner.trim());
}

export function verificationEmailText(opts: {
  recipientName: string;
  verifyUrl: string;
  expiryMinutes: number;
}): string {
  return [
    `Hi ${opts.recipientName},`,
    "",
    "Thanks for registering. Verify your email by opening this link:",
    opts.verifyUrl,
    "",
    `This link expires in ${opts.expiryMinutes} minutes.`,
  ].join("\n");
}

export function passwordResetEmailHtml(opts: {
  recipientName: string;
  resetUrl: string;
  expiryMinutes: number;
}): string {
  const name = escapeHtml(opts.recipientName);
  const inner = `
    <p style="margin:0 0 16px 0;">Hi ${name},</p>
    <p style="margin:0 0 16px 0;">We received a request to reset your password. Use the button below to choose a new password.</p>
    ${button("Reset password", opts.resetUrl)}
    <p style="margin:16px 0 0 0;font-size:14px;color:${MUTED};">This reset link expires in <strong style="color:${TEXT};">${opts.expiryMinutes} minutes</strong>. If you did not request a reset, you can safely ignore this email.</p>
  `;
  return layout(inner.trim());
}

export function passwordResetEmailText(opts: {
  recipientName: string;
  resetUrl: string;
  expiryMinutes: number;
}): string {
  return [
    `Hi ${opts.recipientName},`,
    "",
    "Reset your password using this link:",
    opts.resetUrl,
    "",
    `This link expires in ${opts.expiryMinutes} minutes.`,
    "",
    "If you did not request this, ignore this email.",
  ].join("\n");
}

export function customerRequestConfirmationHtml(opts: {
  customerName: string;
  shopName: string;
  summaryRows: { label: string; value: string }[];
}): string {
  const name = escapeHtml(opts.customerName);
  const shop = escapeHtml(opts.shopName);
  const rows = opts.summaryRows
    .filter((r) => r.value.trim().length > 0)
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px;font-weight:600;color:${TEXT};width:36%;vertical-align:top;border-bottom:1px solid #f3f4f6;">${escapeHtml(r.label)}</td><td style="padding:8px 12px;color:${TEXT};border-bottom:1px solid #f3f4f6;">${escapeHtml(r.value)}</td></tr>`
    )
    .join("");

  const inner = `
    <p style="margin:0 0 16px 0;">Hi ${name},</p>
    <p style="margin:0 0 16px 0;"><strong>${shop}</strong> has received your service request and will attend to it shortly.</p>
    ${
      rows
        ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;"><tbody>${rows}</tbody></table>`
        : ""
    }
    <p style="margin:0;font-size:14px;color:${MUTED};">You'll hear from the shop if they need more information. Thank you for choosing ${shop}.</p>
  `;
  return layout(inner.trim());
}

export function customerRequestConfirmationText(opts: {
  customerName: string;
  shopName: string;
  summaryRows: { label: string; value: string }[];
}): string {
  const lines = [
    `Hi ${opts.customerName},`,
    "",
    `${opts.shopName} has received your service request and will attend to it shortly.`,
    "",
  ];
  for (const row of opts.summaryRows) {
    if (row.value.trim()) lines.push(`${row.label}: ${row.value}`);
  }
  lines.push("", "Thank you.");
  return lines.join("\n");
}
