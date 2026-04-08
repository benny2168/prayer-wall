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
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Header / Logo -->
      <div style="padding: 40px 40px 20px; text-align: center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height: 60px; width: auto; margin-bottom: 24px;" />` : ""}
        <h1 style="color: ${primaryColor}; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">${title}</h1>
      </div>

      <!-- Main Body -->
      <div style="padding: 20px 40px 40px;">
        <p style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</p>
        <div style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 32px;">
          ${content}
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; font-weight: 500; color: #94a3b8; margin: 0;">${footerText}</p>
        <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px;">&copy; ${new Date().getFullYear()} Prayer Wall Platform</p>
      </div>
    </div>
  `;
}
