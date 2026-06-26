import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateContactCreate = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("Ime je obavezno")
    .isLength({ min: 2, max: 50 }).withMessage("Ime mora imati između 2 i 50 karaktera"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email je obavezan")
    .isEmail().withMessage("Neispravan email format")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("title")
    .trim()
    .notEmpty().withMessage("Naslov je obavezan")
    .isLength({ min: 3, max: 200 }).withMessage("Naslov mora imati između 3 i 200 karaktera"),

  body("message")
    .trim()
    .notEmpty().withMessage("Poruka je obavezna")
    .isLength({ min: 10, max: 5000 }).withMessage("Poruka mora imati između 10 i 5000 karaktera"),

  body("telephoneNumber")
    .optional()
    .trim(),

  body("acceptance")
    .optional()
    .isIn(["true", "false", "0", "1", true, false]).withMessage("Neispravna vrednost"),

  collectValidationErrors,
];

export const validateContactStatus = [
  body("status")
    .trim()
    .notEmpty().withMessage("Status je obavezan")
    .isIn(["new", "read", "replied", "archived"]).withMessage("Status mora biti: new, read, replied ili archived"),

  collectValidationErrors,
];

// ============================================================
//  ID PARAM
// ============================================================

export const validateContactId = [
  param("contactId")
    .isMongoId().withMessage("Neispravan ID poruke"),

  collectValidationErrors,
];

export default {
  validateContactCreate,
  validateContactStatus,
  validateContactId,
};