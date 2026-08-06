import "server-only";

/**
 * Minimal inline-styled HTML wrapper for transactional emails.
 * No external fonts/stylesheets — email clients strip most of them anyway,
 * and inline styles keep rendering consistent across webmail clients.
 */
export type BaseEmailInput = {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderBaseEmail(input: BaseEmailInput): string {
  const { preheader, heading, bodyHtml, ctaLabel, ctaUrl, footerNote } = input;

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f1eb;font-family:Arial,Helvetica,sans-serif;color:#2b2621;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1eb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#2b2621;padding:20px 28px;">
                <span style="color:#e9c98b;font-size:16px;font-weight:bold;letter-spacing:0.02em;">EasyWedd Pro</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.3;color:#2b2621;">${escapeHtml(heading)}</h1>
                <div style="font-size:14px;line-height:1.6;color:#3d362e;">${bodyHtml}</div>
                ${
                  ctaLabel && ctaUrl
                    ? `<div style="margin-top:24px;">
                        <a href="${ctaUrl}" style="display:inline-block;background-color:#2b2621;color:#e9c98b;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">${escapeHtml(ctaLabel)}</a>
                      </div>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#8a8177;">
                  ${footerNote ? escapeHtml(footerNote) : "Acest email a fost trimis automat de EasyWedd Pro."}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
