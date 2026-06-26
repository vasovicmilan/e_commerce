import eventEmitter from "../event.emitter.js";
import * as telegramService from "../../services/telegram.service.js";
import {
  buildNewOrderMessage,
  buildCancelledOrderMessage,
  buildStatusChangeMessage,
  buildNewContactMessage,
  buildNewTestimonialMessage,
  buildLowStockMessage,
  buildOutOfStockMessage,
  buildNewUserMessage,
} from "../../utils/telegram-message.util.js";
import { logInfo, logError } from "../../utils/logger.util.js";

export function registerTelegramListeners() {

  eventEmitter.on("order:confirmed", async ({ orderId, email, firstName, totalPrice }) => {
    try {
      const message = buildNewOrderMessage({
        id: orderId,
        buyerInfo: { email, firstName },
        totalPrice,
      });
      await telegramService.sendTelegramMessage("ORDERS", message);
      logInfo("Telegram: New order notification sent", { orderId });
    } catch (err) {
      logError("Telegram: Failed to send new order notification", err, { orderId });
    }
  });

  eventEmitter.on("order:cancelled", async ({ orderId, email, firstName, cancelledBy }) => {
    try {
      const message = buildCancelledOrderMessage({
        id: orderId,
        buyerInfo: { email, firstName },
      });
      await telegramService.sendTelegramMessage("ORDERS", message);
      logInfo("Telegram: Cancelled order notification sent", { orderId, cancelledBy });
    } catch (err) {
      logError("Telegram: Failed to send cancelled order notification", err, { orderId });
    }
  });

  eventEmitter.on("order:status_changed", async ({ orderId, email, firstName, oldStatus, newStatus }) => {
    try {
      const message = buildStatusChangeMessage(
        { id: orderId, buyerInfo: { email, firstName } },
        oldStatus,
        newStatus
      );
      await telegramService.sendTelegramMessage("ORDERS", message);
      logInfo("Telegram: Status change notification sent", { orderId, oldStatus, newStatus });
    } catch (err) {
      logError("Telegram: Failed to send status change notification", err, { orderId });
    }
  });

  eventEmitter.on("contact:created", async ({ id, email, firstName, title, message: msg }) => {
    try {
      const notificationMessage = buildNewContactMessage({
        id,
        firstName,
        email,
        title,
        message: msg,
      });
      await telegramService.sendTelegramMessage("CONTACTS", notificationMessage);
      logInfo("Telegram: New contact notification sent", { contactId: id });
    } catch (err) {
      logError("Telegram: Failed to send new contact notification", err, { contactId: id });
    }
  });

  eventEmitter.on("testimonial:submitted", async ({ id, email, displayName, rating, title, comment }) => {
    try {
      const message = buildNewTestimonialMessage({
        id,
        displayName,
        email,
        rating,
        title,
        comment,
      });
      await telegramService.sendTelegramMessage("TESTIMONIALS", message);
      logInfo("Telegram: New testimonial notification sent", { testimonialId: id });
    } catch (err) {
      logError("Telegram: Failed to send new testimonial notification", err, { testimonialId: id });
    }
  });

  eventEmitter.on("item:low_stock", async ({ itemId, title, sku, variationId, size, color, amount }) => {
    try {
      const message = buildLowStockMessage({ id: itemId, title, sku, variationId, size, color, amount });
      await telegramService.sendTelegramMessage("STOCKS", message);
      logInfo("Telegram: Low stock notification sent", { itemId, amount });
    } catch (err) {
      logError("Telegram: Failed to send low stock notification", err, { itemId });
    }
  });

  eventEmitter.on("item:out_of_stock", async ({ itemId, title, sku, variationId, size, color }) => {
    try {
      const message = buildOutOfStockMessage({ id: itemId, title, sku, variationId, size, color });
      await telegramService.sendTelegramMessage("STOCKS", message);
      logInfo("Telegram: Out of stock notification sent", { itemId });
    } catch (err) {
      logError("Telegram: Failed to send out of stock notification", err, { itemId });
    }
  });

  eventEmitter.on("user:registered", async ({ email, firstName, lastName, provider }) => {
    try {
      const message = buildNewUserMessage({ email, firstName, lastName, provider: provider || "local" });
      await telegramService.sendTelegramMessage("USERS", message);
      logInfo("Telegram: New user notification sent", { email });
    } catch (err) {
      logError("Telegram: Failed to send new user notification", err, { email });
    }
  });

  logInfo("Telegram listeners registered");
}