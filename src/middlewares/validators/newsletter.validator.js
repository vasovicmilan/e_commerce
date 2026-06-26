import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateNewsletterSubscribe = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Ime može imati najviše 50 karaktera"),

  body("acceptance")
    .optional()
    .isIn(["true", "false", "0", "1", true, false]).withMessage("Neispravna vrednost"),

  collectValidationErrors,
];

export const validateNewsletterStatus = [
  body("isActive")
    .isBoolean().withMessage("isActive mora biti boolean"),

  collectValidationErrors,
];

export const validateNewsletterId = [
  param("newsletterId")
    .isMongoId().withMessage("Neispravan ID"),

  collectValidationErrors,
];

export default {
  validateNewsletterSubscribe,
  validateNewsletterStatus,
  validateNewsletterId,
};