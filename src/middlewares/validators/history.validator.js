import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateHistoryId = [
  param("historyId")
    .isMongoId().withMessage("Neispravan ID istorije"),
  collectValidationErrors,
];

export const validateHistoryCreate = [
  body("partnerId")
    .isMongoId().withMessage("Neispravan ID partnera"),
  body("type")
    .isIn(["earnings", "withdrawal", "level_up", "bonus", "adjustment", "shop_activation", "offer_created"])
    .withMessage("Neispravan tip"),
  body("amount")
    .optional()
    .isNumeric().withMessage("Iznos mora biti broj"),
  body("description")
    .optional()
    .trim(),
  body("orderId")
    .optional()
    .isMongoId().withMessage("Neispravan ID porudžbine"),
  collectValidationErrors,
];

export default {
  validateHistoryId,
  validateHistoryCreate,
};