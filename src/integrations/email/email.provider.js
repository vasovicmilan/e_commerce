// integrations/email/email.provider.js
import nodemailer from "nodemailer";
import { logInfo, logError } from "../../utils/logger.util.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === "production") {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "ethereal-user",
        pass: process.env.SMTP_PASS || "ethereal-pass",
      },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, attachments = [] }) {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "TopHelanke"}" <${process.env.EMAIL_FROM || "noreply@tophelanke.com"}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === "development") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logInfo(`[EMAIL] Preview URL: ${previewUrl || 'N/A'}`);
    }

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    logError(`[EMAIL] Failed to send email to ${to}`, error);
    throw error;
  }
}