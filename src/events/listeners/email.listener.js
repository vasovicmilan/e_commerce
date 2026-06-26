import eventEmitter from "../event.emitter.js";
import * as emailService from "../../services/email.service.js";
import * as couponService from "../../services/coupon.service.js";
import { generateOrderPdf } from "../../services/pdf.service.js";
import { mapOrderToPdfModel } from "../../mappers/order.mapper.js"; // ✅ added
import { logInfo, logError } from "../../utils/logger.util.js";

const WELCOME_COUPON_CODE = "WELCOME2026";

export function registerEmailListeners() {
  // ==================== USER EVENTS ====================

  eventEmitter.on("user:registered", async ({ email, firstName, userId, confirmToken }) => {
    try {
      logInfo("Processing user:registered event", { email });

      let coupon = null;
      try {
        coupon = await couponService.getCouponByCode(WELCOME_COUPON_CODE);
      } catch (err) {
        try {
          coupon = await couponService.createCoupon({
            code: WELCOME_COUPON_CODE,
            discountType: "percentage",
            discountValue: 10,
            usageLimit: null,
            usagePerUser: 1,
            minCartAmount: 0,
            isActive: true,
            validFrom: new Date(),
            validUntil: new Date("2026-12-31T23:59:59.999Z"),
            allowedUsers: [],
          });
          logInfo("Welcome coupon created", { code: WELCOME_COUPON_CODE });
        } catch (createErr) {
          logError("Failed to create welcome coupon", createErr);
        }
      }

      if (coupon) {
        try {
          const couponData = {
            code: coupon.osnovno.kod,
            discountValue: coupon.osnovno.vrednost,
            discountType: coupon.osnovno.tipRaw,
          };
          await emailService.sendWelcomeEmailWithCoupon({ email, firstName }, couponData);
          logInfo("Welcome email with coupon sent", { email });
        } catch (err) {
          logError("Failed to send welcome email with coupon", err, { email });
          eventEmitter.emit("email:failed", {
            type: "welcome_coupon",
            email,
            firstName,
            error: err.message,
            timestamp: new Date(),
          });
        }
      }

      try {
        await emailService.sendAccountConfirmationEmail({ email, firstName }, confirmToken);
        logInfo("Confirmation email sent", { email });
      } catch (err) {
        logError("Failed to send confirmation email", err, { email });
        eventEmitter.emit("email:failed", {
          type: "account_confirmation",
          email,
          firstName,
          confirmToken,
          error: err.message,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      logError("Unhandled error in user:registered", err);
    }
  });

  eventEmitter.on("user:password_reset_requested", async ({ email, firstName, resetToken }) => {
    try {
      await emailService.sendPasswordResetEmail({ email, firstName }, resetToken);
      logInfo("Password reset email sent", { email });
    } catch (err) {
      logError("Failed to send password reset email", err, { email });
      eventEmitter.emit("email:failed", {
        type: "password_reset",
        email,
        firstName,
        resetToken,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  eventEmitter.on("user:password_changed", async ({ email, firstName }) => {
    try {
      await emailService.sendPasswordChangedEmail({ email, firstName });
      logInfo("Password changed notification sent", { email });
    } catch (err) {
      logError("Failed to send password changed notification", err, { email });
      eventEmitter.emit("email:failed", {
        type: "password_changed",
        email,
        firstName,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  eventEmitter.on("user:deactivated", async ({ email, firstName }) => {
    try {
      await emailService.sendAccountDeactivatedEmail({ email, firstName });
      logInfo("Deactivation notification sent", { email });
    } catch (err) {
      logError("Failed to send deactivation notification", err, { email });
      eventEmitter.emit("email:failed", {
        type: "account_deactivated",
        email,
        firstName,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  eventEmitter.on("user:migrated", async ({ email, firstName, confirmToken, resetToken }) => {
    try {
      logInfo("Processing user:migrated event", { email });

      await emailService.sendAccountConfirmationEmail({ email, firstName }, confirmToken);
      logInfo("Migration confirmation email sent", { email });

      await emailService.sendPasswordResetEmail({ email, firstName }, resetToken);
      logInfo("Migration password reset email sent", { email });
    } catch (err) {
      logError("Failed to process user:migrated", err, { email });
    }
  });

  // ==================== ORDER EVENTS ====================

  eventEmitter.on("temporary-order:created", async ({ orderId, email, firstName, verificationToken, tokenExpiration }) => {
    try {
      await emailService.sendOrderTokenEmail(
        { email, firstName },
        { id: orderId, verificationToken, tokenExpiration }
      );
      logInfo("Order verification token sent", { email, orderId });
    } catch (err) {
      logError("Failed to send order verification token", err, { email, orderId });
      eventEmitter.emit("email:failed", {
        type: "order_token",
        email,
        firstName,
        orderId,
        verificationToken,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  // ---------- ORDER CONFIRMED ----------
  eventEmitter.on("order:confirmed", async ({ order, email, firstName }) => {
    try {
      if (!order || !order._id) {
        logError("Invalid order object in order:confirmed", { order, email });
        return;
      }

      logInfo("Processing order:confirmed event", { orderId: order._id, email });

      let pdfBuffer = null;
      try {
        // ✅ Convert to PDF model first – normalizes image field
        const pdfOrder = mapOrderToPdfModel(order);
        pdfBuffer = await generateOrderPdf(pdfOrder);
        logInfo("PDF generated", { orderId: order._id });
      } catch (err) {
        logError("Failed to generate PDF for order", err, { orderId: order._id });
        // Continue without PDF
      }

      await emailService.sendOrderConfirmationEmail(
        { email, firstName },
        order,
        pdfBuffer
      );
      logInfo("Order confirmation email sent", { email, orderId: order._id });

      await emailService.notifyAdminNewOrder(order, pdfBuffer);
      logInfo("Admin notified of new order", { orderId: order._id });
    } catch (err) {
      logError("Unhandled error in order:confirmed", err, { orderId: order?._id, email });
      eventEmitter.emit("email:failed", {
        type: "order_confirmation",
        email,
        firstName,
        orderId: order?._id,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  // ---------- ORDER STATUS CHANGED ----------
  eventEmitter.on("order:status_changed", async ({ order, email, firstName, oldStatus, newStatus }) => {
    try {
      if (!order || !order._id) {
        logError("Invalid order object in order:status_changed", { order, email });
        return;
      }

      logInfo("Processing order:status_changed", { orderId: order._id, email, oldStatus, newStatus });

      await emailService.sendOrderStatusUpdateEmail(
        { email, firstName },
        order
      );
      logInfo("Order status update email sent", { email, orderId: order._id });
    } catch (err) {
      logError("Failed to send order status update email", err, { email, orderId: order?._id });
      eventEmitter.emit("email:failed", {
        type: "order_status_update",
        email,
        firstName,
        orderId: order?._id,
        oldStatus,
        newStatus,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  // ---------- ORDER CANCELLED ----------
  eventEmitter.on("order:cancelled", async ({ order, email, firstName, cancelledBy }) => {
    try {
      if (!order || !order._id) {
        logError("Invalid order object in order:cancelled", { order, email });
        return;
      }

      logInfo("Processing order:cancelled event", { orderId: order._id, email, cancelledBy });

      await emailService.sendOrderCancelledEmail(
        { email, firstName },
        order
      );
      logInfo("Order cancellation email sent", { email, orderId: order._id });

      await emailService.notifyAdminOrderCancelled(order);
      logInfo("Admin notified of cancelled order", { orderId: order._id });
    } catch (err) {
      logError("Failed to process order:cancelled", err, { orderId: order?._id, email });
      eventEmitter.emit("email:failed", {
        type: "order_cancelled",
        email,
        firstName,
        orderId: order?._id,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  // ==================== OTHER EVENTS ====================

  eventEmitter.on("contact:created", async ({ id, email, firstName, title }) => {
    try {
      await emailService.notifyAdminNewContact({ id, firstName, email, title });
      logInfo("Admin notified of new contact", { email, contactId: id });
    } catch (err) {
      logError("Failed to notify admin of new contact", err, { email, contactId: id });
      eventEmitter.emit("email:failed", {
        type: "admin_new_contact",
        contactId: id,
        email,
        firstName,
        title,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  eventEmitter.on("newsletter:subscribed", async ({ email, firstName }) => {
    try {
      await emailService.sendNewsletterWelcomeEmail({ email, firstName });
      logInfo("Newsletter welcome email sent", { email });
    } catch (err) {
      logError("Failed to send newsletter welcome email", err, { email });
      eventEmitter.emit("email:failed", {
        type: "newsletter_welcome",
        email,
        firstName,
        error: err.message,
        timestamp: new Date(),
      });
    }
  });

  eventEmitter.on("testimonial:submitted", async ({ id, email, displayName, rating, title }) => {
    logInfo("New testimonial submitted", {
      testimonialId: id,
      email,
      displayName,
      rating,
    });
  });

  eventEmitter.on("item:low_stock", async ({ itemId, title, variationId, size, color, amount }) => {
    try {
      await emailService.notifyAdminLowStock({
        id: itemId,
        title,
        naziv: title,
      });
      logInfo("Admin notified of low stock", { itemId, title, amount });
    } catch (err) {
      logError("Failed to notify admin of low stock", err, { itemId });
    }
  });

  eventEmitter.on("item:out_of_stock", async ({ itemId, title, variationId, size, color }) => {
    try {
      await emailService.notifyAdminOutOfStock({
        id: itemId,
        title,
        naziv: title,
      });
      logInfo("Admin notified of out of stock", { itemId, title });
    } catch (err) {
      logError("Failed to notify admin of out of stock", err, { itemId });
    }
  });

  logInfo("Email listeners registered");
}