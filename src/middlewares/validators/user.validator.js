import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateUserUpdate = [
  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Ime mora imati između 2 i 50 karaktera"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Prezime mora imati između 2 i 50 karaktera"),

  body("role")
    .optional()
    .isMongoId().withMessage("Neispravan ID role"),

  body("status")
    .optional()
    .isIn(["pending", "active", "inactive", "suspended"]).withMessage("Neispravan status"),

  body("acceptance")
    .optional()
    .isIn(["true", "false", "0", "1", true, false]).withMessage("Neispravna vrednost"),

  collectValidationErrors,
];

export const validateUserStatus = [
  body("status")
    .trim()
    .notEmpty().withMessage("Status je obavezan")
    .isIn(["pending", "active", "inactive", "suspended"]).withMessage("Neispravan status"),

  collectValidationErrors,
];

export const validateUserRole = [
  body("role")
    .trim()
    .notEmpty().withMessage("Rola je obavezna")
    .isMongoId().withMessage("Neispravan ID role"),

  collectValidationErrors,
];

export const validateUserId = [
  param("userId")
    .isMongoId().withMessage("Neispravan ID korisnika"),

  collectValidationErrors,
];

export const validateUserPartner = [
  body("isPartner")
    .optional()
    .isIn(["true", "false", "1", "0"])
    .withMessage("isPartner mora biti true ili false"),
];

export default {
  validateUserUpdate,
  validateUserStatus,
  validateUserRole,
  validateUserId,
  validateUserPartner,
};