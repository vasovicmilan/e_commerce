import { body, param } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateCustomerUpdate = [
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

  body("acceptance")
    .optional()
    .isIn(["true", "false", "0", "1", true, false]).withMessage("Neispravna vrednost za acceptance"),

  collectValidationErrors,
];

export const validateCustomerId = [
  param("customerId")
    .isMongoId().withMessage("Neispravan ID kupca"),

  collectValidationErrors,
];

export default {
  validateCustomerUpdate,
  validateCustomerId,
};