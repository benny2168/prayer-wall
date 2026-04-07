import nodemailer from "nodemailer";

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

export async function sendPrayedForNotification(toEmail: string, prayerText: string, prayedByName: string = "Someone") {
  if (!process.env.SMTP_USER) {
    console.warn("SMTP credentials missing. Skipping email.");
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Prayer Wall" <noreply@prayer-walls.com>`,
    to: toEmail,
    subject: `${prayedByName} just prayed for you!`,
    html: `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #6366f1;">${prayedByName} prayed for your request</h2>
        <p>This is a notification to let you know that a member of the community just lifted up your prayer request:</p>
        <blockquote style="background: #f8fafc; padding: 16px; border-left: 4px solid #818cf8; margin: 20px 0; font-style: italic;">
          "${prayerText}"
        </blockquote>
        <p>May you feel encouraged and strengthened by this support.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send prayed for notification:", error);
  }
}

export async function sendPrayerChainReminder(toEmail: string, name: string, chainTitle: string, timeString: string) {
  if (!process.env.SMTP_USER) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Prayer Wall" <noreply@prayer-walls.com>`,
    to: toEmail,
    subject: `Reminder: Your upcoming prayer time for ${chainTitle}`,
    html: `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #6366f1;">Reminder to Pray</h2>
        <p>Hi ${name},</p>
        <p>Thank you for committing to pray during the <strong>${chainTitle}</strong> chain.</p>
        <p>This is a reminder that your scheduled block begins at: <strong style="color: #0284c7;">${timeString}</strong>.</p>
        <p>Thank you for your faithfulness!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send chain reminder:", error);
  }
}

export async function sendMemberOtp(toEmail: string, code: string) {
  if (!process.env.SMTP_USER) {
    console.warn("SMTP credentials missing. Skipping OTP email.");
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Prayer Wall" <noreply@prayer-walls.com>`,
    to: toEmail,
    subject: "Your Prayer Wall Login Code",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #6366f1;">Your Login Code</h2>
        <p>Use the following 6-digit code to access your Prayer Wall signups:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px; background: #f8fafc; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
          ${code}
        </div>
        <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes. If you didn&apos;t request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw error;
  }
}
