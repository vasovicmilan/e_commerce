import { body } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateCSRF = [
  body("CSRFToken")
    .exists().withMessage("CSRF token je obavezan")
    .bail()
    .isString().withMessage("CSRF token mora biti string")
    .notEmpty().withMessage("CSRF token ne može biti prazan"),

  collectValidationErrors,
];

export default {
  validateCSRF,
};