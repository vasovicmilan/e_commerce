import { body, param, query } from "express-validator";
import { getAllowedStatuses } from "../../models/order-status-transitions.js";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateOrderStatusUpdate = [
  body("status")
    .trim()
    .notEmpty().withMessage("Status je obavezan")
    .isIn([
      "pending", "confirmed", "processing", "shipped",
      "delivered", "completed", "cancelled", "returned", "refunded", "failed",
    ]).withMessage("Neispravan status"),

  collectValidationErrors,
];

export const validateOrderCancel = [
  body("orderId")
    .trim()
    .notEmpty().withMessage("ID porudžbine je obavezan")
    .isMongoId().withMessage("Neispravan ID porudžbine"),

  collectValidationErrors,
];

export const validateOrderCancelByToken = [
  body("cancelToken")
    .trim()
    .notEmpty().withMessage("Token je obavezan"),

  collectValidationErrors,
];

export const validateOrderId = [
  param("orderId")
    .isMongoId().withMessage("Neispravan ID porudžbine"),

  collectValidationErrors,
];

export default {
  validateOrderStatusUpdate,
  validateOrderCancel,
  validateOrderCancelByToken,
  validateOrderId,
};