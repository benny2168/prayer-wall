import nodemailer from "nodemailer";
import { prisma } from "./prisma";

const smtpConfig = {
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

const THEME_BG = "#f8fafc";
const THEME_TEXT = "#1e293b";
const DEFAULT_CHERRY = "#881337";

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

async function getSiteTheme() {
  try {
    const settings = await prisma.siteSettings.findFirst();
    const siteUrl = process.env.NEXTAUTH_URL || "";
    let logoUrl = settings?.lightLogoUrl || settings?.darkLogoUrl;
    if (logoUrl && !logoUrl.startsWith("http")) {
      logoUrl = `${siteUrl}${logoUrl}`;
    }
    return {
      primaryColor: settings?.primaryColor || DEFAULT_CHERRY,
      logoUrl: logoUrl,
    };
  } catch (e) {
    return { primaryColor: DEFAULT_CHERRY, logoUrl: null };
  }
}

async function logEmail(type: string, recipient: string, subject: string, error?: string) {
  try {
    await prisma.emailAudit.create({
      data: {
        type,
        recipient,
        subject,
        status: error ? "FAILED" : "SENT",
        error,
      },
    });
  } catch (e) {
    console.error("Failed to log email audit:", e);
  }
}

async function getTemplate(type: string, defaultSubject: string, defaultContent: string) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { type } });
    return {
      subject: template?.subject || defaultSubject,
      content: template?.content || defaultContent,
    };
  } catch (e) {
    return { subject: defaultSubject, content: defaultContent };
  }
}

async function getEmailTemplate(content: string, previewText: string) {
  const { primaryColor, logoUrl } = await getSiteTheme();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${previewText}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${THEME_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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
                    ${content}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px; background-color: #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      Faithfully serving the community
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
      </body>
    </html>
  `;
}

export async function sendSignupConfirmation(toEmail: string, name: string, chainTitle: string, dateStr: string) {
  if (!process.env.SMTP_USER) return;
  const { primaryColor } = await getSiteTheme();
  const template = await getTemplate("SIGNUP", `Commitment Confirmed: ${chainTitle}`, "Thank you for your commitment to standing in the gap for our community.");

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; color: ${primaryColor}; font-size: 20px; font-weight: 700;">Commitment Confirmed</h2>
    <p style="margin: 0 0 16px 0;">Hi ${name},</p>
    <p style="margin: 0 0 24px 0;">${template.content}</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; text-align: center; border-radius: 16px; margin-bottom: 24px;">
      <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">Your Scheduled Time</div>
      <div style="font-size: 18px; font-weight: 700; color: ${primaryColor};">${dateStr}</div>
    </div>
    <p style="margin: 0;">We will send you a reminder 15 minutes before your time slot begins.</p>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Prayer Wall" <noreply@prayer-walls.com>`,
    to: toEmail,
    subject: template.subject,
    html: await getEmailTemplate(htmlContent, "Commitment Confirmed"),
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail("SIGNUP", toEmail, template.subject);
  } catch (error: any) {
    console.error("Failed to send signup confirmation:", error);
    await logEmail("SIGNUP", toEmail, template.subject, error.message);
  }
}

export async function sendPrayedForNotification(toEmail: string, prayerText: string, prayedByName: string = "Someone") {
  if (!process.env.SMTP_USER) return;
  const { primaryColor } = await getSiteTheme();
  const template = await getTemplate("NOTIFICATION", `${prayedByName} just prayed for you!`, "May you feel the peace and strength of being supported by your community today.");

  const finalContent = template.content
    .replace("{{name}}", prayedByName)
    .replace("{{prayer}}", prayerText);

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; color: ${primaryColor}; font-size: 20px; font-weight: 700;">Encouragement for you</h2>
    <p style="margin: 0 0 24px 0;">Hi there, we have some beautiful news. <strong>${prayedByName}</strong> just visited the Prayer Wall and spent time lifting up your request in prayer:</p>
    <div style="background-color: ${primaryColor}10; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0; font-style: italic; color: ${primaryColor};">
      "${prayerText}"
    </div>
    <p style="margin: 0;">${finalContent}</p>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Prayer Wall" <noreply@prayer-walls.com>`,
    to: toEmail,
    subject: template.subject,
    html: await getEmailTemplate(htmlContent, "Someone prayed for you"),
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail("NOTIFICATION", toEmail, template.subject);
  } catch (error: any) {
    console.error("Failed to send prayed for notification:", error);
    await logEmail("NOTIFICATION", toEmail, template.subject, error.message);
  }
}

export async function sendPrayerChainReminder(toEmail: string, name: string, chainTitle: string, timeString: string) {
  if (!process.env.SMTP_USER) return;
  const { primaryColor } = await getSiteTheme();
  const template = await getTemplate("REMINDER", `Reminder: Your upcoming prayer time for ${chainTitle}`, "Thank you for your faithfulness and dedication to prayer.");

  const finalContent = template.content
    .replace("{{name}}", name)
    .replace("{{chain}}", chainTitle)
    .replace("{{time}}", timeString);

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; color: ${primaryColor}; font-size: 20px; font-weight: 700;">Upcoming Prayer Block</h2>
    <p style="margin: 0 0 16px 0;">Hi ${name},</p>
    <p style="margin: 0 0 24px 0;">This is a gentle reminder for the <strong>${chainTitle}</strong>. Your committed time to stand in the gap is approaching:</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
      <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">Scheduled Time</div>
      <div style="font-size: 24px; font-weight: 800; color: ${primaryColor};">${timeString}</div>
    </div>
    <p style="margin: 0;">${finalContent}</p>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Prayer Wall" <noreply@prayer-walls.com>`,
    to: toEmail,
    subject: template.subject,
    html: await getEmailTemplate(htmlContent, "Your prayer reminder"),
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail("REMINDER", toEmail, template.subject);
  } catch (error: any) {
    console.error("Failed to send chain reminder:", error);
    await logEmail("REMINDER", toEmail, template.subject, error.message);
  }
}

export async function sendMemberOtp(toEmail: string, code: string) {
  if (!process.env.SMTP_USER) return;
  const { primaryColor } = await getSiteTheme();
  const template = await getTemplate("OTP", "Your Prayer Wall Login Code", "Use the verification code below to securely access your Prayer Wall account and manage your signups.");

  const htmlContent = `
    <h2 style="margin: 0 0 16px 0; color: ${primaryColor}; font-size: 20px; font-weight: 700;">Your Security Code</h2>
    <p style="margin: 0 0 24px 0;">${template.content}</p>
    <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; padding: 32px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
      <div style="font-size: 48px; font-weight: 800; color: ${primaryColor}; letter-spacing: 12px; font-family: monospace; margin-left: 12px;">${code}</div>
    </div>
    <p style="font-size: 14px; color: #64748b; margin: 0;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Prayer Wall" <noreply@prayer-walls.com>`,
    to: toEmail,
    subject: template.subject,
    html: await getEmailTemplate(htmlContent, "Verification Code"),
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail("OTP", toEmail, template.subject);
  } catch (error: any) {
    console.error("Failed to send OTP email:", error);
    await logEmail("OTP", toEmail, template.subject, error.message);
    throw error;
  }
}
