import { body } from "express-validator";
import { collectValidationErrors } from "./collect.validation.errors.js";

export const validateHoneypot = [
  body("nickname")
    .optional()
    .custom((value) => {
      if (value && value.trim() !== "") {
        throw new Error("Spam detected");
      }
      return true;
    }),

  body("website")
    .optional()
    .custom((value) => {
      if (value && value.trim() !== "") {
        throw new Error("Spam detected");
      }
      return true;
    }),

  collectValidationErrors,
];

export default {
  validateHoneypot,
};