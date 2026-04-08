export function formatInTimezone(date: Date, timezone: string = "UTC") {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short"
  }).format(date);
}

const THEME_BG = "#f8fafc";
const THEME_TEXT = "#1e293b";

export function generateThemedEmail({
  title,
  name,
  content,
  logoUrl,
  primaryColor,
  footerText
}: {
  title: string;
  name: string;
  content: string;
  logoUrl?: string | null;
  primaryColor: string;
  footerText: string;
}) {
  return `
    <div style="margin: 0; padding: 0; background-color: ${THEME_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${THEME_BG};">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 20px 40px;">
                  ${logoUrl ? `
                    <img src="${logoUrl}" alt="Logo" style="height: 64px; width: auto; margin-bottom: 24px;" />
                  ` : `
                    <div style="background-color: ${primaryColor}; width: 64px; height: 64px; border-radius: 16px; display: inline-block; text-align: center; line-height: 64px; margin-bottom: 24px;">
                      <span style="font-size: 32px; vertical-align: middle;">🙏</span>
                    </div>
                  `}
                  <h1 style="margin: 0; color: ${THEME_TEXT}; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; font-family: serif; text-transform: uppercase;">THE PRAYER WALL</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px 40px; color: ${THEME_TEXT}; line-height: 1.6; font-size: 16px;">
                  <p style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</p>
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 32px; background-color: #f1f5f9; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                    ${footerText}
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">
              &copy; ${new Date().getFullYear()} MTCD Tech Initiative. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}
