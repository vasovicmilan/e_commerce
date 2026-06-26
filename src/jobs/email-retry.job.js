import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as emailService from "../services/email.service.js";
import * as couponService from "../services/coupon.service.js";
import { logInfo, logError } from "../utils/logger.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAILED_EMAILS_LOG = path.join(__dirname, "..", "logs", "failed-emails.json");

const RETRY_HANDLERS = {
  welcome_coupon: async (data) => {
    const coupon = await couponService.getCouponByCode("WELCOME10");
    if (coupon) {
      const couponData = coupon.toObject ? coupon.toObject() : coupon;
      await emailService.sendWelcomeEmailWithCoupon(
        { email: data.email, firstName: data.firstName },
        couponData
      );
    }
  },
  account_confirmation: async (data) => {
    await emailService.sendAccountConfirmationEmail(
      { email: data.email, firstName: data.firstName },
      data.confirmToken
    );
  },
  password_reset: async (data) => {
    await emailService.sendPasswordResetEmail(
      { email: data.email, firstName: data.firstName },
      data.resetToken
    );
  },
  password_changed: async (data) => {
    await emailService.sendPasswordChangedEmail({ email: data.email, firstName: data.firstName });
  },
  account_deactivated: async (data) => {
    await emailService.sendAccountDeactivatedEmail({ email: data.email, firstName: data.firstName });
  },
  migration_confirmation: async (data) => {
    await emailService.sendAccountConfirmationEmail(
      { email: data.email, firstName: data.firstName },
      data.confirmToken
    );
  },
  migration_password_reset: async (data) => {
    await emailService.sendPasswordResetEmail(
      { email: data.email, firstName: data.firstName },
      data.resetToken
    );
  },
  order_token: async (data) => {
    await emailService.sendOrderTokenEmail(
      { email: data.email, firstName: data.firstName },
      {
        id: data.orderId,
        verificationToken: data.verificationToken,
        tokenExpiration: data.tokenExpiration,
      }
    );
  },
  order_confirmation: async (data) => {
    await emailService.sendOrderConfirmationEmail(
      { email: data.email, firstName: data.firstName },
      {
        id: data.orderId,
        totalPrice: data.totalPrice,
        cancelToken: data.cancelToken,
      }
    );
  },
  order_status_update: async (data) => {
    await emailService.sendOrderStatusUpdateEmail(
      { email: data.email, firstName: data.firstName },
      { id: data.orderId, status: data.newStatus }
    );
  },
  order_cancelled: async (data) => {
    await emailService.sendOrderCancelledEmail(
      { email: data.email, firstName: data.firstName },
      { id: data.orderId }
    );
  },
  admin_new_order: async (data) => {
    await emailService.notifyAdminNewOrder({
      id: data.orderId,
      buyerInfo: { email: data.email, firstName: data.firstName },
      totalPrice: data.totalPrice,
    });
  },
  admin_order_cancelled: async (data) => {
    await emailService.notifyAdminOrderCancelled({
      id: data.orderId,
      buyerInfo: { email: data.email, firstName: data.firstName },
    });
  },
  admin_new_contact: async (data) => {
    await emailService.notifyAdminNewContact({
      id: data.contactId,
      firstName: data.firstName,
      email: data.email,
      title: data.title,
    });
  },
  newsletter_welcome: async (data) => {
    await emailService.sendNewsletterWelcomeEmail({ email: data.email, firstName: data.firstName });
  },
};

export async function retryFailedEmails() {
  logInfo("Starting email retry job");

  try {
    let failedEmails = [];
    try {
      if (fs.existsSync(FAILED_EMAILS_LOG)) {
        const data = fs.readFileSync(FAILED_EMAILS_LOG, "utf8");
        failedEmails = JSON.parse(data);
      }
    } catch (err) {
      logError("Failed to read failed emails log for retry", err);
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    if (!Array.isArray(failedEmails) || failedEmails.length === 0) {
      logInfo("No failed emails to retry");
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const remaining = [];
    let succeeded = 0;

    for (const failed of failedEmails) {
      if (failed.attempts >= (failed.maxAttempts || 3)) {
        logInfo("Max retry attempts reached, discarding", {
          type: failed.type,
          email: failed.email,
          attempts: failed.attempts,
        });
        continue;
      }

      const handler = RETRY_HANDLERS[failed.type];
      if (!handler) {
        logError("No retry handler found", null, { type: failed.type });
        continue;
      }

      try {
        await handler(failed);
        succeeded++;
        logInfo("Successfully retried email", {
          type: failed.type,
          email: failed.email,
          attempt: failed.attempts + 1,
        });
      } catch (error) {
        failed.attempts = (failed.attempts || 0) + 1;
        failed.lastAttempt = new Date().toISOString();
        failed.lastError = error.message;
        remaining.push(failed);
        logError("Retry attempt failed", error, {
          type: failed.type,
          email: failed.email,
          attempt: failed.attempts,
        });
      }
    }

    fs.writeFileSync(FAILED_EMAILS_LOG, JSON.stringify(remaining, null, 2));

    logInfo("Email retry job completed", {
      total: failedEmails.length,
      succeeded,
      remaining: remaining.length,
    });

    return { processed: failedEmails.length, succeeded, failed: remaining.length };
  } catch (error) {
    logError("Email retry job failed", error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
}